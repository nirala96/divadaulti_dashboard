import { Sidebar } from '@/components/Sidebar'
import { ProductionStitchingBoard } from '@/components/ProductionStitchingBoard'

export default function ProductionStitchingPage() {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-[1700px]">
          <ProductionStitchingBoard />
        </div>
      </main>
    </div>
  )
}
