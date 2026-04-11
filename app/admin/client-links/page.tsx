import { getClients } from '@/lib/actions'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { ClientLinkRow } from '@/components/ClientLinkRow'

export default async function ClientLinksPage() {
  const clients = await getClients()
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://divadaultidashboard-production.up.railway.app'
  
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Tracking Links</h1>
              <p className="text-gray-600">Share these unique URLs with clients to track their orders</p>
            </div>
          </div>
        </div>
        
        {/* Links Table */}
        <div className="p-6">
          <div className="space-y-3">
            {clients.map((client: any) => (
              <ClientLinkRow key={client.id} client={client} baseUrl={baseUrl} />
            ))}
          </div>
        </div>
        
        {/* Back Button */}
        <div className="p-4 border-t bg-gray-50">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
