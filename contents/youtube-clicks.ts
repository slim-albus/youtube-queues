import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["*://*.youtube.com/*"],
  all_frames: true
}

document.addEventListener("click", (e) => {
  // Find the closest anchor tag
  const target = e.target as HTMLElement
  const anchor = target.closest("a")
  
  if (!anchor || !anchor.href) return

  const url = new URL(anchor.href, window.location.origin)

  // Only intercept youtube links
  if (!url.hostname.includes("youtube.com")) return

  // Exception for channel links, timestamp links, and playlists
  const isVideo = url.pathname === "/watch"
  const isTimestamp = url.searchParams.has("t") || url.hash.includes("t=")
  const isPlaylist = url.searchParams.has("list")
  const isChannel = url.pathname.startsWith("/@") || url.pathname.startsWith("/c/") || url.pathname.startsWith("/channel/") || url.pathname.startsWith("/user/")

  if (isTimestamp || isChannel || isPlaylist) {
    // Let default behavior happen (usually same tab)
    return
  }

  if (isVideo) {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click: Open in SAME tab
      e.preventDefault()
      e.stopPropagation()
      window.location.href = anchor.href
    } else {
      // Normal click: Open in NEW tab (which background.ts will group)
      e.preventDefault()
      e.stopPropagation()
      chrome.runtime.sendMessage({ action: "openBackground", url: anchor.href })
    }
  }
}, true) // Use capture phase to intercept before YouTube's SPA router
