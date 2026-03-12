import { Sidebar } from '@/components/Sidebar'
import WorkPoints from '@/components/WorkPoints'

export default function WorkPointsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <WorkPoints />
      </main>
    </div>
  )
}
