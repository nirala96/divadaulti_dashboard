import { Sidebar } from '@/components/Sidebar'
import TodaysPlanBoard from '@/components/TodaysPlanBoard'
import { ClientCheckinBoard } from '@/components/ClientCheckinBoard'

export default function TodaysPlanPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TodaysPlanBoard />
        <ClientCheckinBoard />
      </main>
    </div>
  )
}
