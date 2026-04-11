'use client'

import { Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function ClientLinkRow({ client, baseUrl }: { client: any; baseUrl: string }) {
  const [copied, setCopied] = useState(false)
  const trackingUrl = `${baseUrl}/track/${client.tracking_token}`
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{client.name}</h3>
        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
          {trackingUrl}
        </code>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded transition-colors flex items-center gap-2 ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        
        <Link
          href={`/track/${client.tracking_token}`}
          target="_blank"
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="View in new tab"
        >
          <ExternalLink className="w-4 h-4 text-gray-600" />
        </Link>
      </div>
    </div>
  )
}
