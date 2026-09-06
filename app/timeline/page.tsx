import { Sidebar } from "@/components/Sidebar"
import { CapacityTimeline } from "@/components/CapacityTimeline"

export default function TimelinePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <CapacityTimeline />
        </div>
      </main>
    </div>
  )
}
