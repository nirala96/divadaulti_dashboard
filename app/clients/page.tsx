"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { AddClientModal } from "@/components/AddClientModal"
import { getClients, type Client } from "@/lib/actions"
import { Link2 } from "lucide-react"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const data = await getClients()
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyTrackingLink(trackingToken: string, clientId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const trackingUrl = `${baseUrl}/track/${trackingToken}`
    navigator.clipboard.writeText(trackingUrl)
    setCopiedId(clientId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <AddClientModal onClientAdded={fetchClients} />
          </div>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">No clients yet. Add your first client using the button above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{client.contact_person || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{client.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.tracking_token ? (
                          <button
                            onClick={() => copyTrackingLink(client.tracking_token, client.id)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              copiedId === client.id
                                ? 'bg-green-500 text-white'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            <Link2 className="w-4 h-4" />
                            {copiedId === client.id ? 'Copied!' : 'Copy Link'}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No tracking link</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
