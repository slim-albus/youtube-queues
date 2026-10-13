import type { PlasmoCSConfig } from "plasmo"
import { defaultSettings, AppSettings } from "../lib/settings"

export const config: PlasmoCSConfig = {
  matches: ["*://*.youtube.com/*"],
  all_frames: false
}

// In-memory cached settings for zero-latency synchronous click decisions
let cachedSettings: AppSettings = defaultSettings

chrome.storage.sync.get(defaultSettings, (items) => {
  cachedSettings = { ...defaultSettings, ...(items as AppSettings) }
})

chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(defaultSettings, (items) => {
    cachedSettings = { ...defaultSettings, ...(items as AppSettings) }
  })
})

// Respond to memory inspection requests from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMemory") {
    const perf = window.performance as any
    if (perf && perf.memory) {
      sendResponse({
        usedJSHeapSize: perf.memory.usedJSHeapSize,
        totalJSHeapSize: perf.memory.totalJSHeapSize
      })
    } else {
      sendResponse(null)
    }
    return true
  }
})

// Extract YouTube video ID from URL
function getVideoId(url: URL): string | null {
  if (url.pathname === "/watch") {
    return url.searchParams.get("v")
  }
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] || null
  }
  return null
}

document.addEventListener(
  "click",
  (e) => {
    // Only intercept primary left clicks (button 0)
    if (e.button !== 0) return

    // Find the anchor element traversing shadow DOM boundaries via composedPath
    const path = e.composedPath()
    let anchor: HTMLAnchorElement | null = null
    let isPlaylistPanelItem = false

    for (const el of path) {
      if (el instanceof HTMLElement) {
        if (
          el.tagName.toLowerCase() === "ytd-playlist-panel-video-renderer" ||
          el.classList.contains("ytd-playlist-panel-video-renderer")
        ) {
          isPlaylistPanelItem = true
        }
      }
      if (el instanceof HTMLAnchorElement && el.href) {
        anchor = el
      }
    }

    if (!anchor || !anchor.href) return

    let url: URL
    try {
      url = new URL(anchor.href, window.location.origin)
    } catch {
      return
    }

    // Only handle YouTube links
    if (!url.hostname.includes("youtube.com") && url.hostname !== "youtu.be") return

    const videoId = getVideoId(url)
    if (!videoId) {
      // Non-video links (channel pages, settings, etc.) follow default behavior
      return
    }

    // Check if it's a timestamp link on the current video
    const currentUrl = new URL(window.location.href)
    const currentVideoId = getVideoId(currentUrl)
    const isSameVideo = currentVideoId && currentVideoId === videoId
    const hasTimestamp = url.searchParams.has("t") || url.hash.includes("t=")

    if (isSameVideo && hasTimestamp) {
      // Allow video player timestamp seeking within the same tab
      return
    }

    // Check playlist / mix parameters
    const listId = url.searchParams.get("list")
    if (listId) {
      const isMix = listId.startsWith("RD")
      const isChannelUploads = listId.startsWith("UL")
      const isRegularPlaylist = !isMix && !isChannelUploads

      // Decision logic based on user settings
      if (isMix && !cachedSettings.queueMixVideos) {
        return // Let default mix play in tab
      }
      if (isChannelUploads && !cachedSettings.queueChannelUploadVideos) {
        return // Let default channel upload play in tab
      }
      if (isRegularPlaylist && isPlaylistPanelItem && !cachedSettings.queuePlaylistSidebarVideos) {
        return // Let default playlist sidebar play in tab
      }
      if (isRegularPlaylist && !isPlaylistPanelItem && !cachedSettings.queuePlaylistSidebarVideos) {
        return // Let default playlist play in tab
      }
    }

    // Clean video URL for queuing
    const cleanUrl = new URL(`https://www.youtube.com/watch?v=${videoId}`)
    if (hasTimestamp) {
      const t = url.searchParams.get("t")
      if (t) cleanUrl.searchParams.set("t", t)
    }

    // Stop default navigation and YouTube SPA router
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    const isModifier = e.ctrlKey || e.metaKey
    const behavior = isModifier
      ? cachedSettings.ctrlClickBehavior
      : cachedSettings.leftClickBehavior

    if (behavior === "same_tab") {
      window.location.href = url.href
    } else if (behavior === "new_active") {
      chrome.runtime.sendMessage({
        action: "openTab",
        url: cleanUrl.href,
        active: true
      })
    } else if (behavior === "background") {
      chrome.runtime.sendMessage({
        action: "openBackground",
        url: cleanUrl.href
      })
    }
  },
  true // Capture phase
)
