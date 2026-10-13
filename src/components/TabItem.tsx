import { X, Moon } from "lucide-react"
import { CloseButtonBehavior } from "../lib/settings"

type Tab = chrome.tabs.Tab

interface TabItemProps {
  tab: Tab
  groupColor: string
  useQueueColorForIndicator: boolean
  closeButtonBehavior: CloseButtonBehavior
  activeTabId: number | null
  dragOverTabId: number | null
  dragPosition: "before" | "after"
  handleDragStart: (e: React.DragEvent, tab: Tab) => void
  handleDragOver: (e: React.DragEvent, tab: Tab) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent, tab: Tab) => void
  handleGoToTab: (tab: Tab) => void
  closeTab: (tabId: number, e: React.MouseEvent) => void
  unloadTab: (tabId: number, e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent, tab: Tab) => void
}

export function TabItem({
  tab,
  groupColor,
  useQueueColorForIndicator,
  closeButtonBehavior,
  activeTabId,
  dragOverTabId,
  dragPosition,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleGoToTab,
  closeTab,
  unloadTab,
  onContextMenu
}: TabItemProps) {
  const isDragTarget = dragOverTabId === tab.id
  const isActive = activeTabId === tab.id

  // Memory estimate / state
  const memoryText = tab.discarded ? "Asleep (0 MB RAM)" : "~240 MB RAM"

  // Unified single button action
  const handleSingleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (closeButtonBehavior === "unload_then_close" && !tab.discarded) {
      unloadTab(tab.id!, e)
    } else {
      closeTab(tab.id!, e)
    }
  }

  const indicatorColor = useQueueColorForIndicator ? groupColor : "#22c55e"

  return (
    <div className="relative">
      {isDragTarget && dragPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
      )}

      <div
        draggable
        onDragStart={(e) => handleDragStart(e, tab)}
        onDragOver={(e) => handleDragOver(e, tab)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, tab)}
        onClick={() => handleGoToTab(tab)}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, tab)
        }}
        className={`group flex items-center justify-between px-2 py-1 rounded-md transition-all cursor-pointer select-none ${
          isActive
            ? "bg-[#272727] border border-[#3f3f3f]"
            : "hover:bg-[#272727] border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <img
            src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"}
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              tab.discarded ? "opacity-40" : "opacity-100"
            }`}
            alt=""
          />

          <span
            className={`truncate text-sm ${
              tab.discarded
                ? "text-[#aaaaaa] group-hover:text-[#f1f1f1]"
                : isActive
                ? "text-white font-medium"
                : "text-[#f1f1f1]"
            }`}
            title={`${tab.title} • ${memoryText}`}
          >
            {tab.title}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-1 shrink-0">
          {/* Status & Memory Dot */}
          <div
            title={`${tab.discarded ? "Sleeping" : "Loaded (Active)"} • ${memoryText}`}
            className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
            style={
              tab.discarded
                ? { backgroundColor: "#3f3f3f" }
                : {
                    backgroundColor: indicatorColor,
                    boxShadow: `0 0 6px ${indicatorColor}`
                  }
            }
          />

          {/* Unified Single Action Button: Unloads first if loaded, closes if sleeping */}
          <button
            onClick={handleSingleButtonClick}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f0f0f] hover:bg-[#3f3f3f] ${
              !tab.discarded && closeButtonBehavior === "unload_then_close"
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-[#aaaaaa] hover:text-[#f1f1f1]"
            }`}
            title={
              !tab.discarded && closeButtonBehavior === "unload_then_close"
                ? "Unload tab (Click again to close)"
                : "Close tab"
            }
          >
            {!tab.discarded && closeButtonBehavior === "unload_then_close" ? (
              <Moon size={13} />
            ) : (
              <X size={14} />
            )}
          </button>
        </div>
      </div>

      {isDragTarget && dragPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_5px_#3b82f6]" />
      )}
    </div>
  )
}
