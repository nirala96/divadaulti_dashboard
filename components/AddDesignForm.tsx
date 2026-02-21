"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase, type Client, type DesignType, type DesignStatus } from "@/lib/supabase"
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
import { Upload, X, ImageIcon, Calendar, Clock } from "lucide-react"

const PROCESS_STEPS: DesignStatus[] = [
  'Sourcing',
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Photoshoot',
  'Dispatch'
]

export function AddDesignForm() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [isSampling, setIsSampling] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
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
    status: "Sourcing" as DesignStatus,
    estimated_days: {
      sourcing: 0,
      pattern: 0,
      grading: 0,
      cutting: 0,
      stitching: 0,
      photoshoot: 0,
      dispatch: 0,
    },
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

  // Calculate timeline when quantity or estimated days change
  useEffect(() => {
    const calculateAndSetTimeline = async () => {
      if (formData.client_id && formData.title) {
        try {
          const timeline = await calculateTimeline(
            formData.quantity,
            formData.type,
            formData.estimated_days
          )
          setCalculatedTimeline(timeline)
        } catch (error) {
          console.error('Error calculating timeline:', error)
        }
      }
    }

    calculateAndSetTimeline()
  }, [formData.quantity, formData.type, formData.estimated_days])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name")

    if (data) setClients(data)
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
    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('design-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      const { data } = supabase.storage
        .from('design-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate timeline for the new design
      const timeline = await calculateTimeline(
        formData.quantity,
        formData.type,
        formData.estimated_days
      )

      // Upload images first
      const imageUrls = await uploadImages()

      // Insert design with calculated timeline
      const { data, error } = await supabase
        .from("designs")
        .insert([
          {
            ...formData,
            images: imageUrls,
            start_date: timeline.start_date,
            end_date: timeline.end_date,
          },
        ])
        .select()

      if (error) throw error

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
        status: "Sourcing",
        estimated_days: {
          sourcing: 0,
          pattern: 0,
          grading: 0,
          cutting: 0,
          stitching: 0,
          photoshoot: 0,
          dispatch: 0,
        },
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
                {client.name} - {client.contact_person}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Quantity */}
      {!isSampling && (
        <div className="grid gap-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
            }
            required
          />
        </div>
      )}

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

      {/* Estimated Days per Process */}
      <div className="space-y-4">
        <Label>Estimated Days per Process</Label>
        <div className="grid grid-cols-2 gap-4">
          {PROCESS_STEPS.map((step) => {
            const key = step.toLowerCase() as keyof typeof formData.estimated_days
            return (
              <div key={step} className="grid gap-2">
                <Label htmlFor={key} className="text-sm">
                  {step}
                </Label>
                <Input
                  id={key}
                  type="number"
                  min="0"
                  placeholder="Days"
                  value={formData.estimated_days[key] || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_days: {
                        ...formData.estimated_days,
                        [key]: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            )
          })}
        </div>
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
              status: "Sourcing",
              estimated_days: {
                sourcing: 0,
                pattern: 0,
                grading: 0,
                cutting: 0,
                stitching: 0,
                photoshoot: 0,
                dispatch: 0,
              },
            })
            setImageFiles([])
            setImagePreviews([])
            setIsSampling(true)
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
