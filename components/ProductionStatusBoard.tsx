"use client"

import { useState, useEffect } from "react"
import { supabase, type Design, type DesignStatus, type DesignType, type StageState } from "@/lib/supabase"
import { formatDisplayDate } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight, Calendar, Package2, X, ImageIcon, FileText } from "lucide-react"
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
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Kaaj',
  'Embroidery',
  'Wash',
  'Finishing',
  'Photoshoot',
  'Final Settlement',
  'Dispatch'
]

const STAGE_COLORS: Record<DesignStatus, string> = {
  'Payment Received': 'bg-green-100 text-green-800',
  'Pattern': 'bg-blue-100 text-blue-800',
  'Grading': 'bg-purple-100 text-purple-800',
  'Cutting': 'bg-orange-100 text-orange-800',
  'Stitching': 'bg-pink-100 text-pink-800',
  'Kaaj': 'bg-indigo-100 text-indigo-800',
  'Embroidery': 'bg-violet-100 text-violet-800',
  'Wash': 'bg-cyan-100 text-cyan-800',
  'Finishing': 'bg-teal-100 text-teal-800',
  'Photoshoot': 'bg-fuchsia-100 text-fuchsia-800',
  'Final Settlement': 'bg-amber-100 text-amber-800',
  'Dispatch': 'bg-emerald-100 text-emerald-800',
}

type DesignWithClient = Design & {
  client_name?: string
  client_id?: string
}

type ClientGroup = {
  client_id: string
  client_name: string
  designs: DesignWithClient[]
  isExpanded: boolean
}

interface ProductionStatusBoardProps {
  filter?: DesignType | 'All'
}

