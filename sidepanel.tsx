import { useEffect, useState } from "react"
import "./style.css"
import { PlaySquare, Trash2, Plus, GripVertical, ChevronDown, ChevronRight, Edit2, Zap, Check, X } from "lucide-react"

type TabGroup = chrome.tabGroups.TabGroup
type Tab = chrome.tabs.Tab

interface Queue {
  group: TabGroup
  tabs: Tab[]
}

const colorMap: Record<string, string> = {
  grey: "#71717a",
  blue: "#3b82f6",
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
  pink: "#ec4899",
  purple: "#a855f7",
  cyan: "#06b6d4",
  orange: "#f97316"
}

function SidePanel() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [ungroupedTabs, setUngroupedTabs] = useState<Tab[]>([])
  
  // Stats
  const [totalTabs, setTotalTabs] = useState(0)
  const [loadedTabs, setLoadedTabs] = useState(0)

  // Edit states
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Create state
  const [isCreatingQueue, setIsCreatingQueue] = useState(false)
  const [newQueueName, setNewQueueName] = useState("")

  // Drag state
  const [draggedTab, setDraggedTab] = useState<Tab | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<'before' | 'after'>('after')

  const loadData = async () => {
    const allGroups = await chrome.tabGroups.query({})
    const allYoutubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
    
    setTotalTabs(allYoutubeTabs.length)
    setLoadedTabs(allYoutubeTabs.filter(t => !t.discarded).length)

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
    const events = [
      chrome.tabs.onUpdated,
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onMoved,
      chrome.tabGroups.onUpdated,
      chrome.tabGroups.onRemoved
    ]
    events.forEach(e => e.addListener(loadData))
    return () => events.forEach(e => e.removeListener(loadData))
  }, [])

  const focusQueue = async (queue: Queue) => {
    if (queue.tabs.length > 0) {
      await chrome.windows.update(queue.group.windowId, { focused: true })
      await chrome.tabs.update(queue.tabs[0].id!, { active: true })
    }
  }

  const deleteQueue = async (queue: Queue) => {
    const tabIds = queue.tabs.map(t => t.id!)
    await chrome.tabs.remove(tabIds)
  }

  const submitNewQueue = async () => {
    if (!newQueueName.trim()) {
      setIsCreatingQueue(false)
      return
    }
    const newTab = await chrome.tabs.create({ url: "https://www.youtube.com", active: false })
    const groupId = await chrome.tabs.group({ tabIds: newTab.id! })
    await chrome.tabGroups.update(groupId, { title: newQueueName.trim(), color: "red" })
    setIsCreatingQueue(false)
    setNewQueueName("")
  }

  const closeTab = async (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await chrome.tabs.remove(tabId)
  }

  const toggleCollapse = async (group: TabGroup) => {
    await chrome.tabGroups.update(group.id, { collapsed: !group.collapsed })
  }

  const startRename = (group: TabGroup, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(group.title || "")
    setEditingGroupId(group.id)
  }

  const saveRename = async (groupId: number) => {
    await chrome.tabGroups.update(groupId, { title: editTitle.trim() || "Unnamed Queue" })
    setEditingGroupId(null)
  }

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, tab: Tab) => {
    setDraggedTab(tab)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, tab: Tab) => {
    e.preventDefault()
    if (!draggedTab || draggedTab.id === tab.id) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const pos = e.clientY < midY ? 'before' : 'after'
    
    if (dragOverTabId !== tab.id || dragPosition !== pos) {
      setDragOverTabId(tab.id!)
      setDragPosition(pos)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetTab: Tab) => {
    e.preventDefault()
    setDragOverTabId(null)
    
    if (!draggedTab || draggedTab.id === targetTab.id) return
    
    let dropIndex = targetTab.index
    if (dragPosition === 'after') {
      dropIndex += 1
    }
    
    if (draggedTab.groupId !== targetTab.groupId) {
      await chrome.tabs.group({ tabIds: draggedTab.id!, groupId: targetTab.groupId })
    }
    await chrome.tabs.move(draggedTab.id!, { index: dropIndex })
    setDraggedTab(null)
  }

  const handleGoToTab = async (tab: Tab) => {
    await chrome.windows.update(tab.windowId, { focused: true })
    await chrome.tabs.update(tab.id!, { active: true })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-2 font-sans selection:bg-red-500/30 pb-24 relative">
      
      {/* Subtle Header Stats */}
      <div className="flex items-center mb-3 sticky top-0 bg-zinc-950/95 backdrop-blur z-20 py-2 border-b border-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">YouTube Tabs:</span>
          <span className="text-sm font-semibold text-zinc-400">{totalTabs}</span>
          <span className="text-[10px] text-zinc-600 font-medium tracking-wide">
            (<span className="text-green-500/60">{loadedTabs}</span> active)
          </span>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {queues.length === 0 && ungroupedTabs.length === 0 && (
          <div className="text-center text-zinc-500 mt-10 text-sm">
            No YouTube queues found.<br/> Open a video to start.
          </div>
        )}

        {queues.map(queue => {
          const groupColor = colorMap[queue.group.color] || colorMap.grey
          const isCollapsed = queue.group.collapsed

          return (
            <div 
              key={queue.group.id} 
              className="bg-zinc-900 border rounded-lg overflow-hidden shadow-sm transition-colors"
              style={{ borderColor: `${groupColor}40` }}
            >
              {/* Queue Header */}
              <div 
                className="bg-zinc-800/60 p-2 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-colors"
                style={{ borderBottomWidth: isCollapsed ? '0px' : '1px', borderBottomColor: `${groupColor}40` }}
                onClick={() => toggleCollapse(queue.group)}
              >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <div className="text-zinc-500">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </div>
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: groupColor, boxShadow: `0 0 6px ${groupColor}` }} 
                  />
                  
                  {editingGroupId === queue.group.id ? (
                    <input
                      autoFocus
                      className="bg-zinc-950 text-white px-2 py-0.5 rounded text-sm w-full outline-none"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => saveRename(queue.group.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(queue.group.id)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 group flex-1 min-w-0">
                      <h2 
                        className="font-semibold text-zinc-200 flex items-center gap-2 truncate text-sm"
                        onClick={(e) => { e.stopPropagation(); focusQueue(queue) }}
                      >
                        {queue.group.title || "Unnamed"}
                        <span className="text-xs text-zinc-600 font-normal shrink-0">({queue.tabs.length})</span>
                      </h2>
                      <button 
                        onClick={(e) => startRename(queue.group, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 p-0.5"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteQueue(queue) }}
                  className="text-zinc-500 hover:text-red-400 p-1 transition-colors ml-1"
                  title="Delete Queue"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Tabs List */}
              {!isCollapsed && (
                <div className="p-1 space-y-0.5 bg-zinc-950/30">
                  {queue.tabs.map(tab => {
                    const isDragTarget = dragOverTabId === tab.id
                    
                    return (
                      <div key={tab.id} className="relative">
                        {isDragTarget && dragPosition === 'before' && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
                        )}
                        
                        <div 
                          draggable
                          onDragStart={(e) => handleDragStart(e, tab)}
                          onDragOver={(e) => handleDragOver(e, tab)}
                          onDragLeave={() => setDragOverTabId(null)}
                          onDrop={(e) => handleDrop(e, tab)}
                          onClick={() => handleGoToTab(tab)}
                          className="group flex items-center justify-between p-1.5 hover:bg-zinc-800 rounded-md transition-all cursor-pointer text-sm select-none"
                        >
                          <div className="flex items-center gap-2 overflow-hidden w-full">
                            <GripVertical size={14} className="text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-zinc-400" />
                            
                            <div 
                              title={tab.discarded ? "Sleeping" : "Loaded (Active)"} 
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${tab.discarded ? 'bg-zinc-700' : 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'}`} 
                            />
                            
                            <img src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"} className={`w-3.5 h-3.5 flex-shrink-0 ${tab.discarded ? 'opacity-40' : 'opacity-100'}`} alt="" />
                            
                            <span className={`truncate ${tab.discarded ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-300 group-hover:text-white'}`} title={tab.title}>
                              {tab.title}
                            </span>
                          </div>

                          <button 
                            onClick={(e) => closeTab(tab.id!, e)}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 bg-zinc-800/50"
                            title="Close tab"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {isDragTarget && dragPosition === 'after' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating Action Button for New Queue */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {isCreatingQueue && (
          <div className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-zinc-700 shadow-2xl mb-2 animate-in slide-in-from-bottom-2">
            <input 
              autoFocus
              className="bg-zinc-950 text-sm w-48 outline-none px-3 py-1.5 text-white rounded-lg border border-zinc-800 focus:border-red-500/50"
              placeholder="Queue name..."
              value={newQueueName}
              onChange={e => setNewQueueName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitNewQueue()}
            />
            <button onClick={submitNewQueue} className="text-green-400 p-1.5 hover:bg-zinc-800 rounded-lg">
              <Check size={16} />
            </button>
            <button onClick={() => setIsCreatingQueue(false)} className="text-red-400 p-1.5 hover:bg-zinc-800 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}
        
        {!isCreatingQueue && (
          <button 
            onClick={() => setIsCreatingQueue(true)}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-transform active:scale-95 flex items-center justify-center"
            title="Create New Queue"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

    </div>
  )
}

export default SidePanel
