"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, type Design, type DesignStatus, type DesignType, type StageState } from "@/lib/supabase"
import { compressImage } from "@/lib/imageUtils"
import { formatDisplayDate } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronRight, Calendar, Package2, X, ImageIcon, FileText, CheckCircle2, Trash2, Plus, Upload, Star } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Image Carousel Component with Hover Cycling
function ImageCarousel({ 
  images, 
  title, 
  designId,
  onImageClick,
  onImagesUpdate 
}: { 
  images: string[]; 
  title: string;
  designId: string;
  onImageClick: (url: string) => void;
  onImagesUpdate: (newImages: string[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!isHovering || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 800) // Change image every 800ms on hover

    return () => clearInterval(interval)
  }, [isHovering, images.length])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Compress image before uploading (reduces egress by 95%!)
        const compressed = await compressImage(file, 1200, 0.8)
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
          .from('design-images')
          .upload(filePath, compressed, { 
            upsert: true,
            cacheControl: '2592000' // Cache for 30 days
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('design-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Add new images to existing ones
      const newImages = [...images, ...uploadedUrls]
      onImagesUpdate(newImages)
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    }
  }

  if (imageError) {
    return (
      <div className="relative group">
        <div className="w-12 h-12 flex-shrink-0 bg-red-100 rounded flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-red-400" />
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          id={`upload-replace-${designId}`}
          onChange={handleImageUpload}
        />
        <label
          htmlFor={`upload-replace-${designId}`}
          className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-0 group-hover:bg-opacity-80 transition-all cursor-pointer rounded"
          title="Image unavailable - upload new"
        >
          <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
        </label>
      </div>
    )
  }

  return (
    <div className="relative group">
      <div 
        className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
        onClick={() => onImageClick(images[currentIndex])}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false)
          setCurrentIndex(0)
        }}
      >
        <Image
          src={images[currentIndex]}
          alt={title}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
          onError={() => setImageError(true)}
        />
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 text-center">
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id={`upload-add-${designId}`}
        onChange={handleImageUpload}
      />
      <label
        htmlFor={`upload-add-${designId}`}
        className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 shadow-lg"
        title="Add more images"
      >
        <Plus className="h-3 w-3 text-white" />
      </label>
    </div>
  )
}

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

const STAGE_COLORS: Record<DesignStatus, string> = {
  'Payment Received': 'bg-green-100 text-green-800',
  'Fabric Finalize': 'bg-slate-100 text-slate-800',
  'Pattern': 'bg-blue-100 text-blue-800',
  'Grading': 'bg-purple-100 text-purple-800',
  'Cutting': 'bg-orange-100 text-orange-800',
  'Stitching': 'bg-pink-100 text-pink-800',
  'Dye': 'bg-rose-100 text-rose-800',
  'Print': 'bg-lime-100 text-lime-800',
  'Kaaj': 'bg-indigo-100 text-indigo-800',
  'Embroidery': 'bg-violet-100 text-violet-800',
  'Wash': 'bg-cyan-100 text-cyan-800',
  'Finishing': 'bg-teal-100 text-teal-800',
  'Photoshoot': 'bg-fuchsia-100 text-fuchsia-800',
  'Final Settlement': 'bg-amber-100 text-amber-800',
  'Dispatch': 'bg-emerald-100 text-emerald-800',
}

