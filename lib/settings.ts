export type ClickBehavior = "background" | "new_active" | "same_tab"

export interface AppSettings {
  maxActiveTabs: number
  leftClickBehavior: ClickBehavior
  ctrlClickBehavior: ClickBehavior
  autoUnload: boolean
}

export const defaultSettings: AppSettings = {
  maxActiveTabs: 5,
  leftClickBehavior: "background",
  ctrlClickBehavior: "same_tab",
  autoUnload: true
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
