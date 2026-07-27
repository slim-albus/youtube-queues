import { Settings } from "lucide-react"

interface HeaderProps {
  totalTabs: number
  loadedTabs: number
  openOptions: () => void
}

export function Header({ totalTabs, loadedTabs, openOptions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-20 py-1.5 border-b border-[#272727]">
      <div className="flex items-center gap-1.5">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="#ff0000" 
          className="flex-shrink-0"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span className="text-base font-bold text-[#f1f1f1]">{totalTabs} Videos</span>
        <span className="text-xs text-green-500 font-medium">
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
