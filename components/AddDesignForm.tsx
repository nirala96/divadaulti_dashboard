"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getClients, addClient, addDesign, type Client, type Design } from "@/lib/actions"
import { calculateTimeline, formatDisplayDate } from "@/lib/timeline"
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
import { Upload, X, ImageIcon, Calendar, Clock, Plus } from "lucide-react"

type DesignType = 'Sampling' | 'Production'
type DesignStatus = string

const PROCESS_STEPS: DesignStatus[] = [
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

export function AddDesignForm() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [isSampling, setIsSampling] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientName, setNewClientName] = useState("")
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
    status: "Payment Received" as DesignStatus,
    notes: "",
  })

  useEffect(() => {
    fetchClients()
  }, [])

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
      const data = await getClients()
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
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
        images: imageUrls
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
        status: "Payment Received",
        notes: "",
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
        <Select
          value={formData.client_id}
          onValueChange={(value) =>
            setFormData({ ...formData, client_id: value })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              No images selected. Click "Upload Images" to add design images.
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
              status: "Payment Received",
              notes: "",
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
    </form>
  )
}
