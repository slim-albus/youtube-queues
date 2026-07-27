import { PlaySquare, Settings } from "lucide-react"

interface HeaderProps {
  totalTabs: number
  loadedTabs: number
  openOptions: () => void
}

export function Header({ totalTabs, loadedTabs, openOptions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-20 py-3 border-b border-[#272727]">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#aaaaaa] uppercase tracking-widest font-bold">YouTube Tabs:</span>
        <span className="text-base font-bold text-[#f1f1f1]">{totalTabs}</span>
        <span className="text-[11px] text-[#aaaaaa] font-medium tracking-wide">
          (<span className="text-green-500/90">{loadedTabs}</span> active)
        </span>
      </div>
      
      <button 
        onClick={openOptions}
        className="text-[#aaaaaa] hover:text-[#f1f1f1] p-1.5 rounded-full hover:bg-[#272727] transition-colors"
        title="Settings"
      >
        <Settings size={18} />
      </button>
    </div>
  )
}
