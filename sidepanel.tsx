import { useEffect, useState } from "react"
import "./style.css"
import { PlaySquare, Trash2, Plus, GripVertical, ExternalLink } from "lucide-react"

type TabGroup = chrome.tabGroups.TabGroup
type Tab = chrome.tabs.Tab

interface Queue {
  group: TabGroup
  tabs: Tab[]
}

function SidePanel() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [ungroupedTabs, setUngroupedTabs] = useState<Tab[]>([])

  const loadData = async () => {
    const allGroups = await chrome.tabGroups.query({})
    const allYoutubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
    
    const queueMap = new Map<number, Queue>()
    const ungrouped: Tab[] = []

    for (const tab of allYoutubeTabs) {
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        if (!queueMap.has(tab.groupId)) {
          const group = allGroups.find(g => g.id === tab.groupId)
          if (group) {
            queueMap.set(tab.groupId, { group, tabs: [] })
          }
        }
        queueMap.get(tab.groupId)?.tabs.push(tab)
      } else {
        ungrouped.push(tab)
      }
    }

    setQueues(Array.from(queueMap.values()))
    setUngroupedTabs(ungrouped)
  }

  useEffect(() => {
    loadData()
    chrome.tabs.onUpdated.addListener(loadData)
    chrome.tabs.onCreated.addListener(loadData)
    chrome.tabs.onRemoved.addListener(loadData)
    chrome.tabGroups.onUpdated.addListener(loadData)
    chrome.tabGroups.onRemoved.addListener(loadData)
    
    return () => {
      chrome.tabs.onUpdated.removeListener(loadData)
      chrome.tabs.onCreated.removeListener(loadData)
      chrome.tabs.onRemoved.removeListener(loadData)
      chrome.tabGroups.onUpdated.removeListener(loadData)
      chrome.tabGroups.onRemoved.removeListener(loadData)
    }
  }, [])

  const focusQueue = async (queue: Queue) => {
    if (queue.tabs.length > 0) {
      const tab = queue.tabs[0]
      await chrome.windows.update(queue.group.windowId, { focused: true })
      await chrome.tabs.update(tab.id!, { active: true })
    }
  }

  const deleteQueue = async (queue: Queue) => {
    const tabIds = queue.tabs.map(t => t.id!)
    await chrome.tabs.remove(tabIds)
  }

  const createQueue = async () => {
     // A new queue needs at least one tab to exist in Chrome
     const newTab = await chrome.tabs.create({ url: "https://www.youtube.com", active: false })
     const groupId = await chrome.tabs.group({ tabIds: newTab.id })
     await chrome.tabGroups.update(groupId, { title: "YouTube Queue", color: "red" })
  }
  
  const moveTabToQueue = async (tabId: number, groupId: number) => {
      await chrome.tabs.group({ tabIds: tabId, groupId })
  }

  const closeTab = async (tabId: number) => {
      await chrome.tabs.remove(tabId)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 font-sans selection:bg-red-500/30">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <PlaySquare className="text-red-500" />
          YouTube Queues
        </h1>
        <button 
          onClick={createQueue}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
          title="Create New Queue"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {queues.length === 0 && ungroupedTabs.length === 0 && (
          <div className="text-center text-zinc-500 mt-10">
            No YouTube queues found.<br/> Open a YouTube video to start.
          </div>
        )}

        {queues.map(queue => (
          <div key={queue.group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-zinc-800/50 p-3 flex items-center justify-between border-b border-zinc-800">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                onClick={() => focusQueue(queue)}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: queue.group.color === 'red' ? '#ef4444' : queue.group.color === 'blue' ? '#3b82f6' : queue.group.color === 'green' ? '#22c55e' : '#8b5cf6' }} 
                />
                <h2 className="font-semibold text-zinc-100">
                  {queue.group.title || "Unnamed Queue"}
                  <span className="ml-2 text-xs text-zinc-500 font-normal">({queue.tabs.length})</span>
                </h2>
              </div>
              <button 
                onClick={() => deleteQueue(queue)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
                title="Delete Queue"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="p-2 space-y-1">
              {queue.tabs.map(tab => (
                <div key={tab.id} className="group flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"} className="w-4 h-4 flex-shrink-0" alt="" />
                    <span className="text-sm truncate text-zinc-300 group-hover:text-zinc-100" title={tab.title}>
                      {tab.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button 
                      onClick={async () => await chrome.tabs.update(tab.id!, { active: true })}
                      className="text-zinc-500 hover:text-zinc-300 p-1"
                      title="Go to tab"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button 
                      onClick={() => closeTab(tab.id!)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Close tab"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {ungroupedTabs.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg opacity-80">
            <div className="bg-zinc-800/30 p-3 border-b border-zinc-800">
              <h2 className="font-semibold text-zinc-400 text-sm">Ungrouped YouTube Tabs ({ungroupedTabs.length})</h2>
            </div>
            <div className="p-2 space-y-1">
              {ungroupedTabs.map(tab => (
                <div key={tab.id} className="group flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <img src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"} className="w-4 h-4 flex-shrink-0 opacity-50" alt="" />
                     <span className="text-sm truncate text-zinc-500">{tab.title}</span>
                  </div>
                  <div className="flex gap-2">
                    {queues.length > 0 && (
                      <select 
                        className="bg-zinc-800 text-xs text-zinc-300 rounded border-none outline-none py-1"
                        onChange={(e) => moveTabToQueue(tab.id!, parseInt(e.target.value))}
                        defaultValue=""
                      >
                        <option value="" disabled>Move to...</option>
                        {queues.map(q => (
                          <option key={q.group.id} value={q.group.id}>{q.group.title || 'Unnamed Queue'}</option>
                        ))}
                      </select>
                    )}
                    <button 
                      onClick={() => closeTab(tab.id!)}
                      className="text-zinc-600 hover:text-red-400 p-1"
                      title="Close tab"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SidePanel
