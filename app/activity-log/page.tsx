import { Sidebar } from "@/components/Sidebar"
import { ActivityLogFeed } from "@/components/ActivityLogFeed"

export default function ActivityLogPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600 mt-1">Who marked what stage completed, and when.</p>
          </div>
          <ActivityLogFeed />
        </div>
      </main>
    </div>
  )
}
