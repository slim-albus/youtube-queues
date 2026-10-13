import React from "react"
import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { TabItem } from "./TabItem"
import { CloseButtonBehavior, QueueOutlineStyle } from "../lib/settings"

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
  dragPosition: "before" | "after"
  isCollapsed: boolean
  stickyHeaders: boolean
  useQueueColorForIndicator: boolean
  showAudioIndicator: boolean
  queueOutlineStyle: QueueOutlineStyle
  closeButtonBehavior: CloseButtonBehavior
  tabMemoryMap: Record<number, number>
  fetchTabMemory: (tabId: number) => void
  setEditTitle: (val: string) => void
  startRename: (group: TabGroup, e: React.MouseEvent) => void
  saveRename: (groupId: number) => void
  toggleCollapse: (queue: Queue) => void
  focusQueue: (queue: Queue) => void
  deleteQueue: (queue: Queue) => void
  handleDragStart: (e: React.DragEvent, tab: Tab) => void
  handleDragOver: (e: React.DragEvent, tab: Tab) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent, tab: Tab) => void
  handleGoToTab: (tab: Tab) => void
  closeTab: (tabId: number, e: React.MouseEvent) => void
  unloadTab: (tabId: number, e: React.MouseEvent) => void
  toggleMuteTab: (tabId: number, e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent, tab: Tab) => void
}

export function QueueItem({
  queue,
  colorMap,
  editingGroupId,
  editTitle,
  activeTabId,
  dragOverTabId,
  dragPosition,
  isCollapsed,
  stickyHeaders,
  useQueueColorForIndicator,
  showAudioIndicator,
  queueOutlineStyle,
  closeButtonBehavior,
  tabMemoryMap,
  fetchTabMemory,
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
  closeTab,
  unloadTab,
  toggleMuteTab,
  onContextMenu
}: QueueItemProps) {
  const groupColor = colorMap[queue.group.color] || colorMap.grey

  // Compute outline styling (glow shade gradient vs solid line vs off)
  const getContainerStyle = () => {
    if (queueOutlineStyle === "glow") {
      return {
        borderColor: `${groupColor}55`,
        boxShadow: `0 0 14px ${groupColor}25, 0 0 2px ${groupColor}50`,
        background: `linear-gradient(180deg, ${groupColor}18 0%, #0f0f0f 34px)`
      }
    }
    if (queueOutlineStyle === "solid") {
      return {
        borderColor: `${groupColor}40`,
        boxShadow: "none",
        background: "#0f0f0f"
      }
    }
    return {
      borderColor: "#272727",
      boxShadow: "none",
      background: "#0f0f0f"
    }
  }

  return (
    <div
      className="border rounded-lg shadow-sm transition-all mb-1.5"
      style={getContainerStyle()}
    >
      {/* Queue Header */}
      <div
        className={`bg-[#272727] px-2 py-1 flex items-center justify-between cursor-pointer hover:bg-[#3f3f3f] transition-colors group/header rounded-t-lg ${
          isCollapsed ? "rounded-b-lg" : ""
        } ${stickyHeaders ? "sticky top-9 z-10" : ""}`}
        style={{
          borderBottomWidth: isCollapsed ? "0px" : "1px",
          borderBottomColor: `${groupColor}40`
        }}
        onClick={() => toggleCollapse(queue)}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          {/* Color Tab Indicator on the left */}
          <div
            className="w-1.5 h-4 rounded-full flex-shrink-0"
            style={{
              backgroundColor: groupColor,
              boxShadow: `0 0 8px ${groupColor}90`
            }}
          />

          <div className="text-[#aaaaaa]">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>

          {editingGroupId === queue.group.id ? (
            <input
              autoFocus
              className="bg-[#0f0f0f] text-white px-2 py-0.5 rounded text-base w-full outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => saveRename(queue.group.id)}
              onKeyDown={(e) => e.key === "Enter" && saveRename(queue.group.id)}
            />
          ) : (
            <div className="flex items-center gap-2 group flex-1 min-w-0">
              <h2
                className="font-semibold text-[#f1f1f1] flex items-center gap-2 truncate text-base"
                onClick={(e) => {
                  e.stopPropagation()
                  focusQueue(queue)
                }}
              >
                {queue.group.title || "Unnamed"}
                <span className="text-sm text-[#aaaaaa] font-normal shrink-0">
                  ({queue.tabs.length})
                </span>
              </h2>
              <button
                onClick={(e) => startRename(queue.group, e)}
                className="opacity-0 group-hover:opacity-100 text-[#aaaaaa] hover:text-[#f1f1f1] p-1"
                title="Rename Queue"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteQueue(queue)
          }}
          className="text-[#aaaaaa] hover:text-[#ff0000] p-1.5 transition-all ml-1 opacity-0 group-hover/header:opacity-100"
          title="Delete Queue"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-1 space-y-0.5 bg-[#0f0f0f] rounded-b-lg">
          {queue.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              groupColor={groupColor}
              useQueueColorForIndicator={useQueueColorForIndicator}
              showAudioIndicator={showAudioIndicator}
              closeButtonBehavior={closeButtonBehavior}
              realMemoryMb={tabMemoryMap[tab.id!]}
              onHoverTab={() => fetchTabMemory(tab.id!)}
              activeTabId={activeTabId}
              dragOverTabId={dragOverTabId}
              dragPosition={dragPosition}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleGoToTab={handleGoToTab}
              closeTab={closeTab}
              unloadTab={unloadTab}
              toggleMuteTab={toggleMuteTab}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}
