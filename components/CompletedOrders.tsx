"use client"

import { useState, useEffect, useMemo } from "react"
import { getCompletedDesigns, deleteDesign, restoreDesign, type Design } from "@/lib/actions"
import { formatDisplayDate } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, ImageIcon, FileText, Trash2, RotateCcw, Package, Shirt } from "lucide-react"
import Image from "next/image"
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DesignStatus = string
type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'

const STAGES: DesignStatus[] = [
  'Consultation',
  'Fabric Finalize',
  'Trims Sourcing',
  'Dye',
  'Print',
  'Pattern',
  'Embroidery',
  'Cutting',
  'Stitching',
  'Finishing'
]

interface DesignWithClient extends Design {
  client_name: string
  client_id: string
}

interface ClientGroup {
  client_id: string
  client_name: string
  designs: DesignWithClient[]
}

const ALL_TIME = "all"

// Dates coming back from server actions may arrive as Date instances rather
// than strings (Next.js preserves Date objects across the server/client
// boundary), so always coerce before doing string/date operations.
function toMonthKey(value: string | Date): string {
  const d = new Date(value)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}

export function CompletedOrders() {
  const [allCompleted, setAllCompleted] = useState<DesignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<DesignWithClient | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DesignWithClient | null>(null)
  const [viewingNotes, setViewingNotes] = useState<DesignWithClient | null>(null)
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toMonthKey(new Date()))

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
      const designsData = await getCompletedDesigns()

      const designsWithClients: DesignWithClient[] = designsData.map((design: any) => ({
        ...design,
        client_name: design.client_name || 'Unknown Client',
      }))

      setAllCompleted(designsWithClients.filter(isDesignCompleted))
    } catch (error) {
      console.error('Error fetching completed designs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Orders completed before completion timestamps were tracked have no
  // completed_at, so they can't be attributed to a month.
  const noTimestampCount = useMemo(
    () => allCompleted.filter(d => !d.completed_at).length,
    [allCompleted]
  )

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([toMonthKey(new Date())])
    allCompleted.forEach(d => {
      if (d.completed_at) keys.add(toMonthKey(d.completed_at))
    })
    return Array.from(keys).sort((a, b) => b.localeCompare(a))
  }, [allCompleted])

  const visibleDesigns = useMemo(() => {
    if (selectedMonth === ALL_TIME) return allCompleted
    return allCompleted.filter(d => d.completed_at && toMonthKey(d.completed_at) === selectedMonth)
  }, [allCompleted, selectedMonth])

  const monthStats = useMemo(() => {
    const counted = selectedMonth === ALL_TIME
      ? allCompleted.filter(d => d.completed_at)
      : visibleDesigns
    return {
      orders: counted.length,
      pieces: counted.reduce((sum, d) => sum + (d.quantity || 0), 0),
    }
  }, [allCompleted, visibleDesigns, selectedMonth])

  const clientGroups: ClientGroup[] = useMemo(() => {
    const groupedByClient: Record<string, DesignWithClient[]> = {}
    visibleDesigns.forEach(design => {
      const clientId = design.client_id || 'unknown'
      if (!groupedByClient[clientId]) {
        groupedByClient[clientId] = []
      }
      groupedByClient[clientId].push(design)
    })

    return Object.entries(groupedByClient).map(([clientId, designs]) => ({
      client_id: clientId,
      client_name: designs[0]?.client_name || 'Unknown Client',
      designs,
    }))
  }, [visibleDesigns])

  const toggleClientExpansion = (clientId: string) => {
    setCollapsedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const handleRestoreDesign = async () => {
    if (!confirmRestore) return

    try {
      await restoreDesign(confirmRestore.id)
      setAllCompleted(prev => prev.filter(d => d.id !== confirmRestore.id))
      setConfirmRestore(null)
    } catch (error: any) {
      console.error('Error restoring design:', error)
      alert('Failed to restore design: ' + error.message)
    }
  }

  const handleDeleteDesign = async () => {
    if (!confirmDelete) return

    try {
      await deleteDesign(confirmDelete.id)
      setAllCompleted(prev => prev.filter(d => d.id !== confirmDelete.id))
      setConfirmDelete(null)
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

  const totalVisible = clientGroups.reduce((sum, group) => sum + group.designs.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Completed Orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalVisible} order{totalVisible !== 1 ? 's' : ''} across {clientGroups.length} client{clientGroups.length !== 1 ? 's' : ''}
              {selectedMonth !== ALL_TIME && ` in ${formatMonthLabel(selectedMonth)}`}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {monthOptions.map(key => (
                <option key={key} value={key}>{formatMonthLabel(key)}</option>
              ))}
              <option value={ALL_TIME}>All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Shirt className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{monthStats.orders}</div>
            <div className="text-xs text-gray-500">
              {selectedMonth === ALL_TIME ? 'Styles completed (all time)' : `Styles completed in ${formatMonthLabel(selectedMonth)}`}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{monthStats.pieces}</div>
            <div className="text-xs text-gray-500">
              {selectedMonth === ALL_TIME ? 'Pieces completed (all time)' : `Pieces completed in ${formatMonthLabel(selectedMonth)}`}
            </div>
          </div>
        </div>
      </div>

      {noTimestampCount > 0 && (
        <p className="text-xs text-gray-500 -mt-2">
          {noTimestampCount} older completed order{noTimestampCount !== 1 ? 's' : ''} {noTimestampCount !== 1 ? 'have' : 'has'} no recorded completion date and {noTimestampCount !== 1 ? "aren't" : "isn't"} counted in monthly totals — only visible under "All time".
        </p>
      )}

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
                Completed
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
                  No completed orders {selectedMonth !== ALL_TIME ? `in ${formatMonthLabel(selectedMonth)}` : 'yet'}.
                </td>
              </tr>
            ) : (
              clientGroups.map(group => {
                const isExpanded = !collapsedClients.has(group.client_id)
                return (
                <>
                  {/* Client Header Row */}
                  <tr key={`header-${group.client_id}`} className="bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap" colSpan={4}>
                      <div className="flex items-center gap-2">
                        <span
                          className="cursor-pointer"
                          onClick={() => toggleClientExpansion(group.client_id)}
                        >
                          {isExpanded ? (
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
                  {isExpanded && group.designs.map(design => (
                    <tr key={design.id} className="bg-gray-50 opacity-75">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 pl-7">
                          {design.images && design.images.length > 0 ? (
                            <div
                              className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                              onClick={() => setPreviewImage(design.images![0])}
                            >
                              <Image
                                src={design.images![0]}
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
                              <span className="text-xs text-gray-400 no-underline">{design.quantity} pcs</span>
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
                        {design.completed_at ? (
                          <div className="text-xs text-gray-600">
                            {formatDisplayDate(design.completed_at)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400" title="No completion timestamp recorded — showing the estimated delivery date instead">
                            ~{formatDisplayDate(design.end_date)} (est.)
                          </div>
                        )}
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
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewDialog imageUrl={previewImage} onClose={() => setPreviewImage(null)} />

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
