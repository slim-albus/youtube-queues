import { PlaySquare, Settings } from "lucide-react"

interface HeaderProps {
  totalTabs: number
  loadedTabs: number
  openOptions: () => void
}

export function Header({ totalTabs, loadedTabs, openOptions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-20 py-3 border-b border-[#272727]">
      <div className="flex items-center gap-1.5">
        <span className="text-base font-bold text-[#f1f1f1]">{totalTabs} Videos</span>
        <span className="text-xs text-[#aaaaaa] font-medium">
          ({loadedTabs})
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
