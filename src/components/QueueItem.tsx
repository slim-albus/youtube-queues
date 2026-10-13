import React from "react"
import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { TabItem } from "./TabItem"
import { CloseButtonBehavior } from "../lib/settings"

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
  showAudioIndicator: boolean
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
  handleDragEnd?: () => void
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
  showAudioIndicator,
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
  handleDragEnd,
  handleDrop,
  handleGoToTab,
  closeTab,
  unloadTab,
  toggleMuteTab,
  onContextMenu
}: QueueItemProps) {
  const groupColor = colorMap[queue.group.color] || colorMap.grey

  return (
    <div className="bg-[#0f0f0f] border border-[#272727] rounded-lg shadow-sm transition-colors mb-1.5">
      {/* Queue Header */}
      <div
        className={`bg-[#272727] px-2 py-1 flex items-center justify-between cursor-pointer hover:bg-[#3f3f3f] transition-colors group/header rounded-t-lg ${
          isCollapsed ? "rounded-b-lg" : ""
        } ${stickyHeaders ? "sticky top-9 z-10" : ""}`}
        style={{
          borderBottomWidth: isCollapsed ? "0px" : "1px",
          borderBottomColor: "#333333"
        }}
        onClick={() => toggleCollapse(queue)}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          {/* Vertical Color Tab Indicator on the left */}
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

        {/* Right Section: Item Count (shifts to side on hover) & Delete Button (slides in on hover) */}
        <div className="flex items-center shrink-0 ml-1.5">
          <span className="text-xs text-[#888888] font-mono select-none transition-colors group-hover/header:text-[#cccccc]">
            {queue.tabs.length}
          </span>

          <div className="max-w-0 opacity-0 pointer-events-none group-hover/header:max-w-8 group-hover/header:opacity-100 group-hover/header:pointer-events-auto transition-all duration-200 ease-out overflow-hidden flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteQueue(queue)
              }}
              className="text-[#aaaaaa] hover:text-[#ff0000] p-1 rounded hover:bg-[#383838] transition-colors ml-1.5"
              title="Delete Queue"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-1 space-y-0.5 bg-[#0f0f0f] rounded-b-lg">
          {queue.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
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
              handleDragEnd={handleDragEnd}
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
