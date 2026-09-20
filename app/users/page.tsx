import { Sidebar } from "@/components/Sidebar"
import { UserManager } from "@/components/UserManager"

export default function UsersPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Logins</h1>
          <UserManager />
        </div>
      </main>
    </div>
  )
}
