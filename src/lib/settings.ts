export type ClickBehavior = "background" | "new_active" | "same_tab"
export type CloseButtonBehavior = "unload_then_close" | "close"
export type StatsDisplayLocation = "fab" | "header" | "both"
export type DuplicateCheckBehavior = "focus_existing" | "allow"

export interface AppSettings {
  // Video Link Behavior
  leftClickBehavior: ClickBehavior
  ctrlClickBehavior: ClickBehavior
  duplicateCheckBehavior: DuplicateCheckBehavior
  queueMixVideos: boolean
  queueChannelUploadVideos: boolean
  queuePlaylistSidebarVideos: boolean

  // Memory Management
  maxActiveTabs: number
  autoUnload: boolean
  closeButtonBehavior: CloseButtonBehavior

  // Interface & Appearance
  statsDisplayLocation: StatsDisplayLocation
  showAudioIndicator: boolean
  stickyQueueHeaders: boolean
  showScrollHelperButtons: boolean
  autoScrollToActiveTab: boolean
  autoScrollOnDrag: boolean
  keepBrowserGroupsCollapsed: boolean
}

export const defaultSettings: AppSettings = {
  leftClickBehavior: "background",
  ctrlClickBehavior: "same_tab",
  duplicateCheckBehavior: "focus_existing",
  queueMixVideos: true,
  queueChannelUploadVideos: true,
  queuePlaylistSidebarVideos: true,

  maxActiveTabs: 5,
  autoUnload: true,
  closeButtonBehavior: "unload_then_close",

  statsDisplayLocation: "fab",
  showAudioIndicator: true,
  stickyQueueHeaders: true,
  showScrollHelperButtons: true,
  autoScrollToActiveTab: true,
  autoScrollOnDrag: true,
  keepBrowserGroupsCollapsed: false
}

export async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (items) => {
      resolve(items as AppSettings)
    })
  })
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(updates, () => {
      resolve()
    })
  })
}
