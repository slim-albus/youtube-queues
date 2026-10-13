import { defaultSettings, AppSettings } from "./lib/settings"
export {}

let lruTabs: number[] = []

// Set of tab IDs that should be discarded as soon as their title loads
const pendingDiscard = new Set<number>()

// Extract YouTube video ID from various URL patterns
export function extractVideoId(url?: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null
      }
    } else if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null
    }
  } catch {
    return null
  }
  return null
}

// Find if any open tab already has this video ID open
async function findDuplicateTab(videoId: string, excludeTabId?: number): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id === excludeTabId) continue
    const targetUrl = tab.url || tab.pendingUrl
    if (!targetUrl) continue
    const vId = extractVideoId(targetUrl)
    if (vId && vId === videoId) {
      return tab
    }
  }
  return null
}

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
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.url?.includes("youtube.com")) {
      markTabAsUsed(activeInfo.tabId)
    }
    manageRam()
  } catch {
    // Ignore if tab was closed
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check duplicate URL on navigation
  if (changeInfo.url) {
    const vId = extractVideoId(changeInfo.url)
    if (vId) {
      const rawSettings = await chrome.storage.sync.get(defaultSettings)
      const settings = rawSettings as AppSettings
      if (settings.duplicateCheckBehavior === "focus_existing") {
        const dup = await findDuplicateTab(vId, tabId)
        if (dup && dup.id) {
          chrome.tabs.remove(tabId).catch(() => {})
          if (dup.windowId) chrome.windows.update(dup.windowId, { focused: true })
          chrome.tabs.update(dup.id, { active: true })
          return
        }
      }
    }
  }

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
  
  if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
    const rawSettings = await chrome.storage.sync.get(defaultSettings)
    const settings = rawSettings as AppSettings

    // Duplicate check
    const videoId = extractVideoId(url)
    if (videoId && settings.duplicateCheckBehavior === "focus_existing") {
      const dup = await findDuplicateTab(videoId, tab.id)
      if (dup && dup.id) {
        // Switch to duplicate tab instead of creating a new one
        chrome.tabs.remove(tab.id).catch(() => {})
        if (dup.windowId) chrome.windows.update(dup.windowId, { focused: true })
        chrome.tabs.update(dup.id, { active: true })
        return
      }
    }

    // If it's a background youtube tab, schedule it for instant discard
    if (!tab.active) {
      pendingDiscard.add(tab.id)
    }
  }

  if (tab.openerTabId) {
    try {
      const opener = await chrome.tabs.get(tab.openerTabId)
      if (opener.url?.includes("youtube.com") && opener.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        await chrome.tabs.group({ groupId: opener.groupId, tabIds: tab.id })
        
        const rawSettings = await chrome.storage.sync.get(defaultSettings)
        const settings = rawSettings as AppSettings
        if (settings.keepBrowserGroupsCollapsed) {
          chrome.tabGroups.update(opener.groupId, { collapsed: true }).catch(() => {})
        }
      }
    } catch {
      // Opener might be closed
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
  if (info.linkUrl && (info.linkUrl.includes("youtube.com") || info.linkUrl.includes("youtu.be"))) {
    const rawSettings = await chrome.storage.sync.get(defaultSettings)
    const settings = rawSettings as AppSettings

    // Duplicate check for context menu link clicks
    const videoId = extractVideoId(info.linkUrl)
    if (videoId && settings.duplicateCheckBehavior === "focus_existing") {
      const dup = await findDuplicateTab(videoId)
      if (dup && dup.id) {
        if (dup.windowId) await chrome.windows.update(dup.windowId, { focused: true })
        await chrome.tabs.update(dup.id, { active: true })
        return
      }
    }

    if (info.menuItemId === "queue-new") {
      const newTab = await chrome.tabs.create({ url: info.linkUrl, active: false })
      if (newTab.id) pendingDiscard.add(newTab.id)
      const groupId = await chrome.tabs.group({ tabIds: newTab.id })
      await chrome.tabGroups.update(groupId, { 
        title: "YouTube Queue", 
        color: "red",
        collapsed: settings.keepBrowserGroupsCollapsed
      })
    } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("queue-")) {
      const groupId = parseInt(info.menuItemId.replace("queue-", ""))
      const newTab = await chrome.tabs.create({ url: info.linkUrl, active: false })
      if (newTab.id) pendingDiscard.add(newTab.id)
      await chrome.tabs.group({ tabIds: newTab.id, groupId })
      if (settings.keepBrowserGroupsCollapsed) {
        await chrome.tabGroups.update(groupId, { collapsed: true }).catch(() => {})
      }
    }
  }
})

