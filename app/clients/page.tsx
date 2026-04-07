"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { AddClientModal } from "@/components/AddClientModal"
import { supabase, type Client } from "@/lib/supabase"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
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
