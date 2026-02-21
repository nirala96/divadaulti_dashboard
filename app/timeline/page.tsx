import { Sidebar } from "@/components/Sidebar"
import { TimelineGanttView } from "@/components/TimelineGanttView"

export default function TimelinePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Timeline / Gantt View
            </h1>
            <p className="text-gray-600">
              Visual timeline of all scheduled designs with interactive date management
            </p>
          </div>
          <TimelineGanttView />
        </div>
      </main>
    </div>
  )
}
