import { defaultSettings, AppSettings } from "./lib/settings"
export {}

let lruTabs: number[] = []

// Set of tab IDs that should be discarded as soon as their title loads
const pendingDiscard = new Set<number>()

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
  const rawSettings = await chrome.storage.sync.get(defaultSettings)
  const settings = rawSettings as AppSettings

  const allTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
  const activeTabs = allTabs.filter((t) => !t.discarded)

  const activeTabIds = new Set(activeTabs.map((t) => t.id))
  lruTabs = lruTabs.filter((id) => activeTabIds.has(id))

  for (const tab of activeTabs) {
    if (tab.id && !lruTabs.includes(tab.id)) {
      lruTabs.unshift(tab.id)
    }
  }

  if (lruTabs.length > settings.maxActiveTabs) {
    const tabsToDiscard = lruTabs.slice(0, lruTabs.length - settings.maxActiveTabs)
    for (const tabId of tabsToDiscard) {
      const tab = activeTabs.find((t) => t.id === tabId)
      if (tab && !tab.active) {
        chrome.tabs.discard(tabId)
        removeTabFromLru(tabId)
      }
    }
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  pendingDiscard.delete(activeInfo.tabId) // Cancel discard if user focuses it
  const tab = await chrome.tabs.get(activeInfo.tabId)
  if (tab.url?.includes("youtube.com")) {
    markTabAsUsed(activeInfo.tabId)
  }
  manageRam()
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url?.includes("youtube.com")) {
    const rawSettings = await chrome.storage.sync.get(defaultSettings)
    const settings = rawSettings as AppSettings

    // If it's a background tab waiting to be discarded, do it as soon as we get a real title
    if (settings.autoUnload && pendingDiscard.has(tabId) && changeInfo.title && changeInfo.title !== "YouTube" && !changeInfo.title.startsWith("http")) {
      chrome.tabs.discard(tabId)
      pendingDiscard.delete(tabId)
      return
    }

    if (changeInfo.status === "complete" && !tab.discarded) {
      markTabAsUsed(tabId)
      manageRam()
    }
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabFromLru(tabId)
  pendingDiscard.delete(tabId)
})

// Fallback routing logic (if opened normally without our click interceptor)
chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.id) return
  let url = tab.url || tab.pendingUrl
  
  // If it's a background youtube tab, schedule it for instant discard
  if (url && url.includes("youtube.com") && !tab.active) {
    pendingDiscard.add(tab.id)
  }

  if (tab.openerTabId) {
     const opener = await chrome.tabs.get(tab.openerTabId)
     if (opener.url?.includes("youtube.com") && opener.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        chrome.tabs.group({ groupId: opener.groupId, tabIds: tab.id })
     }
  }
})

// Context menu and side panel setup
chrome.runtime.onInstalled.addListener(() => {
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

  refreshContextMenus()
})

async function refreshContextMenus() {
  const groups = await chrome.tabGroups.query({})
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
      if (newTab.id) pendingDiscard.add(newTab.id)
      const groupId = await chrome.tabs.group({ tabIds: newTab.id })
      await chrome.tabGroups.update(groupId, { title: "YouTube Queue", color: "red" })
    } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("queue-")) {
      const groupId = parseInt(info.menuItemId.replace("queue-", ""))
      const newTab = await chrome.tabs.create({ url: info.linkUrl, active: false })
      if (newTab.id) pendingDiscard.add(newTab.id)
      await chrome.tabs.group({ tabIds: newTab.id, groupId })
    }
  }
})

// Handle manual background opening from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openBackground" && request.url && sender.tab) {
    (async () => {
      // 1. Create tab right next to the current one so it doesn't flash at the end
      const newTab = await chrome.tabs.create({ 
        url: request.url, 
        active: false, 
        index: sender.tab.index + 1,
        openerTabId: sender.tab.id
      })
      
      // 2. Immediately group it into the same group
      if (sender.tab.groupId && sender.tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && newTab.id) {
        await chrome.tabs.group({ tabIds: newTab.id, groupId: sender.tab.groupId })
      }

      // 3. Queue it for instant discard once title loads
      if (newTab.id) {
        pendingDiscard.add(newTab.id)
      }
    })()
    return true
  }
})
