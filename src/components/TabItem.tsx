import { GripVertical, X } from "lucide-react"

type Tab = chrome.tabs.Tab

interface TabItemProps {
  tab: Tab
  activeTabId: number | null
  dragOverTabId: number | null
  dragPosition: 'before' | 'after'
  handleDragStart: (e: React.DragEvent, tab: Tab) => void
  handleDragOver: (e: React.DragEvent, tab: Tab) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent, tab: Tab) => void
  handleGoToTab: (tab: Tab) => void
  closeTab: (tabId: number, e: React.MouseEvent) => void
}

export function TabItem({
  tab,
  activeTabId,
  dragOverTabId,
  dragPosition,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleGoToTab,
  closeTab
}: TabItemProps) {
  const isDragTarget = dragOverTabId === tab.id
  const isActive = activeTabId === tab.id
  
  return (
    <div className="relative">
      {isDragTarget && dragPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
      )}
      
      <div 
        draggable
        onDragStart={(e) => handleDragStart(e, tab)}
        onDragOver={(e) => handleDragOver(e, tab)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, tab)}
        onClick={() => handleGoToTab(tab)}
        className={`group flex items-center justify-between p-1 rounded-md transition-all cursor-pointer select-none ${isActive ? 'bg-[#272727] border border-[#3f3f3f]' : 'hover:bg-[#272727] border border-transparent'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <GripVertical size={14} className="text-[#3f3f3f] cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-[#aaaaaa] transition-opacity" />
          
          <img src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"} className={`w-3.5 h-3.5 flex-shrink-0 ${tab.discarded ? 'opacity-40' : 'opacity-100'}`} alt="" />
          
          <span className={`truncate text-sm ${tab.discarded ? 'text-[#aaaaaa] group-hover:text-[#f1f1f1]' : (isActive ? 'text-white font-medium' : 'text-[#f1f1f1]')}`} title={tab.title}>
            {tab.title}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-1 shrink-0">
          <div 
            title={tab.discarded ? "Sleeping" : "Loaded (Active)"} 
            className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${tab.discarded ? 'bg-[#3f3f3f]' : 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'}`} 
          />

          <button 
            onClick={(e) => closeTab(tab.id!, e)}
            className="text-[#aaaaaa] hover:text-[#f1f1f1] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f0f0f] hover:bg-[#3f3f3f]"
            title="Close tab"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {isDragTarget && dragPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
      )}
    </div>
  )
}
