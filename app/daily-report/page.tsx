import { Sidebar } from "@/components/Sidebar"
import { DailyReportBoard } from "@/components/DailyReportBoard"

export default function DailyReportPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
            <p className="text-gray-600 mt-1">
              Client check-ins per merchandiser, saved every day. Use &quot;Send on WhatsApp&quot;, pick the group and press Send.
            </p>
          </div>
          <DailyReportBoard />
        </div>
      </main>
    </div>
  )
}
