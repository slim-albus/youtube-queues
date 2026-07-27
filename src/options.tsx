import { useEffect, useState } from "react"
import "./style.css"
import { getSettings, updateSettings, AppSettings, ClickBehavior, defaultSettings } from "./lib/settings"
import { Settings, Save, Check } from "lucide-react"

function Options() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ClickOptions = [
    { value: "background", label: "Open in Background (Queue it)" },
    { value: "new_active", label: "Open in New Tab & Switch to it" },
    { value: "same_tab", label: "Open in Current Tab (Default YouTube)" }
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#3f3f3f]">
          <Settings className="text-red-500" size={28} />
          <h1 className="text-2xl font-bold">YouTube Queues Settings</h1>
        </div>

        <div className="space-y-8">
          
          {/* Link Behavior */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Video Link Behavior</h2>
            <p className="text-sm text-[#aaaaaa]">Choose what happens when you click a video thumbnail on YouTube.</p>
            
            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-5">
              
              <div className="flex flex-col gap-2">
                <label className="font-medium">Normal Click (Left Click)</label>
                <select 
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500"
                  value={settings.leftClickBehavior}
                  onChange={(e) => setSettings({ ...settings, leftClickBehavior: e.target.value as ClickBehavior })}
                >
                  {ClickOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium">Ctrl + Click / Cmd + Click</label>
                <select 
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2.5 text-[#f1f1f1] outline-none focus:border-red-500"
                  value={settings.ctrlClickBehavior}
                  onChange={(e) => setSettings({ ...settings, ctrlClickBehavior: e.target.value as ClickBehavior })}
                >
                  {ClickOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

            </div>
          </section>

          {/* Memory Management */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Memory Management</h2>
            <p className="text-sm text-[#aaaaaa]">Control how aggressively the extension frees up RAM from background YouTube tabs.</p>
            
            <div className="bg-[#272727] p-5 rounded-xl border border-[#3f3f3f] space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium">Instant Background Unload</label>
                  <span className="text-xs text-[#aaaaaa]">Immediately put tabs to sleep after getting their title (saves max RAM).</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.autoUnload}
                    onChange={(e) => setSettings({ ...settings, autoUnload: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-[#0f0f0f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="font-medium">Max Active Tabs Limit</label>
                  <span className="text-xs text-[#aaaaaa]">If exceeded, the oldest unused YouTube tab will be put to sleep.</span>
                </div>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg p-2 w-20 text-center text-[#f1f1f1] outline-none focus:border-red-500"
                  value={settings.maxActiveTabs}
                  onChange={(e) => setSettings({ ...settings, maxActiveTabs: parseInt(e.target.value) || 5 })}
                />
              </div>

            </div>
          </section>

        </div>

        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#f1f1f1] hover:bg-white text-[#0f0f0f] font-semibold py-2.5 px-6 rounded-full transition-colors active:scale-95"
          >
            {saved ? <Check size={20} className="text-green-600" /> : <Save size={20} />}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Options
