import { Plus, Check, X, Moon, ChevronUp, ChevronDown } from "lucide-react"
import { StatsDisplayLocation } from "../lib/settings"

interface FabProps {
  isCreatingQueue: boolean
  setIsCreatingQueue: (val: boolean) => void
  newQueueName: string
  setNewQueueName: (val: string) => void
  submitNewQueue: () => void
  totalTabs: number
  loadedTabs: number
  ramMb: number
  statsDisplayLocation: StatsDisplayLocation
  showScrollHelperButtons: boolean
  scrollDirection: "up" | "down" | null
  onScrollClick: () => void
  onUnloadAllOtherTabs: () => void
}

export function Fab({
  isCreatingQueue,
  setIsCreatingQueue,
  newQueueName,
  setNewQueueName,
  submitNewQueue,
  totalTabs,
  loadedTabs,
  ramMb,
  statsDisplayLocation,
  showScrollHelperButtons,
  scrollDirection,
  onScrollClick,
  onUnloadAllOtherTabs
}: FabProps) {
  const showStatsInFab =
    statsDisplayLocation === "fab" || statsDisplayLocation === "both"

  return (
    <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
      {/* Contextual Scroll Mini-Button (Interchangeable) */}
      {showScrollHelperButtons && scrollDirection && (
        <button
          onClick={onScrollClick}
          className="bg-[#272727]/90 hover:bg-[#383838] text-[#aaaaaa] hover:text-white p-1.5 rounded-full border border-[#3f3f3f] shadow-lg transition-transform active:scale-90 animate-in fade-in zoom-in-90"
          title={scrollDirection === "up" ? "Scroll to Top" : "Scroll to Bottom"}
        >
          {scrollDirection === "up" ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      )}

      {/* Creating Queue Input Form */}
      {isCreatingQueue ? (
        <div className="flex items-center gap-1 bg-[#272727] p-1.5 rounded-xl border border-[#3f3f3f] shadow-2xl animate-in slide-in-from-bottom-2">
          <input
            autoFocus
            className="bg-[#0f0f0f] text-sm w-44 outline-none px-2.5 py-1.5 text-[#f1f1f1] rounded-lg border border-[#3f3f3f] focus:border-[#aaaaaa]"
            placeholder="Queue name..."
            value={newQueueName}
            onChange={(e) => setNewQueueName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNewQueue()}
          />
          <button
            onClick={submitNewQueue}
            className="text-green-400 p-1.5 hover:bg-[#3f3f3f] rounded-lg transition-colors"
            title="Create Queue"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => setIsCreatingQueue(false)}
            className="text-red-400 p-1.5 hover:bg-[#3f3f3f] rounded-lg transition-colors"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        /* Multi-purpose FAB HUD */
        <div className="flex items-center gap-1 bg-[#212121]/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#3f3f3f] shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
          {showStatsInFab && (
            <div className="flex items-center gap-1.5 text-xs text-[#aaaaaa] pr-1.5 border-r border-[#383838] select-none">
              <span className="font-semibold text-[#f1f1f1]">{totalTabs} vids</span>
              <span>•</span>
              <span className="text-green-400 font-medium">({loadedTabs})</span>
              <span>•</span>
              <span className="text-[#888888] font-mono">~{ramMb}MB</span>
            </div>
          )}

          {/* Unload All Other Tabs Quick Action */}
          <button
            onClick={onUnloadAllOtherTabs}
            className="text-[#aaaaaa] hover:text-yellow-400 p-1.5 rounded-full hover:bg-[#333333] transition-colors"
            title="Unload All Other Tabs"
          >
            <Moon size={15} />
          </button>

          {/* Create Queue Button */}
          <button
            onClick={() => setIsCreatingQueue(true)}
            className="bg-[#ff0000] hover:bg-[#cc0000] text-white p-1.5 rounded-full shadow-sm transition-transform active:scale-95"
            title="Create New Queue"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
