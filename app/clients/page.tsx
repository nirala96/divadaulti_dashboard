import { Sidebar } from "@/components/Sidebar"
import { AddClientModal } from "@/components/AddClientModal"

export default function ClientsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <AddClientModal />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              Client list will appear here. The Add Client modal is functional and ready to use.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
