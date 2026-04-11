'use client'

import { useState } from 'react'
import { CheckCircle, Trash2 } from 'lucide-react'
import { updateDesignStatus, deleteDesign } from '@/lib/actions'
import { useRouter } from 'next/navigation'

type AdminOrderActionsProps = {
  designId: number | string
  currentStatus: string
  designTitle: string
}

export function AdminOrderActions({ designId, currentStatus, designTitle }: AdminOrderActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleComplete = async () => {
    if (!confirm(`Mark "${designTitle}" as Completed?`)) return
    
    setLoading(true)
    try {
      await updateDesignStatus(String(designId), 'Completed')
      router.refresh()
    } catch (error) {
      alert('Failed to update order status')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${designTitle}"? This cannot be undone.`)) return
    
    setLoading(true)
    try {
      await deleteDesign(String(designId))
      router.refresh()
    } catch (error) {
      alert('Failed to delete order')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-amber-800 font-medium">
          🔐 Admin Controls
        </p>
        <div className="flex gap-2">
          {currentStatus !== 'Completed' && (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