export function ProductionStatusBoard({ filter = 'All' }: ProductionStatusBoardProps) {
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<DesignType | 'All'>(filter)
  const [activeStageFilter, setActiveStageFilter] = useState<DesignStatus | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editingDesign, setEditingDesign] = useState<DesignWithClient | null>(null)
  const [notesValue, setNotesValue] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetchDesigns()
  }, [activeFilter, activeStageFilter])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      // Fetch designs with client information
      const { data: designsData, error } = await supabase
        .from('designs')
        .select('*, clients(name, id)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to include client name and id
      const designsWithClients: DesignWithClient[] = (designsData || []).map((design: any) => ({
        ...design,
        client_name: design.clients?.name || 'Unknown Client',
        client_id: design.clients?.id || design.client_id
      }))

      // Apply type filter
      let filteredDesigns = activeFilter === 'All' 
        ? designsWithClients
        : designsWithClients.filter(d => d.type === activeFilter)

      // Apply stage filter (show only designs where stage is vacant or in-progress)
      if (activeStageFilter) {
        filteredDesigns = filteredDesigns.filter(d => {
          const stageState = d.stage_status?.[activeStageFilter] || 'vacant'
          return stageState === 'vacant' || stageState === 'in-progress'
        })
      }

      // Group by client
      const groupedByClient: Record<string, DesignWithClient[]> = {}
      filteredDesigns.forEach(design => {
        const clientId = design.client_id || 'unknown'
        if (!groupedByClient[clientId]) {
          groupedByClient[clientId] = []
        }
        groupedByClient[clientId].push(design)
      })

      // Create client groups with all expanded by default
      const groups: ClientGroup[] = Object.entries(groupedByClient).map(([clientId, designs]) => ({
        client_id: clientId,
        client_name: designs[0]?.client_name || 'Unknown Client',
        designs: designs,
        isExpanded: true // All expanded by default
      }))

      setClientGroups(groups)
    } catch (error) {
      console.error('Error fetching designs:', error)
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

  const updateDesignStatus = async (designId: string, newStatus: DesignStatus) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ status: newStatus })
        .eq('id', designId)

      if (error) throw error

      // Refresh data
      fetchDesigns()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const updateStageStatus = async (designId: string, stage: DesignStatus, newState: StageState) => {
    try {
      // Find the design to get current stage_status
      const design = clientGroups
        .flatMap(g => g.designs)
        .find(d => d.id === designId)
      
      if (!design) return

      const updatedStageStatus = {
        ...design.stage_status,
        [stage]: newState
      }

      const { error } = await supabase
        .from('designs')
        .update({ stage_status: updatedStageStatus })
        .eq('id', designId)

      if (error) throw error

      // Update local state immediately for better UX
      setClientGroups(prevGroups =>
        prevGroups.map(group => ({
          ...group,
          designs: group.designs.map(d =>
            d.id === designId
              ? { ...d, stage_status: updatedStageStatus }
              : d
          )
        }))
      )
    } catch (error: any) {
      console.error('Error updating stage status:', error)
      alert('Failed to update stage status: ' + error.message)
    }
  }

  const openNotesModal = (design: DesignWithClient) => {
    setEditingDesign(design)
    setNotesValue(design.notes || "")
  }

  const closeNotesModal = () => {
    setEditingDesign(null)
    setNotesValue("")
  }

  const saveNotes = async () => {
    if (!editingDesign) return
    
    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from('designs')
        .update({ notes: notesValue })
        .eq('id', editingDesign.id)

      if (error) throw error

      // Update local state
      setClientGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          designs: group.designs.map(d => 
            d.id === editingDesign.id ? { ...d, notes: notesValue } : d
          )
        }))
      )

      closeNotesModal()
    } catch (error: any) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes: ' + error.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const getTotalDesigns = () => {
    return clientGroups.reduce((sum, group) => sum + group.designs.length, 0)
  }

  const toggleStageFilter = (stage: DesignStatus) => {
    if (activeStageFilter === stage) {
      setActiveStageFilter(null) // Clear filter if clicking same stage
    } else {
      setActiveStageFilter(stage) // Set new stage filter
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading designs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
          <div className="flex gap-2">
          <Button
            variant={activeFilter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('All')}
          >
            All Designs
          </Button>
          <Button
            variant={activeFilter === 'Sampling' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('Sampling')}
          >
            Sampling Only
          </Button>
          <Button
            variant={activeFilter === 'Production' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('Production')}
          >
            Production Only
          </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeStageFilter && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
              <span className="text-sm text-blue-700">
                Stage: <strong>{activeStageFilter}</strong> (incomplete)
              </span>
              <button
                onClick={() => setActiveStageFilter(null)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Clear stage filter"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{getTotalDesigns()}</span> designs
          </div>
        </div>
      </div>

      {/* CRM-Style Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Client / Product
                </th>
                {STAGES.map(stage => (
                  <th 
                    key={stage} 
                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                      activeStageFilter === stage 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleStageFilter(stage)}
                    title={`Click to filter designs with incomplete ${stage}`}
                  >
                    {stage}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Timeline
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientGroups.length === 0 ? (
                <tr>
                  <td colSpan={STAGES.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No designs found. Add a client and create your first design order!
                  </td>
                </tr>
              ) : (
                clientGroups.map(group => (
                  <ClientGroupRow
                    key={group.client_id}
                    group={group}
                    onToggle={() => toggleClientExpansion(group.client_id)}
                    onUpdateStatus={updateDesignStatus}
                    onUpdateStageStatus={updateStageStatus}
                    onImageClick={setPreviewImage}
                    onTileClick={openNotesModal}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Notes Modal */}
      <Dialog open={!!editingDesign} onOpenChange={closeNotesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes: {editingDesign?.title}
            </DialogTitle>
            <DialogDescription>
              Add status updates, sizes, client instructions, meeting notes, or any custom information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes-editor">Notes</Label>
              <textarea
                id="notes-editor"
                className="flex min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type your notes here..."
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
              />
            </div>
            {editingDesign && (
              <div className="text-xs text-gray-500 space-y-1">
                <div><strong>Client:</strong> {editingDesign.client_name}</div>
                <div><strong>Type:</strong> {editingDesign.type}</div>
                <div><strong>Status:</strong> {editingDesign.status}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeNotesModal}
            >
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ClientGroupRowProps {
  group: ClientGroup
  onToggle: () => void
  onUpdateStatus: (designId: string, status: DesignStatus) => void
  onUpdateStageStatus: (designId: string, stage: DesignStatus, state: StageState) => void
  onImageClick: (imageUrl: string) => void
  onTileClick: (design: DesignWithClient) => void
}

function ClientGroupRow({ group, onToggle, onUpdateStatus, onUpdateStageStatus, onImageClick, onTileClick }: ClientGroupRowProps) {
  return (
    <>
      {/* Client Header Row */}
      <tr className="bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={onToggle}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {group.isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <div>
              <div className="text-sm font-bold text-gray-900">{group.client_name}</div>
              <div className="text-xs text-gray-500">{group.designs.length} product{group.designs.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </td>
        {STAGES.map(stage => (
          <td key={stage} className="px-4 py-4"></td>
        ))}
        <td className="px-4 py-4"></td>
      </tr>

      {/* Product Rows (shown when expanded) */}
      {group.isExpanded && group.designs.map(design => (
        <tr key={design.id} className="hover:bg-gray-50 border-l-4 border-l-transparent hover:border-l-blue-500">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3 pl-7">
              {/* Image Thumbnail */}
              {design.images && design.images.length > 0 ? (
                <div 
                  className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                  onClick={() => onImageClick(design.images[0])}
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
              <div className="min-w-0 flex-1 cursor-pointer hover:text-blue-600" onClick={() => onTileClick(design)}>
                <div className="text-sm font-medium text-gray-900 truncate hover:underline">{design.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={design.type === 'Sampling' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {design.type}
                  </Badge>
                  {design.notes && design.notes.trim() && (
                    <span title="Has notes">
                      <FileText className="h-3 w-3 text-blue-500" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>
          {STAGES.map(stage => (
            <td key={stage} className="px-4 py-4 text-center">
              <StatusIndicator
                design={design}
                stage={stage}
                onUpdateStageStatus={(newState) => onUpdateStageStatus(design.id, stage, newState)}
              />
            </td>
          ))}
          <td className="px-4 py-4 text-center">
            {(design.start_date || design.end_date) && (
              <div className="text-xs text-gray-600 space-y-1">
                {design.start_date && (
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDisplayDate(design.start_date)}</span>
                  </div>
                )}
                {design.end_date && (
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDisplayDate(design.end_date)}</span>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}

interface StatusIndicatorProps {
  design: Design
  stage: DesignStatus
  onUpdateStageStatus: (state: StageState) => void
}

function StatusIndicator({ design, stage, onUpdateStageStatus }: StatusIndicatorProps) {
  // Get the current state of this stage from stage_status
  const stageState: StageState = design.stage_status?.[stage] || 'vacant'
  
  // Define the cycle: vacant → in-progress → completed → vacant
  const getNextState = (current: StageState): StageState => {
    switch (current) {
      case 'vacant':
        return 'in-progress'
      case 'in-progress':
        return 'completed'
      case 'completed':
        return 'vacant'
      default:
        return 'vacant'
    }
  }

  const handleClick = () => {
    const nextState = getNextState(stageState)
    onUpdateStageStatus(nextState)
  }

  // Render based on state
  if (stageState === 'completed') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
        title="Completed. Click to reset."
      >
        <span className="text-green-600 font-bold text-lg">✓</span>
      </button>
    )
  }

  if (stageState === 'in-progress') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${STAGE_COLORS[stage]} hover:opacity-90 transition-opacity cursor-pointer stage-in-progress`}
        title="In Progress. Click to mark complete."
      >
        <span className="font-bold text-lg">●</span>
      </button>
    )
  }

  // vacant state
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
      title="Not started. Click to mark in progress."
    >
      <span className="text-gray-400 text-lg">○</span>
    </button>
  )
}
