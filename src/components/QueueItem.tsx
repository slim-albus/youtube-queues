import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { TabItem } from "./TabItem"

type TabGroup = chrome.tabGroups.TabGroup
type Tab = chrome.tabs.Tab

interface Queue {
  group: TabGroup
  tabs: Tab[]
}

interface QueueItemProps {
  queue: Queue
  colorMap: Record<string, string>
  editingGroupId: number | null
  editTitle: string
  activeTabId: number | null
  dragOverTabId: number | null
  dragPosition: 'before' | 'after'
  setEditTitle: (val: string) => void
  startRename: (group: TabGroup, e: React.MouseEvent) => void
  saveRename: (groupId: number) => void
  toggleCollapse: (group: TabGroup) => void
  focusQueue: (queue: Queue) => void
  deleteQueue: (queue: Queue) => void
  handleDragStart: (e: React.DragEvent, tab: Tab) => void
  handleDragOver: (e: React.DragEvent, tab: Tab) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent, tab: Tab) => void
  handleGoToTab: (tab: Tab) => void
  closeTab: (tabId: number, e: React.MouseEvent) => void
}

export function QueueItem({
  queue,
  colorMap,
  editingGroupId,
  editTitle,
  activeTabId,
  dragOverTabId,
  dragPosition,
  setEditTitle,
  startRename,
  saveRename,
  toggleCollapse,
  focusQueue,
  deleteQueue,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleGoToTab,
  closeTab
}: QueueItemProps) {
  const groupColor = colorMap[queue.group.color] || colorMap.grey
  const isCollapsed = queue.group.collapsed

  return (
    <div 
      className="bg-[#0f0f0f] border rounded-lg overflow-hidden shadow-sm transition-colors mb-1.5"
      style={{ borderColor: `${groupColor}40` }}
    >
      <div 
        className="bg-[#272727] px-2 py-1 flex items-center justify-between cursor-pointer hover:bg-[#3f3f3f] transition-colors"
        style={{ borderBottomWidth: isCollapsed ? '0px' : '1px', borderBottomColor: `${groupColor}40` }}
        onClick={() => toggleCollapse(queue.group)}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          <div className="text-[#aaaaaa]">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
          <div 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: groupColor, boxShadow: `0 0 6px ${groupColor}` }} 
          />
          
          {editingGroupId === queue.group.id ? (
            <input
              autoFocus
              className="bg-[#0f0f0f] text-white px-2 py-0.5 rounded text-base w-full outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => saveRename(queue.group.id)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename(queue.group.id)}
            />
          ) : (
            <div className="flex items-center gap-2 group flex-1 min-w-0">
              <h2 
                className="font-semibold text-[#f1f1f1] flex items-center gap-2 truncate text-base"
                onClick={(e) => { e.stopPropagation(); focusQueue(queue) }}
              >
                {queue.group.title || "Unnamed"}
                <span className="text-sm text-[#aaaaaa] font-normal shrink-0">({queue.tabs.length})</span>
              </h2>
              <button 
                onClick={(e) => startRename(queue.group, e)}
                className="opacity-0 group-hover:opacity-100 text-[#aaaaaa] hover:text-[#f1f1f1] p-1"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); deleteQueue(queue) }}
          className="text-[#aaaaaa] hover:text-[#ff0000] p-1.5 transition-colors ml-1"
          title="Delete Queue"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="p-1 space-y-0.5 bg-[#0f0f0f]">
          {queue.tabs.map(tab => (
            <TabItem 
              key={tab.id}
              tab={tab}
              activeTabId={activeTabId}
              dragOverTabId={dragOverTabId}
              dragPosition={dragPosition}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleGoToTab={handleGoToTab}
              closeTab={closeTab}
            />
          ))}
        </div>
      )}
    </div>
  )
}
