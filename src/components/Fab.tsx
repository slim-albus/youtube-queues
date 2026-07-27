import { Plus, Check, X } from "lucide-react"

interface FabProps {
  isCreatingQueue: boolean
  setIsCreatingQueue: (val: boolean) => void
  newQueueName: string
  setNewQueueName: (val: string) => void
  submitNewQueue: () => void
}

export function Fab({ isCreatingQueue, setIsCreatingQueue, newQueueName, setNewQueueName, submitNewQueue }: FabProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isCreatingQueue && (
        <div className="flex items-center gap-1 bg-[#272727] p-1.5 rounded-xl border border-[#3f3f3f] shadow-2xl mb-2 animate-in slide-in-from-bottom-2">
          <input 
            autoFocus
            className="bg-[#0f0f0f] text-sm w-48 outline-none px-3 py-2 text-[#f1f1f1] rounded-lg border border-[#3f3f3f] focus:border-[#aaaaaa]"
            placeholder="Queue name..."
            value={newQueueName}
            onChange={e => setNewQueueName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitNewQueue()}
          />
          <button onClick={submitNewQueue} className="text-green-400 p-2 hover:bg-[#3f3f3f] rounded-lg">
            <Check size={18} />
          </button>
          <button onClick={() => setIsCreatingQueue(false)} className="text-red-400 p-2 hover:bg-[#3f3f3f] rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}
      
      {!isCreatingQueue && (
        <button 
          onClick={() => setIsCreatingQueue(true)}
          className="bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] p-3.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[#3f3f3f] transition-transform active:scale-95 flex items-center justify-center"
          title="Create New Queue"
        >
          <Plus size={22} />
        </button>
      )}
    </div>
  )
}
