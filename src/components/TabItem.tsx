import React from "react"
import { X, Moon, Volume2, VolumeX } from "lucide-react"
import { CloseButtonBehavior } from "../lib/settings"

type Tab = chrome.tabs.Tab

interface TabItemProps {
  tab: Tab
  showAudioIndicator: boolean
  closeButtonBehavior: CloseButtonBehavior
  activeTabId: number | null
  dragOverTabId: number | null
  dragPosition: "before" | "after"
  realMemoryMb?: number
  onHoverTab?: () => void
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

export function TabItem({
  tab,
  showAudioIndicator,
  closeButtonBehavior,
  activeTabId,
  dragOverTabId,
  dragPosition,
  realMemoryMb,
  onHoverTab,
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
}: TabItemProps) {
  const isDragTarget = dragOverTabId === tab.id
  const isActive = activeTabId === tab.id

  // Memory display text
  const memoryText = tab.discarded
    ? "Asleep (0 MB RAM)"
    : realMemoryMb
    ? `${realMemoryMb} MB RAM (Active)`
    : "~240 MB RAM (Active)"

  // Unified single button action
  const handleSingleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (closeButtonBehavior === "unload_then_close" && !tab.discarded) {
      unloadTab(tab.id!, e)
    } else {
      closeTab(tab.id!, e)
    }
  }

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
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, tab)}
        onClick={() => handleGoToTab(tab)}
        onMouseEnter={onHoverTab}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, tab)
        }}
        className={`group flex items-center justify-between px-2 py-1 rounded-md transition-all cursor-pointer select-none ${
          isActive
            ? "bg-[#272727] border border-[#3f3f3f] opacity-100 shadow-sm"
            : tab.discarded
            ? "opacity-55 hover:opacity-95 hover:bg-[#1f1f1f] border border-transparent"
            : "opacity-100 hover:bg-[#272727] border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          {/* YouTube / Site Favicon: B&W grayscale with high contrast when sleeping, vibrant full color when loaded */}
          <img
            src={tab.favIconUrl || "https://www.youtube.com/favicon.ico"}
            className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
              tab.discarded
                ? "grayscale contrast-125 opacity-60 group-hover:opacity-85"
                : "grayscale-0 opacity-100"
            }`}
            alt=""
          />

          <span
            className={`truncate text-sm transition-colors ${
              tab.discarded
                ? "text-[#888888] group-hover:text-[#e0e0e0]"
                : isActive
                ? "text-white font-medium"
                : "text-[#f1f1f1]"
            }`}
            title={`${tab.title} • ${memoryText}`}
          >
            {tab.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1 shrink-0">
          {/* Audio Playing / Muted Indicator & 1-click Mute Button */}
          {showAudioIndicator && (tab.audible || tab.mutedInfo?.muted) && (
            <button
              onClick={(e) => toggleMuteTab(tab.id!, e)}
              className="p-1 rounded hover:bg-[#3f3f3f] transition-colors"
              title={
                tab.mutedInfo?.muted
                  ? "Tab is muted - Click to unmute"
                  : "Playing audio - Click to mute"
              }
            >
              {tab.mutedInfo?.muted ? (
                <VolumeX size={13} className="text-red-400" />
              ) : (
                <Volume2 size={13} className="text-green-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Unified Single Action Button: Unloads first if loaded, closes if sleeping */}
          <button
            onClick={handleSingleButtonClick}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f0f0f] hover:bg-[#3f3f3f] ${
              !tab.discarded && closeButtonBehavior === "unload_then_close"
                ? "text-white hover:text-[#f1f1f1]"
                : "text-[#aaaaaa] hover:text-[#f1f1f1]"
            }`}
            title={
              !tab.discarded && closeButtonBehavior === "unload_then_close"
                ? "Unload tab (Click again to close)"
                : "Close tab"
            }
          >
            {!tab.discarded && closeButtonBehavior === "unload_then_close" ? (
              <Moon size={13} className="text-white" />
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