// Handle manual tab opening and control messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Open in background (Queue)
  if (request.action === "openBackground" && request.url && sender.tab) {
    (async () => {
      const rawSettings = await chrome.storage.sync.get(defaultSettings)
      const settings = rawSettings as AppSettings

      // Check for duplicate video
      const videoId = extractVideoId(request.url)
      if (videoId && settings.duplicateCheckBehavior === "focus_existing") {
        const dup = await findDuplicateTab(videoId)
        if (dup && dup.id) {
          if (dup.windowId) await chrome.windows.update(dup.windowId, { focused: true })
          await chrome.tabs.update(dup.id, { active: true })
          sendResponse({ duplicate: true, tabId: dup.id })
          return
        }
      }

      // 1. Create tab right next to current tab
      const newTab = await chrome.tabs.create({ 
        url: request.url, 
        active: false, 
        index: sender.tab.index + 1,
        openerTabId: sender.tab.id
      })
      
      // 2. Immediately group it into the same group
      if (sender.tab.groupId && sender.tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && newTab.id) {
        await chrome.tabs.group({ tabIds: newTab.id, groupId: sender.tab.groupId })
        if (settings.keepBrowserGroupsCollapsed) {
          await chrome.tabGroups.update(sender.tab.groupId, { collapsed: true }).catch(() => {})
        }
      }

      // 3. Queue it for instant discard once title loads
      if (newTab.id) {
        pendingDiscard.add(newTab.id)
      }
      sendResponse({ success: true, tabId: newTab.id })
    })()
    return true
  }

  // Open in new active tab
  if (request.action === "openTab" && request.url && sender.tab) {
    (async () => {
      const rawSettings = await chrome.storage.sync.get(defaultSettings)
      const settings = rawSettings as AppSettings

      // Check for duplicate video
      const videoId = extractVideoId(request.url)
      if (videoId && settings.duplicateCheckBehavior === "focus_existing") {
        const dup = await findDuplicateTab(videoId)
        if (dup && dup.id) {
          if (dup.windowId) await chrome.windows.update(dup.windowId, { focused: true })
          await chrome.tabs.update(dup.id, { active: true })
          sendResponse({ duplicate: true, tabId: dup.id })
          return
        }
      }

      const newTab = await chrome.tabs.create({
        url: request.url,
        active: true,
        index: sender.tab.index + 1,
        openerTabId: sender.tab.id
      })

      if (sender.tab.groupId && sender.tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && newTab.id) {
        await chrome.tabs.group({ tabIds: newTab.id, groupId: sender.tab.groupId })
      }
      sendResponse({ success: true, tabId: newTab.id })
    })()
    return true
  }

  // Discard single tab
  if (request.action === "discardTab" && request.tabId) {
    chrome.tabs.discard(request.tabId).catch(() => {})
    removeTabFromLru(request.tabId)
    sendResponse({ success: true })
    return true
  }

  // Discard all other tabs (keep active loaded)
  if (request.action === "discardAllOtherTabs") {
    (async () => {
      const allTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
      for (const tab of allTabs) {
        if (!tab.active && !tab.discarded && tab.id) {
          chrome.tabs.discard(tab.id).catch(() => {})
          removeTabFromLru(tab.id)
        }
      }
      sendResponse({ success: true })
    })()
    return true
  }
})
