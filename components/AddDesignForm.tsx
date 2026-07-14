"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { getActiveClients, addClient, hideClientFromOrders, addDesign, calculateTimeline, type Client, type Design } from "@/lib/actions"
import { formatDisplayDate } from "@/lib/timeline"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, X, ImageIcon, Calendar, Clock, Plus, ChevronDown, ClipboardPaste } from "lucide-react"

type DesignType = 'Sampling' | 'Production'
type DesignStatus = string

const PROCESS_STEPS: DesignStatus[] = [
  'Fabric Finalize',
  'Pattern',
  'Cutting',
  'Stitching',
  'Dye',
  'Print',
  'Embroidery'
]

export function AddDesignForm() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [isSampling, setIsSampling] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [confirmHideClient, setConfirmHideClient] = useState<Client | null>(null)
  const [hidingClient, setHidingClient] = useState(false)
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  const [calculatedTimeline, setCalculatedTimeline] = useState<{
    start_date: string
    end_date: string
    total_days: number
  } | null>(null)
  
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    type: "Sampling" as DesignType,
    quantity: 1,
    status: "Fabric Finalize" as DesignStatus,
    notes: "",
    price: "",
  })

  useEffect(() => {
    fetchClients()
  }, [])

  // Let users paste a screenshot/copied image (Ctrl+V) directly instead of
  // only being able to pick files from the gallery. Only intercepts the
  // paste when the clipboard actually contains image data, so pasting text
  // into Title/Notes fields is unaffected.
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        addImageFiles(files)
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [])

  useEffect(() => {
    if (!clientDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [clientDropdownOpen])

  useEffect(() => {
    if (isSampling) {
      setFormData({ ...formData, type: "Sampling", quantity: 1 })
    } else {
      setFormData({ ...formData, type: "Production" })
    }
  }, [isSampling])

  // Calculate timeline when quantity changes (flat 14 days for samples)
  useEffect(() => {
    const calculateAndSetTimeline = async () => {
      if (formData.client_id && formData.title) {
        try {
          // Flat 2 weeks (14 days) for all samples
          const timeline = await calculateTimeline(
            formData.quantity,
            formData.type
          )
          setCalculatedTimeline(timeline)
        } catch (error) {
          console.error('Error calculating timeline:', error)
        }
      }
    }

    calculateAndSetTimeline()
  }, [formData.quantity, formData.type, formData.client_id, formData.title])

  const fetchClients = async () => {
    try {
      const data = await getActiveClients()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      alert("Please enter a client name")
      return
    }

    try {
      const newClient = await addClient({
        name: newClientName.trim(),
        contact_person: '',
        email: `${newClientName.trim().toLowerCase().replace(/\s+/g, '')}@example.com`
      })

      await fetchClients()
      setFormData({ ...formData, client_id: newClient.id })
      setShowAddClient(false)
      setNewClientName("")
    } catch (error: any) {
      alert("Error adding client: " + error.message)
    }
  }

  const handleHideClient = async () => {
    if (!confirmHideClient) return

    setHidingClient(true)
    try {
      await hideClientFromOrders(confirmHideClient.id)

      setClients((prev) => prev.filter((c) => c.id !== confirmHideClient.id))
      if (formData.client_id === confirmHideClient.id) {
        setFormData({ ...formData, client_id: "" })
      }
      setConfirmHideClient(null)
    } catch (error: any) {
      alert("Error removing client from list: " + error.message)
    } finally {
      setHidingClient(false)
    }
  }

  const addImageFiles = (files: File[]) => {
    if (files.length === 0) return
    setImageFiles((prev) => [...prev, ...files])

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(Array.from(e.target.files || []))
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []
    
    try {
      // Upload to Cloudinary via API
      const formData = new FormData()
      imageFiles.forEach(file => formData.append('files', file))
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload images')
      }
      
      const data = await response.json()
      return data.urls
    } catch (error) {
      console.error('Error uploading images:', error)
      return []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate timeline for the new design (flat 14 days for samples)
      const timeline = await calculateTimeline(
        formData.quantity,
        formData.type
      )

      // Upload images first
      const imageUrls = await uploadImages()

      // Add design using server action
      await addDesign({
        client_id: formData.client_id,
        title: formData.title,
        type: formData.type as 'Sampling' | 'Production',
        quantity: formData.quantity,
        status: formData.status,
        notes: formData.notes,
        images: imageUrls,
        price: formData.price ? parseFloat(formData.price) : null
      })

      alert(
        `Design added successfully!\n\n` +
        `Scheduled Timeline:\n` +
        `Start Date: ${formatDisplayDate(timeline.start_date)}\n` +
        `End Date: ${formatDisplayDate(timeline.end_date)}\n` +
        `Duration: ${timeline.total_days} days`
      )
      
      // Reset form
      setFormData({
        client_id: "",
        title: "",
        type: "Sampling",
        quantity: 1,
        status: "Fabric Finalize",
        notes: "",
        price: "",
      })
      setImageFiles([])
      setImagePreviews([])
      setIsSampling(true)
    } catch (error: any) {
      alert("Error adding design: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Add New Design</h2>
        <p className="text-gray-600">Fill in the details below to create a new design order.</p>
      </div>

      {/* Client Selection */}
      <div className="grid gap-2">
        <Label htmlFor="client">Select Client *</Label>
        <div className="relative" ref={clientDropdownRef}>
          <button
            type="button"
            id="client"
            onClick={() => setClientDropdownOpen((prev) => !prev)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className={cn(!formData.client_id && "text-muted-foreground")}>
              {clients.find((c) => c.id === formData.client_id)?.name || "Choose a client"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>

          {clientDropdownOpen && (
            <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {clients.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No clients yet</div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setFormData({ ...formData, client_id: client.id })
                      setClientDropdownOpen(false)
                    }}
                    className={cn(
                      "flex cursor-default select-none items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      formData.client_id === client.id && "bg-accent/60"
                    )}
                  >
                    <span className="truncate">{client.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmHideClient(client)
                      }}
                      className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                      title={`Remove ${client.name} from this list`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddClient(true)}
          className="gap-2 mt-1"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Design Title */}
      <div className="grid gap-2">
        <Label htmlFor="title">Design Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Summer Collection Dress"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      {/* Amount */}
      <div className="grid gap-2">
        <Label htmlFor="price">Amount</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="To be filled later if not known yet"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
        <p className="text-xs text-gray-500">Optional: price for this specific design/order</p>
      </div>

      {/* Sampling/Production Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="type-toggle">Design Type</Label>
          <p className="text-sm text-gray-500">
            {isSampling ? "Sampling (Quantity locked to 1)" : "Production (Custom quantity)"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="type-toggle" className="text-sm font-normal">
            Production
          </Label>
          <Switch
            id="type-toggle"
            checked={!isSampling}
            onCheckedChange={(checked) => setIsSampling(!checked)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add custom notes: status updates, sizes, client instructions, meeting notes, etc."
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
        />
        <p className="text-xs text-gray-500">Optional: Store any custom information about this design</p>
      </div>

      {/* Initial Status */}
      <div className="grid gap-2">
        <Label htmlFor="status">Initial Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as DesignStatus })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROCESS_STEPS.map((step) => (
              <SelectItem key={step} value={step}>
                {step}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calculated Timeline Preview */}
      {calculatedTimeline && formData.client_id && formData.title && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-semibold">
            <Clock className="h-5 w-5" />
            <span>Automated Schedule (Based on Workforce Capacity)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-gray-600">Start Date</div>
                <div className="font-semibold text-gray-900">
                  {formatDisplayDate(calculatedTimeline.start_date)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-gray-600">End Date</div>
                <div className="font-semibold text-gray-900">
                  {formatDisplayDate(calculatedTimeline.end_date)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-gray-600">Total Duration</div>
                <div className="font-semibold text-gray-900">
                  {calculatedTimeline.total_days} days
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-800 bg-blue-100 rounded p-2">
            💡 This design will automatically be scheduled after existing orders in the queue (FIFO).
          </div>
        </div>
      )}

      {/* Image Upload */}
      <div className="space-y-4">
        <Label>Design Images</Label>
        
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image-upload')?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <p className="text-sm text-gray-500">
            {imageFiles.length} image(s) selected
          </p>
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <ClipboardPaste className="h-3.5 w-3.5" />
          Tip: copy an image and press Ctrl+V (Cmd+V on Mac) anywhere on this page to add it instantly.
        </p>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {imagePreviews.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No images selected. Click "Upload Images" or paste (Ctrl+V) to add design images.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating Design..." : "Create Design"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              client_id: "",
              title: "",
              type: "Sampling",
              quantity: 1,
              status: "Fabric Finalize",
              notes: "",
              price: "",
            })
            setImageFiles([])
            setImagePreviews([])
            setIsSampling(true)
          }}
        >
          Reset
        </Button>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client name to add them to your client list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="e.g., ABC Fashion House"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddNewClient()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddClient(false)
                setNewClientName("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewClient}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Client From Dropdown Confirmation */}
      <Dialog open={!!confirmHideClient} onOpenChange={(open) => !open && setConfirmHideClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Client From List</DialogTitle>
            <DialogDescription>
              Remove &quot;{confirmHideClient?.name}&quot; from this client dropdown? They won&apos;t be available
              when creating new orders anymore, but their record and full order history (active, completed, and
              on-hold) stay exactly as they are and remain visible on the Clients, Completed Orders, and On Hold
              pages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmHideClient(null)}
              disabled={hidingClient}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleHideClient}
              disabled={hidingClient}
            >
              {hidingClient ? "Removing..." : "Remove From List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
