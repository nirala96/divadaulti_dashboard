import { Sidebar } from "@/components/Sidebar"
import { AddDesignForm } from "@/components/AddDesignForm"

export default function OrdersPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders / Designs</h1>
          <AddDesignForm />
        </div>
      </main>
    </div>
  )
}
