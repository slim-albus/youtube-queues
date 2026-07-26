export {}

const MAX_ACTIVE_TABS = 5
let lruTabs: number[] = []

// Helper to remove tab from LRU
function removeTabFromLru(tabId: number) {
  lruTabs = lruTabs.filter((id) => id !== tabId)
}

// Helper to mark tab as recently used
function markTabAsUsed(tabId: number) {
  removeTabFromLru(tabId)
  lruTabs.push(tabId)
}

// Handle RAM manager
async function manageRam() {
  const allTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
  const activeTabs = allTabs.filter((t) => !t.discarded)

  // Sync lruTabs with currently active tabs (remove closed ones)
  const activeTabIds = new Set(activeTabs.map((t) => t.id))
  lruTabs = lruTabs.filter((id) => activeTabIds.has(id))

  // Add any active tabs missing from lruTabs (to the beginning, so they are the oldest)
  for (const tab of activeTabs) {
    if (tab.id && !lruTabs.includes(tab.id)) {
      lruTabs.unshift(tab.id)
    }
  }

  // Discard oldest tabs if over limit
  if (lruTabs.length > MAX_ACTIVE_TABS) {
    const tabsToDiscard = lruTabs.slice(0, lruTabs.length - MAX_ACTIVE_TABS)
    for (const tabId of tabsToDiscard) {
      const tab = activeTabs.find((t) => t.id === tabId)
      // Don't discard the currently active tab in the window
      if (tab && !tab.active) {
        chrome.tabs.discard(tabId)
        removeTabFromLru(tabId)
      }
    }
  }
}

// Track tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId)
  if (tab.url?.includes("youtube.com")) {
    markTabAsUsed(activeInfo.tabId)
  }
  manageRam()
})

// Track new/updated tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url?.includes("youtube.com")) {
    if (changeInfo.status === "complete") {
      if (!tab.discarded) {
        markTabAsUsed(tabId)
        manageRam()
      }
    }
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabFromLru(tabId)
})

// Group routing logic
chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.id) return

  // Wait briefly for URL to be available if it's pending
  let url = tab.url || tab.pendingUrl
  if (!url && tab.openerTabId) {
     const opener = await chrome.tabs.get(tab.openerTabId)
     if (opener.url?.includes("youtube.com") && opener.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // If opened from a grouped youtube tab, group it
        chrome.tabs.group({ groupId: opener.groupId, tabIds: tab.id })
     }
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Fallback if onCreated didn't have URL but it loaded now
    if (changeInfo.url && tab.openerTabId) {
        const opener = await chrome.tabs.get(tab.openerTabId)
        if (opener.url?.includes("youtube.com") && opener.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
                 chrome.tabs.group({ groupId: opener.groupId, tabIds: tabId })
            }
        }
    }
})

// Context menu and side panel setup
chrome.runtime.onInstalled.addListener(() => {
  // Allow opening side panel on extension icon click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  }

  chrome.contextMenus.create({
    id: "youtube-queues-root",
    title: "Open in YouTube Queue",
    contexts: ["link"],
    documentUrlPatterns: ["*://*/*"]
  })
  
  chrome.contextMenus.create({
    id: "queue-new",
    parentId: "youtube-queues-root",
    title: "Create New Queue",
    contexts: ["link"]
  })

  // We should dynamically add existing queues here, but for now we'll do it on message or periodic refresh
  refreshContextMenus()
})

async function refreshContextMenus() {
  const groups = await chrome.tabGroups.query({})
  
  // First clear existing dynamic menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
        id: "youtube-queues-root",
        title: "Open in YouTube Queue",
        contexts: ["link"],
        documentUrlPatterns: ["*://*/*"]
    })
    
    chrome.contextMenus.create({
        id: "queue-new",
        parentId: "youtube-queues-root",
        title: "Create New Queue",
        contexts: ["link"]
    })
    
    // Add existing groups that have youtube tabs
    chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
        const groupIds = new Set(tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map(t => t.groupId))
        
        for (const groupId of groupIds) {
            const group = groups.find(g => g.id === groupId)
            if (group) {
                chrome.contextMenus.create({
                    id: `queue-${group.id}`,
                    parentId: "youtube-queues-root",
                    title: `Queue: ${group.title || group.color}`,
                    contexts: ["link"]
                })
            }
        }
    })
  })
}

chrome.tabGroups.onUpdated.addListener(() => refreshContextMenus())
chrome.tabGroups.onCreated.addListener(() => refreshContextMenus())
chrome.tabGroups.onRemoved.addListener(() => refreshContextMenus())

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.linkUrl && info.linkUrl.includes("youtube.com")) {
    if (info.menuItemId === "queue-new") {
      const newTab = await chrome.tabs.create({ url: info.linkUrl, active: false })
      const groupId = await chrome.tabs.group({ tabIds: newTab.id })
      await chrome.tabGroups.update(groupId, { title: "YouTube Queue", color: "red" })
    } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("queue-")) {
      const groupId = parseInt(info.menuItemId.replace("queue-", ""))
      const newTab = await chrome.tabs.create({ url: info.linkUrl, active: false })
      await chrome.tabs.group({ tabIds: newTab.id, groupId })
    }
  }
})
