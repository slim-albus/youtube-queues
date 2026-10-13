import { useEffect, useState, useCallback } from "react"
import "./style.css"
import { Header } from "./components/Header"
import { Fab } from "./components/Fab"
import { QueueItem } from "./components/QueueItem"
import { ContextMenu } from "./components/ContextMenu"
import { getSettings, defaultSettings, AppSettings } from "./lib/settings"

type TabGroup = chrome.tabGroups.TabGroup
type Tab = chrome.tabs.Tab

interface Queue {
  group: TabGroup
  tabs: Tab[]
}

const colorMap: Record<string, string> = {
  grey: "#71717a",
  blue: "#3b82f6",
  red: "#ff0000",
  yellow: "#eab308",
  green: "#22c55e",
  pink: "#ec4899",
  purple: "#a855f7",
  cyan: "#06b6d4",
  orange: "#f97316"
}

function SidePanel() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [queues, setQueues] = useState<Queue[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)

  // Stats
  const [totalTabs, setTotalTabs] = useState(0)
  const [loadedTabs, setLoadedTabs] = useState(0)

  // Edit states
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Create state
  const [isCreatingQueue, setIsCreatingQueue] = useState(false)
  const [newQueueName, setNewQueueName] = useState("")

  // Drag state
  const [draggedTab, setDraggedTab] = useState<Tab | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<"before" | "after">("after")

  // Independent sidebar collapse state
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<number>>(new Set())

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    tab: Tab
  } | null>(null)

  // Contextual scroll helper state
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null)

  // Load Settings
  useEffect(() => {
    getSettings().then(setSettings)
    const handleStorageChange = () => {
      getSettings().then(setSettings)
    }
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  const loadData = useCallback(async () => {
    const allGroups = await chrome.tabGroups.query({})
    const allYoutubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })

    setTotalTabs(allYoutubeTabs.length)
    setLoadedTabs(allYoutubeTabs.filter((t) => !t.discarded).length)

    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (activeTabs.length > 0) {
      setActiveTabId(activeTabs[0].id || null)
    }

    const queueMap = new Map<number, Queue>()

    for (const tab of allYoutubeTabs) {
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        if (!queueMap.has(tab.groupId)) {
          const group = allGroups.find((g) => g.id === tab.groupId)
          if (group) {
            queueMap.set(tab.groupId, { group, tabs: [] })
          }
        }
        queueMap.get(tab.groupId)?.tabs.push(tab)
      }
    }

    setQueues(Array.from(queueMap.values()))
  }, [])

  useEffect(() => {
    loadData()
    const events = [
      chrome.tabs.onUpdated,
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onMoved,
      chrome.tabs.onActivated,
      chrome.tabGroups.onUpdated,
      chrome.tabGroups.onRemoved
    ]
    events.forEach((e) => e.addListener(loadData))
    return () => events.forEach((e) => e.removeListener(loadData))
  }, [loadData])

  // Contextual scroll calculation
  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      if (scrollHeight <= clientHeight + 40) {
        setScrollDirection(null)
      } else if (scrollTop > 80) {
        setScrollDirection("up")
      } else {
        setScrollDirection("down")
      }
    }

    window.addEventListener("scroll", updateScrollState)
    window.addEventListener("resize", updateScrollState)
    updateScrollState()

    return () => {
      window.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [queues])

  const handleScrollClick = () => {
    if (scrollDirection === "up") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else if (scrollDirection === "down") {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })
    }
  }

  const focusQueue = async (queue: Queue) => {
    if (queue.tabs.length > 0) {
      await chrome.windows.update(queue.group.windowId, { focused: true })
      await chrome.tabs.update(queue.tabs[0].id!, { active: true })
    }
  }

  const deleteQueue = async (queue: Queue) => {
    const tabIds = queue.tabs.map((t) => t.id!)
    await chrome.tabs.remove(tabIds)
  }

  const submitNewQueue = async () => {
    if (!newQueueName.trim()) {
      setIsCreatingQueue(false)
      return
    }
    const newTab = await chrome.tabs.create({ url: "https://www.youtube.com", active: false })
    const groupId = await chrome.tabs.group({ tabIds: newTab.id! })
    await chrome.tabGroups.update(groupId, {
      title: newQueueName.trim(),
      color: "red",
      collapsed: settings.keepBrowserGroupsCollapsed
    })
    setIsCreatingQueue(false)
    setNewQueueName("")
  }

  const closeTab = async (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await chrome.tabs.remove(tabId)
  }

  const unloadTab = async (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await chrome.tabs.discard(tabId).catch(() => {})
    loadData()
  }

  const handleUnloadAllOtherTabs = async () => {
    const allYoutubeTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" })
    for (const tab of allYoutubeTabs) {
      if (!tab.active && !tab.discarded && tab.id) {
        await chrome.tabs.discard(tab.id).catch(() => {})
      }
    }
    loadData()
  }

  const toggleCollapse = async (queue: Queue) => {
    if (settings.keepBrowserGroupsCollapsed) {
      // Independent sidebar collapse state
      setCollapsedGroupIds((prev) => {
        const next = new Set(prev)
        if (next.has(queue.group.id)) {
          next.delete(queue.group.id)
        } else {
          next.add(queue.group.id)
        }
        return next
      })
      // Ensure browser tab group stays collapsed
      await chrome.tabGroups.update(queue.group.id, { collapsed: true }).catch(() => {})
    } else {
      await chrome.tabGroups.update(queue.group.id, { collapsed: !queue.group.collapsed })
    }
  }

  const startRename = (group: TabGroup, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(group.title || "")
    setEditingGroupId(group.id)
  }

  const saveRename = async (groupId: number) => {
    await chrome.tabGroups.update(groupId, { title: editTitle.trim() || "Unnamed Queue" })
    setEditingGroupId(null)
  }

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, tab: Tab) => {
    setDraggedTab(tab)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, tab: Tab) => {
    e.preventDefault()
    if (!draggedTab || draggedTab.id === tab.id) return

    // Auto-scroll when dragging near viewport boundaries
    if (settings.autoScrollOnDrag) {
      if (e.clientY < 60) {
        window.scrollBy({ top: -14, behavior: "auto" })
      } else if (e.clientY > window.innerHeight - 60) {
        window.scrollBy({ top: 14, behavior: "auto" })
      }
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const pos = e.clientY < midY ? "before" : "after"

    if (dragOverTabId !== tab.id || dragPosition !== pos) {
      setDragOverTabId(tab.id!)
      setDragPosition(pos)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetTab: Tab) => {
    e.preventDefault()
    setDragOverTabId(null)

    if (!draggedTab || draggedTab.id === targetTab.id) return

    let dropIndex = targetTab.index
    if (dragPosition === "after") {
      dropIndex += 1
    }

    if (draggedTab.groupId !== targetTab.groupId) {
      await chrome.tabs.group({ tabIds: draggedTab.id!, groupId: targetTab.groupId })
      if (settings.keepBrowserGroupsCollapsed) {
        await chrome.tabGroups.update(targetTab.groupId, { collapsed: true }).catch(() => {})
      }
    }
    await chrome.tabs.move(draggedTab.id!, { index: dropIndex })
    setDraggedTab(null)
  }

  const handleGoToTab = async (tab: Tab) => {
    await chrome.windows.update(tab.windowId, { focused: true })
    await chrome.tabs.update(tab.id!, { active: true })
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  // Context Menu triggers
  const handleContextMenu = (e: React.MouseEvent, tab: Tab) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tab
    })
  }

  const handleMoveToQueue = async (tab: Tab, targetGroupId: number) => {
    await chrome.tabs.group({ tabIds: tab.id!, groupId: targetGroupId })
    if (settings.keepBrowserGroupsCollapsed) {
      await chrome.tabGroups.update(targetGroupId, { collapsed: true }).catch(() => {})
    }
    loadData()
  }

  const handleMoveToNewQueue = async (tab: Tab) => {
    const groupId = await chrome.tabs.group({ tabIds: tab.id! })
    await chrome.tabGroups.update(groupId, {
      title: "YouTube Queue",
      color: "red",
      collapsed: settings.keepBrowserGroupsCollapsed
    })
    loadData()
  }

  // Estimated RAM consumption for active tabs (average ~240MB per loaded watch page, 0 for sleeping)
  const ramMb = loadedTabs * 240

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] p-2 font-sans selection:bg-[#ff0000]/30 pb-20 relative">
      <Header
        totalTabs={totalTabs}
        loadedTabs={loadedTabs}
        statsDisplayLocation={settings.statsDisplayLocation}
        openOptions={openOptions}
      />

      <div className="relative z-10">
        {queues.length === 0 && (
          <div className="text-center text-[#aaaaaa] mt-10 text-sm">
            No YouTube queues found.<br /> Open a video to start.
          </div>
        )}

        {queues.map((queue) => {
          const isCollapsed = settings.keepBrowserGroupsCollapsed
            ? collapsedGroupIds.has(queue.group.id)
            : queue.group.collapsed

          return (
            <QueueItem
              key={queue.group.id}
              queue={queue}
              colorMap={colorMap}
              editingGroupId={editingGroupId}
              editTitle={editTitle}
              activeTabId={activeTabId}
              dragOverTabId={dragOverTabId}
              dragPosition={dragPosition}
              isCollapsed={isCollapsed}
              stickyHeaders={settings.stickyQueueHeaders}
              useQueueColorForIndicator={settings.useQueueColorForIndicator}
              closeButtonBehavior={settings.closeButtonBehavior}
              setEditTitle={setEditTitle}
              startRename={startRename}
              saveRename={saveRename}
              toggleCollapse={toggleCollapse}
              focusQueue={focusQueue}
              deleteQueue={deleteQueue}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={() => setDragOverTabId(null)}
              handleDrop={handleDrop}
              handleGoToTab={handleGoToTab}
              closeTab={closeTab}
              unloadTab={unloadTab}
              onContextMenu={handleContextMenu}
            />
          )
        })}
      </div>

      <Fab
        isCreatingQueue={isCreatingQueue}
        setIsCreatingQueue={setIsCreatingQueue}
        newQueueName={newQueueName}
        setNewQueueName={setNewQueueName}
        submitNewQueue={submitNewQueue}
        totalTabs={totalTabs}
        loadedTabs={loadedTabs}
        ramMb={ramMb}
        statsDisplayLocation={settings.statsDisplayLocation}
        showScrollHelperButtons={settings.showScrollHelperButtons}
        scrollDirection={scrollDirection}
        onScrollClick={handleScrollClick}
        onUnloadAllOtherTabs={handleUnloadAllOtherTabs}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tab={contextMenu.tab}
          queues={queues}
          colorMap={colorMap}
          onClose={() => setContextMenu(null)}
          onMoveToQueue={handleMoveToQueue}
          onMoveToNewQueue={handleMoveToNewQueue}
          onUnloadTab={(tabId) => {
            chrome.tabs.discard(tabId).catch(() => {})
            loadData()
          }}
          onUnloadAllOtherTabs={handleUnloadAllOtherTabs}
          onCloseTab={(tabId) => {
            chrome.tabs.remove(tabId).catch(() => {})
            loadData()
          }}
        />
      )}
    </div>
  )
}

export default SidePanel
