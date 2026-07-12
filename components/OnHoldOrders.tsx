"use client"

import { useState, useEffect } from "react"
import { getHeldClientsWithDesigns, unholdClient, type Design } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, ImageIcon, FileText, PauseCircle, PlayCircle } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DesignStatus = string

const STAGES: DesignStatus[] = [
  'Fabric Finalize',
  'Trims Sourcing',
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Dye',
  'Print',
  'Embroidery'
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

export function OnHoldOrders() {
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [viewingNotes, setViewingNotes] = useState<DesignWithClient | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<ClientGroup | null>(null)

  useEffect(() => {
    fetchHeldDesigns()
  }, [])

  const fetchHeldDesigns = async () => {
    setLoading(true)
    try {
      const designsData = await getHeldClientsWithDesigns()

      const designsWithClients: DesignWithClient[] = (designsData || []).map((design: any) => ({
        ...design,
        client_name: design.client_name || 'Unknown Client',
      }))

      const groupedByClient: Record<string, DesignWithClient[]> = {}
      designsWithClients.forEach(design => {
        const clientId = design.client_id || 'unknown'
        if (!groupedByClient[clientId]) {
          groupedByClient[clientId] = []
        }
        groupedByClient[clientId].push(design)
      })

      const groups: ClientGroup[] = Object.entries(groupedByClient).map(([clientId, designs]) => ({
        client_id: clientId,
        client_name: designs[0]?.client_name || 'Unknown Client',
        designs,
        isExpanded: true
      }))

      setClientGroups(groups)
    } catch (error) {
      console.error('Error fetching on hold designs:', error)
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

  const handleRestoreClient = async () => {
    if (!confirmRestore) return

    try {
      await unholdClient(confirmRestore.client_id)

      setClientGroups(prev => prev.filter(group => group.client_id !== confirmRestore.client_id))
      setConfirmRestore(null)
    } catch (error: any) {
      console.error('Error restoring client:', error)
      alert('Failed to restore client: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading on hold clients...</p>
      </div>
    )
  }

  const totalHeld = clientGroups.reduce((sum, group) => sum + group.designs.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <PauseCircle className="h-6 w-6" />
          On Hold - Unresponsive Clients
        </h2>
        <p className="text-sm text-orange-600 mt-1">
          {totalHeld} product{totalHeld !== 1 ? 's' : ''} across {clientGroups.length} client{clientGroups.length !== 1 ? 's' : ''}.
          These clients are marked as unresponsive and hidden from the main dashboard. Click restore to move them back to active once they respond.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-30 shadow-md border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64 bg-gray-50">
                Client / Product
              </th>
              {STAGES.map(stage => (
                <th key={stage} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-gray-50">
                  {stage}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 bg-gray-50">
                Restore
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientGroups.length === 0 ? (
              <tr>
                <td colSpan={STAGES.length + 2} className="px-6 py-12 text-center text-gray-500">
                  No clients on hold.
                </td>
              </tr>
            ) : (
              clientGroups.map(group => (
                <>
                  {/* Client Header Row */}
                  <tr key={`header-${group.client_id}`} className="bg-orange-50">
                    <td className="px-6 py-4 whitespace-nowrap">
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
                          <div className="text-xs text-orange-600">{group.designs.length} product{group.designs.length !== 1 ? 's' : ''} on hold</div>
                        </div>
                      </div>
                    </td>
                    {STAGES.map(stage => (
                      <td key={stage} className="px-4 py-4"></td>
                    ))}
                    <td className="px-4 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                        onClick={() => setConfirmRestore(group)}
                        title="Client is responsive - move back to active"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </td>
                  </tr>

                  {/* Product Rows */}
                  {group.isExpanded && group.designs.map(design => (
                    <tr key={design.id} className="hover:bg-orange-50 border-l-4 border-l-orange-300">
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
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{design.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {design.type}
                              </Badge>
                              <span className="text-xs text-gray-500">Qty: {design.quantity}</span>
                            </div>
                            {design.notes && design.notes.trim() && (
                              <button
                                onClick={() => setViewingNotes(design)}
                                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                              >
                                <FileText className="h-3 w-3" />
                                View Notes
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      {STAGES.map(stage => {
                        const stageState = design.stage_status?.[stage] || 'vacant'
                        return (
                          <td key={stage} className="px-4 py-4 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                stageState === 'completed' ? 'bg-green-100 text-green-800' :
                                stageState === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                stageState === 'not-needed' ? 'bg-gray-100 text-gray-500' :
                                'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {stageState === 'vacant' ? '○' :
                               stageState === 'in-progress' ? '◐' :
                               stageState === 'completed' ? '●' : 'N/A'}
                            </Badge>
                          </td>
                        )
                      })}
                      <td className="px-4 py-4"></td>
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
                unoptimized
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
            <DialogTitle>Restore Client</DialogTitle>
            <DialogDescription>
              Are you sure "{confirmRestore?.client_name}" is responsive again? All their designs will move back to the main dashboard.
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
              onClick={handleRestoreClient}
              className="bg-green-600 hover:bg-green-700"
            >
              Restore Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
