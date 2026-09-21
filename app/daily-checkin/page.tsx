import { Sidebar } from '@/components/Sidebar'
import { ClientCheckinBoard } from '@/components/ClientCheckinBoard'

export default function DailyCheckinPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <ClientCheckinBoard />
      </main>
    </div>
  )
}
