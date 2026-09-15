import { Sidebar } from "@/components/Sidebar"
import { AddDesignForm } from "@/components/AddDesignForm"
import { MerchandiserManager } from "@/components/MerchandiserManager"

export default function OrdersPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Orders / Designs</h1>
          <MerchandiserManager />
          <AddDesignForm />
        </div>
      </main>
    </div>
  )
}
