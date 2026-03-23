"use client"

import { useState, useEffect } from "react"
import { supabase, type Design, type DesignStatus, type DesignType, type StageState } from "@/lib/supabase"
import { formatDisplayDate } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Calendar, ImageIcon, FileText, Trash2, RotateCcw } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STAGES: DesignStatus[] = [
  'Payment Received',
  'Fabric Finalize',
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Dye',
  'Print',
  'Embroidery',
  'Wash',
  'Kaaj',
  'Finishing',
  'Photoshoot',
  'Final Settlement',
  'Dispatch'
]

interface DesignWithClient extends Design {
  client_name: string
  client_id: string
}

interface ClientGroup {
  client_id: string
  client_name: string
  designs: DesignWithClient[]
  isExpanded: boolean
}

export function CompletedOrders() {
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<DesignWithClient | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DesignWithClient | null>(null)
  const [viewingNotes, setViewingNotes] = useState<DesignWithClient | null>(null)

  useEffect(() => {
    fetchCompletedDesigns()
  }, [])

  const isDesignCompleted = (design: DesignWithClient): boolean => {
    if (!design.stage_status) return false
    return STAGES.every(stage => design.stage_status?.[stage] === 'completed')
  }

  const fetchCompletedDesigns = async () => {
    setLoading(true)
    try {
      const { data: designsData, error } = await supabase
        .from('designs')
        .select('*, clients(name, id)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const designsWithClients: DesignWithClient[] = (designsData || []).map((design: any) => ({
        ...design,
        client_name: design.clients?.name || 'Unknown Client',
        client_id: design.clients?.id || design.client_id
      }))

      // Filter only completed designs
      const completedDesigns = designsWithClients.filter(isDesignCompleted)

      // Group by client
      const groupedByClient: Record<string, DesignWithClient[]> = {}
      completedDesigns.forEach(design => {
        const clientId = design.client_id || 'unknown'
        if (!groupedByClient[clientId]) {
          groupedByClient[clientId] = []
        }
        groupedByClient[clientId].push(design)
      })

      const groups: ClientGroup[] = Object.entries(groupedByClient).map(([clientId, designs]) => ({
        client_id: clientId,
        client_name: designs[0]?.client_name || 'Unknown Client',
        designs: designs,
        isExpanded: true
      }))

      setClientGroups(groups)
    } catch (error) {
      console.error('Error fetching completed designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientExpansion = (clientId: string) => {
    setClientGroups(prev =>
      prev.map(group =>
        group.client_id === clientId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  const handleRestoreDesign = async () => {
    if (!confirmRestore) return
    
    try {
      // Reset all stages to vacant
      const vacantStageStatus: Record<DesignStatus, StageState> = {
        'Payment Received': 'vacant',
        'Fabric Finalize': 'vacant',
        'Pattern': 'vacant',
        'Grading': 'vacant',
        'Cutting': 'vacant',
        'Stitching': 'vacant',
        'Dye': 'vacant',
        'Print': 'vacant',
        'Embroidery': 'vacant',
        'Wash': 'vacant',
        'Kaaj': 'vacant',
        'Finishing': 'vacant',
        'Photoshoot': 'vacant',
        'Final Settlement': 'vacant',
        'Dispatch': 'vacant'
      }

      const { error } = await supabase
        .from('designs')
        .update({ 
          stage_status: vacantStageStatus,
          status: 'Payment Received'
        })
        .eq('id', confirmRestore.id)

      if (error) throw error

      setConfirmRestore(null)
      fetchCompletedDesigns()
    } catch (error: any) {
      console.error('Error restoring design:', error)
      alert('Failed to restore design: ' + error.message)
    }
  }

  const handleDeleteDesign = async () => {
    if (!confirmDelete) return
    
    try {
      const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', confirmDelete.id)

      if (error) throw error

      setConfirmDelete(null)
      fetchCompletedDesigns()
    } catch (error: any) {
      console.error('Error deleting design:', error)
      alert('Failed to delete design: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading completed orders...</p>
      </div>
    )
  }

  const totalCompleted = clientGroups.reduce((sum, group) => sum + group.designs.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Completed Orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalCompleted} order{totalCompleted !== 1 ? 's' : ''} across {clientGroups.length} client{clientGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-30 shadow-md border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Product / Client
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Completed Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientGroups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No completed orders yet.
                </td>
              </tr>
            ) : (
              clientGroups.map(group => (
                <>
                  {/* Client Header Row */}
                  <tr key={`header-${group.client_id}`} className="bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap" colSpan={4}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="cursor-pointer"
                          onClick={() => toggleClientExpansion(group.client_id)}
                        >
                          {group.isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </span>
                        <div className="flex-1" onClick={() => toggleClientExpansion(group.client_id)}>
                          <div className="text-sm font-bold text-gray-900">{group.client_name}</div>
                          <div className="text-xs text-gray-500">{group.designs.length} completed order{group.designs.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Product Rows */}
                  {group.isExpanded && group.designs.map(design => (
                    <tr key={design.id} className="bg-gray-50 opacity-75">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 pl-7">
                          {design.images && design.images.length > 0 ? (
                            <div 
                              className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                              onClick={() => setPreviewImage(design.images[0])}
                            >
                              <Image
                                src={design.images[0]}
                                alt={design.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}  
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-500 line-through">
                              {design.title}
                              <span className="ml-2 text-xs text-green-600 font-semibold no-underline">✓ COMPLETED</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {design.notes && design.notes.trim() && (
                                <button 
                                  onClick={() => setViewingNotes(design)}
                                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  View Notes
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge 
                          variant={design.type === 'Sampling' ? 'secondary' : 'default'}
                          className="text-xs opacity-60"
                        >
                          {design.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-xs text-gray-600">
                          {design.end_date ? formatDisplayDate(design.end_date) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                            onClick={() => setConfirmRestore(design)}
                            title="Restore to active orders"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                            onClick={() => setConfirmDelete(design)}
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Design Image</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-full h-[600px]">
              <Image
                src={previewImage}
                alt="Design preview"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Notes Modal */}
      <Dialog open={!!viewingNotes} onOpenChange={() => setViewingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingNotes?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingNotes?.notes}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore "{confirmRestore?.title}"? All stages will be reset and it will move back to active orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmRestore(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreDesign}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restore Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{confirmDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteDesign}
              variant="destructive"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
