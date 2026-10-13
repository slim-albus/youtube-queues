import React, { useEffect, useRef } from "react"
import { Moon, Trash2, FolderPlus, ArrowRight, Copy } from "lucide-react"

type Tab = chrome.tabs.Tab
type TabGroup = chrome.tabGroups.TabGroup

interface Queue {
  group: TabGroup
  tabs: Tab[]
}

interface ContextMenuProps {
  x: number
  y: number
  tab: Tab
  queues: Queue[]
  colorMap: Record<string, string>
  onClose: () => void
  onMoveToQueue: (tab: Tab, targetGroupId: number) => void
  onMoveToNewQueue: (tab: Tab) => void
  onUnloadTab: (tabId: number) => void
  onUnloadAllOtherTabs: () => void
  onCloseTab: (tabId: number) => void
}

export function ContextMenu({
  x,
  y,
  tab,
  queues,
  colorMap,
  onClose,
  onMoveToQueue,
  onMoveToNewQueue,
  onUnloadTab,
  onUnloadAllOtherTabs,
  onCloseTab
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // Prevent context menu from overflowing the screen
  const menuWidth = 200
  const menuHeight = 240
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8)
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8)

  const otherQueues = queues.filter((q) => q.group.id !== tab.groupId)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#212121] text-[#f1f1f1] border border-[#3f3f3f] rounded-lg shadow-2xl py-1 text-xs w-48 animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{ left: `${Math.max(8, adjustedX)}px`, top: `${Math.max(8, adjustedY)}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Move to another queue */}
      {otherQueues.length > 0 && (
        <div className="px-1 py-0.5 border-b border-[#333333]">
          <div className="px-2 py-1 text-[10px] text-[#aaaaaa] font-semibold uppercase tracking-wider">
            Move to Queue
          </div>
          {otherQueues.map((q) => {
            const color = colorMap[q.group.color] || colorMap.grey
            return (
              <button
                key={q.group.id}
                onClick={() => {
                  onMoveToQueue(tab, q.group.id)
                  onClose()
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-[#383838] rounded flex items-center gap-2 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate flex-1">{q.group.title || "Unnamed"}</span>
                <ArrowRight size={12} className="text-[#888888]" />
              </button>
            )
          })}
        </div>
      )}

      {/* Move to New Queue */}
      <div className="px-1 py-0.5 border-b border-[#333333]">
        <button
          onClick={() => {
            onMoveToNewQueue(tab)
            onClose()
          }}
          className="w-full text-left px-2 py-1.5 hover:bg-[#383838] rounded flex items-center gap-2 transition-colors"
        >
          <FolderPlus size={14} className="text-[#aaaaaa]" />
          <span>Move to New Queue</span>
        </button>

        <button
          onClick={() => {
            if (tab.url) navigator.clipboard.writeText(tab.url)
            onClose()
          }}
          className="w-full text-left px-2 py-1.5 hover:bg-[#383838] rounded flex items-center gap-2 transition-colors"
        >
          <Copy size={14} className="text-[#aaaaaa]" />
          <span>Copy URL</span>
        </button>
      </div>

      {/* Memory Actions */}
      <div className="px-1 py-0.5 border-b border-[#333333]">
        {!tab.discarded && (
          <button
            onClick={() => {
              onUnloadTab(tab.id!)
              onClose()
            }}
            className="w-full text-left px-2 py-1.5 hover:bg-[#383838] rounded flex items-center gap-2 text-yellow-400 transition-colors"
          >
            <Moon size={14} />
            <span>Unload Tab</span>
          </button>
        )}

        <button
          onClick={() => {
            onUnloadAllOtherTabs()
            onClose()
          }}
          className="w-full text-left px-2 py-1.5 hover:bg-[#383838] rounded flex items-center gap-2 text-[#cccccc] transition-colors"
        >
          <Moon size={14} />
          <span>Unload all other tabs</span>
        </button>
      </div>

      {/* Close Tab */}
      <div className="px-1 py-0.5">
        <button
          onClick={() => {
            onCloseTab(tab.id!)
            onClose()
          }}
          className="w-full text-left px-2 py-1.5 hover:bg-red-950/50 hover:text-red-400 rounded flex items-center gap-2 text-red-500 transition-colors"
        >
          <Trash2 size={14} />
          <span>Close Tab</span>
        </button>
      </div>
    </div>
  )
}