const computeMidpointPriority = (above: number | null, below: number | null) => {
  if (above !== null && below !== null) {
    return (above + below) / 2
  }
  if (above === null && below !== null) {
    return below - 1
  }
  if (above !== null && below === null) {
    return above + 1
  }
  return 0
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
  display_order: number | null
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
  const [confirmComplete, setConfirmComplete] = useState<DesignWithClient | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DesignWithClient | null>(null)
  const [addingForClient, setAddingForClient] = useState<{ id: string, name: string } | null>(null)
  const [reindexingClients, setReindexingClients] = useState(false)
  const autoReindexedRef = useRef(false)
  const [newDesignForm, setNewDesignForm] = useState({
    title: "",
    type: "Sampling" as DesignType,
    quantity: 1,
    status: "Payment Received" as DesignStatus,
    notes: "",
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [savingDesign, setSavingDesign] = useState(false)
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null)
  const [draggedDesignId, setDraggedDesignId] = useState<string | null>(null)
  const [dragOverClientId, setDragOverClientId] = useState<string | null>(null)
  const [dragOverDesignId, setDragOverDesignId] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 ProductionStatusBoard mounted - fetching designs...')
    fetchDesigns()
  }, [activeFilter, activeStageFilter])

  const isDesignCompleted = (design: DesignWithClient): boolean => {
    if (!design.stage_status) return false
    // Check if all stages are marked as 'completed'
    return STAGES.every(stage => design.stage_status?.[stage] === 'completed')
  }

  const needsClientReindex = (groups: ClientGroup[]) => {
    const seen = new Set<number>()
    for (const group of groups) {
      if (group.display_order === null || Number.isNaN(group.display_order)) {
        return true
      }
      if (seen.has(group.display_order)) {
        return true
      }
      seen.add(group.display_order)
    }
    return false
  }

  const applyClientReindex = async (orderedGroups: ClientGroup[], silent: boolean) => {
    if (reindexingClients) return null
    setReindexingClients(true)
    try {
      const updates = orderedGroups.map((group, index) =>
        supabase
          .from('clients')
          .update({ display_order: index })
          .eq('id', group.client_id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find(r => r.error)?.error
      if (firstError) throw firstError

      return orderedGroups.map((group, index) => ({ ...group, display_order: index }))
    } catch (error) {
      console.error('❌ Error reindexing client order:', error)
      if (!silent) {
        alert('Failed to reindex client order. Please try again.')
      }
      return null
    } finally {
      setReindexingClients(false)
    }
  }

  const handleUpdateDesignImages = async (designId: string, newImages: string[]) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ images: newImages })
        .eq('id', designId)

      if (error) throw error

      // Refresh designs to show updated images
      await fetchDesigns()
    } catch (error) {
      console.error('Error updating design images:', error)
      alert('Failed to update images')
    }
  }

  const handleImageUploadForDesign = async (designId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Compress image before uploading
        const compressed = await compressImage(file, 1200, 0.8)
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
          .from('design-images')
          .upload(filePath, compressed, { 
            upsert: true,
            cacheControl: '2592000' // Cache for 30 days
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('design-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Update design with new images
      const { error: updateError } = await supabase
        .from('designs')
        .update({ images: uploadedUrls })
        .eq('id', designId)

      if (updateError) throw updateError

      // Refresh designs
      await fetchDesigns()
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    }
  }

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      // Fetch all clients first to get their display_order
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, display_order')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })

      // Fetch designs with client information, ordered by display_order, then created_at
      const { data: designsData, error } = await supabase
        .from('designs')
        .select('*, clients(name, id)')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Debug: Log the first few designs with their display_order
      const designOrders = designsData?.slice(0, 10).map(d => ({ 
        id: d.id, 
        title: d.title, 
        display_order: d.display_order 
      }))
      console.log('=== FETCHED DESIGNS ORDER ===', designOrders)
      console.log('Total designs:', designsData?.length)

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

      // Sort designs within each client group by priority, then display_order
      Object.keys(groupedByClient).forEach(clientId => {
        // Filter out completed designs - they now appear in separate Completed Orders page
        groupedByClient[clientId] = groupedByClient[clientId].filter(d => !isDesignCompleted(d))
        
        groupedByClient[clientId].sort((a, b) => {
          // Priority designs first
          const aPriority = a.is_priority ? 1 : 0
          const bPriority = b.is_priority ? 1 : 0
          if (aPriority !== bPriority) return bPriority - aPriority
          
          // Then by display_order
          const orderA = a.display_order ?? 999999
          const orderB = b.display_order ?? 999999
          return orderA - orderB
        })
      })

      // Create client groups using the sorted clients list (maintains display_order)
      const groups: ClientGroup[] = []
      
      // First, add clients that have designs (in their display_order)
      clientsData?.forEach(client => {
        if (groupedByClient[client.id]) {
          groups.push({
            client_id: client.id,
            client_name: client.name,
            designs: groupedByClient[client.id],
            isExpanded: true,
            display_order: client.display_order
          })
        }
      })
      
      // Then add any clients not in the clients table (shouldn't happen normally)
      Object.entries(groupedByClient).forEach(([clientId, designs]) => {
        if (!clientsData?.find(c => c.id === clientId)) {
          groups.push({
            client_id: clientId,
            client_name: designs[0]?.client_name || 'Unknown Client',
            designs: designs,
            isExpanded: true,
            display_order: null
          })
        }
      })

      console.log('Client groups order:', groups.map(g => ({ name: g.client_name, order: g.display_order })))
      const shouldAutoReindex =
        !autoReindexedRef.current &&
        activeFilter === 'All' &&
        !activeStageFilter &&
        needsClientReindex(groups)

      if (shouldAutoReindex) {
        autoReindexedRef.current = true
        const updatedGroups = await applyClientReindex(groups, true)
        if (updatedGroups) {
          setClientGroups(updatedGroups)
          return
        }
      }

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

  const togglePriority = async (designId: string, currentPriority: boolean) => {
    try {
      const newPriority = !currentPriority

      const { error } = await supabase
        .from('designs')
        .update({ is_priority: newPriority })
        .eq('id', designId)

      if (error) throw error

      // Refresh to re-sort with priority designs at top
      fetchDesigns()
    } catch (error: any) {
      console.error('Error toggling priority:', error)
      alert('Failed to toggle priority: ' + error.message)
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

  const handleCompleteDesign = async () => {
    if (!confirmComplete) return
    
    try {
      // Mark all stages as completed
      const completedStageStatus: Record<DesignStatus, StageState> = {
        'Payment Received': 'completed',
        'Fabric Finalize': 'completed',
        'Pattern': 'completed',
        'Grading': 'completed',
        'Cutting': 'completed',
        'Stitching': 'completed',
        'Dye': 'completed',
        'Print': 'completed',
        'Embroidery': 'completed',
        'Wash': 'completed',
        'Kaaj': 'completed',
        'Finishing': 'completed',
        'Photoshoot': 'completed',
        'Final Settlement': 'completed',
        'Dispatch': 'completed'
      }

      const { error } = await supabase
        .from('designs')
        .update({ 
          stage_status: completedStageStatus,
          status: 'Dispatch'
        })
        .eq('id', confirmComplete.id)

      if (error) throw error

      // Update local state
      setClientGroups(prevGroups =>
        prevGroups.map(group => ({
          ...group,
          designs: group.designs.map(d =>
            d.id === confirmComplete.id
              ? { ...d, stage_status: completedStageStatus, status: 'Dispatch' as DesignStatus }
              : d
          )
        }))
      )

      setConfirmComplete(null)
    } catch (error: any) {
      console.error('Error completing design:', error)
      alert('Failed to complete design: ' + error.message)
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

      // Update local state - remove the design and filter out empty client groups
      setClientGroups(prevGroups =>
        prevGroups
          .map(group => ({
            ...group,
            designs: group.designs.filter(d => d.id !== confirmDelete.id)
          }))
          .filter(group => group.designs.length > 0)
      )

      setConfirmDelete(null)
    } catch (error: any) {
      console.error('Error deleting design:', error)
      alert('Failed to delete design: ' + error.message)
    }
  }

  const calculateDaysSinceStart = (startDate: string | null | undefined): number => {
    if (!startDate) return 0
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = now.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (design: DesignWithClient): boolean => {
    const daysSinceStart = calculateDaysSinceStart(design.start_date)
    return daysSinceStart > 10
  }

  const openAddDesignDialog = (clientId: string, clientName: string) => {
    setAddingForClient({ id: clientId, name: clientName })
    setNewDesignForm({
      title: "",
      type: "Sampling",
      quantity: 1,
      status: "Payment Received",
      notes: "",
    })
    setImageFiles([])
    setImagePreviews([])
  }

  const closeAddDesignDialog = () => {
    setAddingForClient(null)
    setNewDesignForm({
      title: "",
      type: "Sampling",
      quantity: 1,
      status: "Payment Received",
      notes: "",
    })
    setImageFiles([])
    setImagePreviews([])
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(prev => [...prev, ...files])
    
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveNewDesign = async () => {
    if (!addingForClient || !newDesignForm.title) {
      alert("Please fill in all required fields")
      return
    }

    setSavingDesign(true)
    try {
      // Upload images first if any
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `design-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('design-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('design-images')
          .getPublicUrl(filePath)

        imageUrls.push(publicUrl)
      }

      // Calculate timeline
      const { calculateTimeline } = await import("@/lib/timeline")
      const timeline = await calculateTimeline(newDesignForm.quantity, newDesignForm.type)

      // Initialize stage_status
      const initialStageStatus: Record<DesignStatus, StageState> = {
        'Payment Received': 'in-progress',
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

      // Get max display_order to append new design at the end
      const { data: maxOrderData } = await supabase
        .from('designs')
        .select('display_order')
        .order('display_order', { ascending: false, nullsFirst: false })
        .limit(1)
        .single()
      
      const nextDisplayOrder = (maxOrderData?.display_order ?? -1) + 1

      // Insert design (display_order will be added after running migration)
      const { data, error } = await supabase
        .from('designs')
        .insert({
          client_id: addingForClient.id,
          title: newDesignForm.title,
          type: newDesignForm.type,
          quantity: newDesignForm.quantity,
          status: newDesignForm.status,
          notes: newDesignForm.notes,
          images: imageUrls,
          stage_status: initialStageStatus,
          start_date: timeline.start_date,
          end_date: timeline.end_date,
          display_order: nextDisplayOrder,
        })
        .select()
        .single()

      if (error) throw error

      // Refresh the designs list
      await fetchDesigns()
      closeAddDesignDialog()
    } catch (error: any) {
      console.error('Error saving design:', error)
      alert('Failed to save design: ' + error.message)
    } finally {
      setSavingDesign(false)
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

  const normalizeClientOrder = async () => {
    if (reindexingClients) return
    if (!confirm('Reindex client order based on the current visible order? This will overwrite existing priorities.')) {
      return
    }

    const orderedGroups = [...clientGroups]
    const updatedGroups = await applyClientReindex(orderedGroups, false)
    if (updatedGroups) {
      setClientGroups(updatedGroups)
    }
  }

  // Drag and Drop Handlers for Clients
  const handleClientDragStart = (clientId: string) => {
    setDraggedClientId(clientId)
  }

  const handleClientDragOver = (e: React.DragEvent, clientId: string) => {
    e.preventDefault()
    setDragOverClientId(clientId)
  }

  const handleClientDrop = async (e: React.DragEvent, targetClientId: string) => {
    e.preventDefault()
    
    if (!draggedClientId || draggedClientId === targetClientId) {
      setDraggedClientId(null)
      setDragOverClientId(null)
      return
    }

    // Reorder client groups in UI immediately
    const reorderedGroups = [...clientGroups]
    const draggedIndex = reorderedGroups.findIndex(g => g.client_id === draggedClientId)
    const targetIndex = reorderedGroups.findIndex(g => g.client_id === targetClientId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedClientId(null)
      setDragOverClientId(null)
      return
    }
    
    const [draggedItem] = reorderedGroups.splice(draggedIndex, 1)
    reorderedGroups.splice(targetIndex, 0, draggedItem)

    const draggedNewIndex = reorderedGroups.findIndex(g => g.client_id === draggedItem.client_id)
    const above = draggedNewIndex > 0 ? reorderedGroups[draggedNewIndex - 1]?.display_order ?? null : null
    const below = draggedNewIndex < reorderedGroups.length - 1
      ? reorderedGroups[draggedNewIndex + 1]?.display_order ?? null
      : null
    const newPriority = computeMidpointPriority(above, below)
    draggedItem.display_order = newPriority
    
    // Update UI immediately
    setClientGroups(reorderedGroups)

    // Save to database in background (don't block UI)
    const orderInfo = reorderedGroups.map((g, i) => ({ name: g.client_name, order: i }))
    console.log('=== SAVING CLIENT ORDER ===', orderInfo)
    try {
      const { error } = await supabase
        .from('clients')
        .update({ display_order: newPriority })
        .eq('id', draggedItem.client_id)
      if (error) throw error
    } catch (error) {
      console.error('❌ Error saving client order:', error)
      alert('Failed to save client order. Please refresh and try again.')
    }

    setDraggedClientId(null)
    setDragOverClientId(null)
  }

  const handleClientDragEnd = () => {
    setDraggedClientId(null)
    setDragOverClientId(null)
  }

  // Drag and Drop Handlers for Designs within a Client
  const handleDesignDragStart = (designId: string) => {
    setDraggedDesignId(designId)
  }

  const handleDesignDragOver = (e: React.DragEvent, designId: string) => {
    e.preventDefault()
    setDragOverDesignId(designId)
  }

  const handleDesignDrop = async (e: React.DragEvent, targetDesignId: string, clientId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedDesignId || draggedDesignId === targetDesignId) {
      setDraggedDesignId(null)
      setDragOverDesignId(null)
      return
    }

    // Get all designs in a flat list (maintaining global order)
    const allDesigns: DesignWithClient[] = []
    clientGroups.forEach(group => {
      allDesigns.push(...group.designs)
    })

    // Find indices in global list
    const draggedIndex = allDesigns.findIndex(d => d.id === draggedDesignId)
    const targetIndex = allDesigns.findIndex(d => d.id === targetDesignId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedDesignId(null)
      setDragOverDesignId(null)
      return
    }

    const targetDesign = allDesigns[targetIndex]
    const draggedDesign = allDesigns[draggedIndex]

    // Reorder in global list
    const [draggedItem] = allDesigns.splice(draggedIndex, 1)
    allDesigns.splice(targetIndex, 0, draggedItem)

    // If user drops onto a priority item, make dragged item priority (and vice versa)
    const shouldBePriority = targetDesign?.is_priority ?? false
    const wasPriority = draggedDesign?.is_priority ?? false
    const priorityChanged = shouldBePriority !== wasPriority
    if (priorityChanged) {
      draggedItem.is_priority = shouldBePriority
    }

    // Update display_order in the design objects themselves
    allDesigns.forEach((design, index) => {
      design.display_order = index
    })

    // Update UI immediately - reorganize designs into client groups
    const updatedGroupedByClient: Record<string, DesignWithClient[]> = {}
    allDesigns.forEach(design => {
      const cid = design.client_id || 'unknown'
      if (!updatedGroupedByClient[cid]) {
        updatedGroupedByClient[cid] = []
      }
      updatedGroupedByClient[cid].push(design)
    })

    const updatedGroups = clientGroups.map(group => ({
      ...group,
      designs: updatedGroupedByClient[group.client_id] || []
    }))
    
    setClientGroups(updatedGroups)

    // Save to database in background (don't block UI)
    const orderInfo = allDesigns.map((d, i) => ({ title: d.title, order: i }))
    console.log('=== SAVING DESIGN ORDER ===', orderInfo)
    try {
      const updates = allDesigns.map((design, index) =>
        supabase
          .from('designs')
          .update({ display_order: index })
          .eq('id', design.id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find(r => r.error)?.error
      if (firstError) throw firstError

      if (priorityChanged) {
        const { error: priorityError } = await supabase
          .from('designs')
          .update({ is_priority: shouldBePriority })
          .eq('id', draggedItem.id)
        if (priorityError) throw priorityError
      }
    } catch (error) {
      console.error('❌ Error saving design order:', error)
      alert('Failed to save design order. Please refresh and try again.')
      fetchDesigns()
    }

    setDraggedDesignId(null)
    setDragOverDesignId(null)
  }

  const handleDesignDragEnd = () => {
    setDraggedDesignId(null)
    setDragOverDesignId(null)
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
          <Button
            variant="outline"
            size="sm"
            onClick={normalizeClientOrder}
            disabled={reindexingClients || clientGroups.length === 0}
            title="Normalize client order so each client has a unique priority"
          >
            {reindexingClients ? 'Reindexing...' : 'Reindex Client Order'}
          </Button>
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
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-30 shadow-md border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64 bg-gray-50">
                Client / Product
              </th>
                {STAGES.map(stage => (
                  <th 
                    key={stage} 
                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                      activeStageFilter === stage 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'text-gray-500 hover:bg-gray-100 bg-gray-50'
                    }`}
                    onClick={() => toggleStageFilter(stage)}
                    title={`Click to filter designs with incomplete ${stage}`}
                  >
                    {stage}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gray-50">
                  Timeline
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientGroups.length === 0 ? (
                <tr>
                  <td colSpan={STAGES.length + 3} className="px-6 py-12 text-center text-gray-500">
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
                    onTogglePriority={togglePriority}
                    onImageClick={setPreviewImage}
                    onTileClick={openNotesModal}
                    onCompleteClick={setConfirmComplete}
                    onDeleteClick={setConfirmDelete}
                    onAddDesign={openAddDesignDialog}
                    isOverdue={isOverdue}
                    onClientDragStart={handleClientDragStart}
                    onClientDragOver={handleClientDragOver}
                    onClientDrop={handleClientDrop}
                    onClientDragEnd={handleClientDragEnd}
                    onDesignDragStart={handleDesignDragStart}
                    onDesignDragOver={handleDesignDragOver}
                    onDesignDrop={handleDesignDrop}
                    onDesignDragEnd={handleDesignDragEnd}
                    draggedClientId={draggedClientId}
                    dragOverClientId={dragOverClientId}
                    draggedDesignId={draggedDesignId}
                    dragOverDesignId={dragOverDesignId}
                  />
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

      {/* Complete Confirmation Modal */}
      <Dialog open={!!confirmComplete} onOpenChange={() => setConfirmComplete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark as Completed
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this design as completed? All stages will be marked as completed and the status will be set to Dispatch.
            </DialogDescription>
          </DialogHeader>
          {confirmComplete && (
            <div className="py-4 space-y-2 text-sm">
              <div><strong>Design:</strong> {confirmComplete.title}</div>
              <div><strong>Client:</strong> {confirmComplete.client_name}</div>
              <div><strong>Type:</strong> {confirmComplete.type}</div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmComplete(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteDesign}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Design
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this design? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <div className="py-4 space-y-2 text-sm">
              <div><strong>Design:</strong> {confirmDelete.title}</div>
              <div><strong>Client:</strong> {confirmDelete.client_name}</div>
              <div><strong>Type:</strong> {confirmDelete.type}</div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteDesign}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Design Dialog */}
      <Dialog open={!!addingForClient} onOpenChange={() => closeAddDesignDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Design for {addingForClient?.name}
            </DialogTitle>
            <DialogDescription>
              Create a new design order for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="design-title">Design Title *</Label>
              <Input
                id="design-title"
                value={newDesignForm.title}
                onChange={(e) => setNewDesignForm({ ...newDesignForm, title: e.target.value })}
                placeholder="Enter design name"
              />
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="design-type">Type *</Label>
              <Select
                value={newDesignForm.type}
                onValueChange={(value: DesignType) => setNewDesignForm({ ...newDesignForm, type: value })}
              >
                <SelectTrigger id="design-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sampling">Sampling</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity (only for Production) */}
            {newDesignForm.type === 'Production' && (
              <div className="grid gap-2">
                <Label htmlFor="design-quantity">Quantity</Label>
                <Input
                  id="design-quantity"
                  type="number"
                  min="1"
                  value={newDesignForm.quantity}
                  onChange={(e) => setNewDesignForm({ ...newDesignForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            {/* Initial Status */}
            <div className="grid gap-2">
              <Label htmlFor="design-status">Initial Status</Label>
              <Select
                value={newDesignForm.status}
                onValueChange={(value: DesignStatus) => setNewDesignForm({ ...newDesignForm, status: value })}
              >
                <SelectTrigger id="design-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="design-notes">Notes</Label>
              <textarea
                id="design-notes"
                value={newDesignForm.notes}
                onChange={(e) => setNewDesignForm({ ...newDesignForm, notes: e.target.value })}
                className="min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add status updates, sizes, measurements, client instructions, or any custom information..."
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-2">
              <Label>Design Images</Label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md transition-colors">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Upload Images</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                {imageFiles.length > 0 && (
                  <span className="text-sm text-gray-600">{imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected</span>
                )}
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeAddDesignDialog}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewDesign}
              disabled={savingDesign || !newDesignForm.title}
            >
              {savingDesign ? "Saving..." : "Add Design"}
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
  onTogglePriority: (designId: string, currentPriority: boolean) => void
  onImageClick: (imageUrl: string) => void
  onTileClick: (design: DesignWithClient) => void
  onCompleteClick: (design: DesignWithClient) => void
  onDeleteClick: (design: DesignWithClient) => void
  onAddDesign: (clientId: string, clientName: string) => void
  isOverdue: (design: DesignWithClient) => boolean
  onClientDragStart: (clientId: string) => void
  onClientDragOver: (e: React.DragEvent, clientId: string) => void
  onClientDrop: (e: React.DragEvent, clientId: string) => void
  onClientDragEnd: () => void
  onDesignDragStart: (designId: string) => void
  onDesignDragOver: (e: React.DragEvent, designId: string) => void
  onDesignDrop: (e: React.DragEvent, designId: string, clientId: string) => void
  onDesignDragEnd: () => void
  draggedClientId: string | null
  dragOverClientId: string | null
  draggedDesignId: string | null
  dragOverDesignId: string | null
}

function ClientGroupRow({ 
  group, 
  onToggle, 
  onUpdateStatus, 
  onUpdateStageStatus, 
  onTogglePriority,
  onImageClick, 
  onTileClick, 
  onCompleteClick, 
  onDeleteClick, 
  onAddDesign, 
  isOverdue,
  onClientDragStart,
  onClientDragOver,
  onClientDrop,
  onClientDragEnd,
  onDesignDragStart,
  onDesignDragOver,
  onDesignDrop,
  onDesignDragEnd,
  draggedClientId,
  dragOverClientId,
  draggedDesignId,
  dragOverDesignId
}: ClientGroupRowProps) {
  const isDraggingClient = draggedClientId === group.client_id
  const isOverClient = dragOverClientId === group.client_id
  return (
    <>
      {/* Client Header Row */}
      <tr 
        className={`bg-gray-100 hover:bg-gray-200 cursor-move transition-all ${
          isDraggingClient ? 'opacity-50' : ''
        } ${isOverClient ? 'border-t-4 border-t-blue-500' : ''}`}
        draggable
        onDragStart={() => onClientDragStart(group.client_id)}
        onDragOver={(e) => onClientDragOver(e, group.client_id)}
        onDrop={(e) => onClientDrop(e, group.client_id)}
        onDragEnd={onClientDragEnd}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span 
              className="cursor-pointer"
              onClick={onToggle}
            >
              {group.isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </span>
            <div className="flex-1" onClick={onToggle}>
              <div className="text-sm font-bold text-gray-900">{group.client_name}</div>
              <div className="text-xs text-gray-500">{group.designs.length} product{group.designs.length !== 1 ? 's' : ''}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation()
                onAddDesign(group.client_id, group.client_name)
              }}
              title="Add new design for this client"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </td>
        {STAGES.map(stage => (
          <td key={stage} className="px-4 py-4"></td>
        ))}
        <td className="px-4 py-4"></td>
        <td className="px-4 py-4"></td>
      </tr>

      {/* Product Rows (shown when expanded) */}
      {group.isExpanded && group.designs.map(design => {
        const overdueStatus = isOverdue(design)
        const isDraggingDesign = draggedDesignId === design.id
        const isOverDesign = dragOverDesignId === design.id
        return (
        <tr 
          key={design.id} 
          className={`transition-all hover:bg-gray-50 border-l-4 cursor-move ${
            overdueStatus 
              ? 'border-l-red-500 bg-red-50' 
              : 'border-l-transparent hover:border-l-blue-500'
          } ${isDraggingDesign ? 'opacity-50' : ''} ${isOverDesign ? 'border-t-2 border-t-blue-400' : ''}`}
          draggable={true}
          onDragStart={(e) => {
            e.stopPropagation()
            onDesignDragStart(design.id)
          }}
          onDragOver={(e) => {
            e.stopPropagation()
            onDesignDragOver(e, design.id)
          }}
          onDrop={(e) => {
            e.stopPropagation()
            onDesignDrop(e, design.id, group.client_id)
          }}
          onDragEnd={onDesignDragEnd}
        >
          <td className="px-6 py-4">
            <div className="flex items-center gap-3 pl-7">
              {/* Priority Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePriority(design.id, design.is_priority || false)
                }}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  design.is_priority
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-md'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-400'
                }`}
                title={design.is_priority ? 'Remove from priority' : 'Mark as priority'}
              >
                <Star 
                  className={`w-5 h-5 ${design.is_priority ? 'fill-yellow-900' : ''}`}
                />
              </button>
              {/* Image Thumbnail with Hover Cycling */}
              {design.images && design.images.length > 0 ? (
                <ImageCarousel
                  images={design.images}
                  title={design.title}
                  designId={design.id}
                  onImageClick={onImageClick}
                  onImagesUpdate={(newImages) => handleUpdateDesignImages(design.id, newImages)}
                />
              ) : (
                <div className="relative group">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id={`upload-${design.id}`}
                    onChange={(e) => handleImageUploadForDesign(design.id, e.target.files)}
                  />
                  <label
                    htmlFor={`upload-${design.id}`}
                    className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-0 group-hover:bg-opacity-80 transition-all cursor-pointer rounded"
                  >
                    <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                  </label>
                </div>
              )}  
              <div className="min-w-0 flex-1 cursor-pointer hover:text-blue-600" onClick={() => onTileClick(design)}>
                <div className="text-sm font-medium text-gray-900 truncate hover:underline">
                  {design.title}
                </div>
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
          <td className="px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                onClick={() => onCompleteClick(design)}
                title="Mark as completed"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                onClick={() => onDeleteClick(design)}
                title="Remove design"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
        )
      })}
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
  
  // Define the cycle: vacant → not-needed → in-progress → completed → vacant
  const getNextState = (current: StageState): StageState => {
    switch (current) {
      case 'vacant':
        return 'not-needed'
      case 'not-needed':
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

  if (stageState === 'not-needed') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors cursor-pointer"
        title="Not Needed. Click to mark in progress."
      >
        <span className="text-gray-600 font-bold text-xl">−</span>
      </button>
    )
  }

  // vacant state
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
      title="Not started. Click to mark not needed."
    >
      <span className="text-gray-400 text-lg">○</span>
    </button>
  )
}
