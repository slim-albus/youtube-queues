import type { PlasmoCSConfig } from "plasmo"
import { defaultSettings, AppSettings } from "../lib/settings"

export const config: PlasmoCSConfig = {
  matches: ["*://*.youtube.com/*"],
  all_frames: true
}

document.addEventListener("click", async (e) => {
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
    // Let default behavior happen
    return
  }

  if (isVideo) {
    // Stop the default browser navigation immediately
    e.preventDefault()
    e.stopPropagation()

    // Fetch latest user settings
    const rawSettings = await chrome.storage.sync.get(defaultSettings)
    const settings = rawSettings as AppSettings

    const isModifier = e.ctrlKey || e.metaKey
    const behavior = isModifier ? settings.ctrlClickBehavior : settings.leftClickBehavior

    if (behavior === "same_tab") {
      window.location.href = anchor.href
    } else if (behavior === "new_active") {
      window.open(anchor.href, "_blank")
    } else if (behavior === "background") {
      chrome.runtime.sendMessage({ action: "openBackground", url: anchor.href })
    }
  }
}, true)
