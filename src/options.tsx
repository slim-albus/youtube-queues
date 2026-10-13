import { useEffect, useState } from "react"
import "./style.css"
import {
  getSettings,
  updateSettings,
  AppSettings,
  ClickBehavior,
  CloseButtonBehavior,
  StatsDisplayLocation,
  DuplicateCheckBehavior,
  defaultSettings
} from "./lib/settings"
import { Settings, Save, Check, RotateCcw, AlertCircle } from "lucide-react"

function Options() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    getSettings().then((items) => {
      setSettings(items)
      setOriginalSettings(items)
    })
  }, [])

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  // Warn user before leaving if settings have not been saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const handleSave = async () => {
    await updateSettings(settings)
    setOriginalSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRestoreDefaults = async () => {
    setSettings(defaultSettings)
    await updateSettings(defaultSettings)
    setOriginalSettings(defaultSettings)
    setRestored(true)
    setTimeout(() => setRestored(false), 2000)
  }

  const ClickOptions = [
    { value: "background", label: "Open in Background (Queue it)" },
    { value: "new_active", label: "Open in New Tab & Switch to it" },
    { value: "same_tab", label: "Open in Current Tab (Default YouTube)" }
  ]

  const CloseOptions = [
    {
      value: "unload_then_close",
      label: "First click unloads (if loaded), second click closes"
    },
    { value: "close", label: "Always close immediately on click" }
  ]

  const StatsOptions = [
    { value: "fab", label: "In Bottom HUD Pill (Clean Header)" },
    { value: "header", label: "In Top Header" },
    { value: "both", label: "In Both HUD & Header" }
  ]

  const DuplicateOptions = [
    {
      value: "focus_existing",
      label: "Switch to existing tab (Prevent duplicates & save RAM)"
    },
    { value: "allow", label: "Open anyway (Allow duplicates)" }
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] p-8 font-sans">
      <div className="max-w-2xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3">
            <Settings className="text-red-500" size={28} />
            <h1 className="text-2xl font-bold">YouTube Queues Settings</h1>
          </div>
          {isDirty && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full animate-pulse">
              <AlertCircle size={14} />
              <span>Unsaved Changes</span>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Section 1: Video Link Behavior */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Video Link Behavior</h2>
            <p className="text-sm text-[#aaaaaa]">
              Control how clicks on YouTube video thumbnails and playlist links are routed.
            </p>

            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Normal Click (Left Click)</label>
                <select
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.leftClickBehavior}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leftClickBehavior: e.target.value as ClickBehavior
                    })
                  }
                >
                  {ClickOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Ctrl + Click / Cmd + Click</label>
                <select
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.ctrlClickBehavior}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ctrlClickBehavior: e.target.value as ClickBehavior
                    })
                  }
                >
                  {ClickOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Duplicate Video Check</label>
                <select
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.duplicateCheckBehavior}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      duplicateCheckBehavior: e.target.value as DuplicateCheckBehavior
                    })
                  }
                >
                  {DuplicateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* YouTube Mix & Playlists toggles */}
              <div className="pt-2 border-t border-[#383838] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="font-medium text-sm">Queue YouTube Mix & Radio Videos</label>
                    <span className="text-xs text-[#aaaaaa]">
                      Queue auto-generated Mixes into a queue instead of taking over the current tab.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.queueMixVideos}
                      onChange={(e) =>
                        setSettings({ ...settings, queueMixVideos: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="font-medium text-sm">Queue Videos from Same Channel</label>
                    <span className="text-xs text-[#aaaaaa]">
                      Queue channel upload list videos instead of opening them in the current tab.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.queueChannelUploadVideos}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          queueChannelUploadVideos: e.target.checked
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="font-medium text-sm">Queue Videos from Playlist Sidebar</label>
                    <span className="text-xs text-[#aaaaaa]">
                      Clicking video cards inside YouTube's playlist sidebar queues them into the background.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.queuePlaylistSidebarVideos}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          queuePlaylistSidebarVideos: e.target.checked
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Memory Management */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Memory Management</h2>
            <p className="text-sm text-[#aaaaaa]">
              Tune background tab sleeping and single-click tab unload behavior.
            </p>

            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Instant Background Unload</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Put background tabs to sleep as soon as their title is captured.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.autoUnload}
                    onChange={(e) =>
                      setSettings({ ...settings, autoUnload: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Max Active Tabs Limit</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Oldest loaded YouTube tabs are automatically put to sleep beyond this limit.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2 w-20 text-center text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.maxActiveTabs}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxActiveTabs: parseInt(e.target.value) || 5
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#383838]">
                <label className="font-medium text-sm">Tab Close / Unload Button Behavior</label>
                <select
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.closeButtonBehavior}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      closeButtonBehavior: e.target.value as CloseButtonBehavior
                    })
                  }
                >
                  {CloseOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Interface & Appearance */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Interface & Appearance</h2>
            <p className="text-sm text-[#aaaaaa]">
              Customize sidepanel statistics, queue header stickiness, and audio indicator.
            </p>

            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-5">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-sm">Stats & RAM Display Location</label>
                <select
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500 text-sm"
                  value={settings.statsDisplayLocation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      statsDisplayLocation: e.target.value as StatsDisplayLocation
                    })
                  }
                >
                  {StatsOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Audio Playing Indicator & 1-Click Mute</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Display speaker icon on playing tabs and allow 1-click muting from the sidebar.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.showAudioIndicator}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        showAudioIndicator: e.target.checked
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Sticky Queue Headers</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Pin queue title to the top while scrolling through long queues.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.stickyQueueHeaders}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        stickyQueueHeaders: e.target.checked
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Contextual Scroll Button</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Show mini floating button that interchanges between Scroll to Top / Bottom.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.showScrollHelperButtons}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        showScrollHelperButtons: e.target.checked
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Navigation & Tab Groups */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Navigation & Tab Groups</h2>
            <p className="text-sm text-[#aaaaaa]">
              Manage auto-scrolling behaviors and browser tab group synchronization.
            </p>

            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Auto-Scroll on Drag</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Smoothly scroll the list when dragging tabs near the top or bottom edge.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.autoScrollOnDrag}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoScrollOnDrag: e.target.checked
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium text-sm">Keep Browser Tab Groups Collapsed</label>
                  <span className="text-xs text-[#aaaaaa]">
                    Keeps Chrome's top tab strip groups collapsed while leaving queues open and navigable in the sidepanel.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.keepBrowserGroupsCollapsed}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        keepBrowserGroupsCollapsed: e.target.checked
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 flex items-center justify-between pt-6 border-t border-[#3f3f3f]">
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 bg-[#272727] hover:bg-[#383838] text-[#aaaaaa] hover:text-[#f1f1f1] font-medium py-2.5 px-5 rounded-full transition-colors border border-[#3f3f3f] active:scale-95 text-sm"
          >
            <RotateCcw size={16} />
            {restored ? "Defaults Restored!" : "Restore Defaults"}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#f1f1f1] hover:bg-white text-[#0f0f0f] font-semibold py-2.5 px-6 rounded-full transition-colors active:scale-95 shadow-md text-sm"
          >
            {saved ? <Check size={18} className="text-green-600" /> : <Save size={18} />}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Options
