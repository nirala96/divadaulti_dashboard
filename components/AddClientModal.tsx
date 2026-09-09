"use client"

import { useState } from "react"
import { addClient } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { MERCHANDISER_NAMES } from "@/lib/merchandisers"
import { CLIENT_TAGS } from "@/lib/clientTags"
import { Plus } from "lucide-react"

const UNASSIGNED = "__unassigned__"

interface AddClientModalProps {
  onClientAdded?: () => void
}

export function AddClientModal({ onClientAdded }: AddClientModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    merchandiser: UNASSIGNED,
    tag: UNASSIGNED,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addClient({
        ...formData,
          merchandiser: formData.merchandiser === UNASSIGNED ? undefined : formData.merchandiser,
          tag: formData.tag === UNASSIGNED ? undefined : formData.tag,
      })

      alert("Client added successfully!")
      setFormData({ name: "", contact_person: "", email: "", merchandiser: UNASSIGNED, tag: UNASSIGNED })
      setOpen(false)
      onClientAdded?.() // Call the callback to refresh the list
    } catch (error: any) {
      alert("Error adding client: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Enter the client details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                placeholder="ABC Fashion Co."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                placeholder="John Doe"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="merchandiser">Merchandiser</Label>
              <Select
                value={formData.merchandiser}
                onValueChange={(value) => setFormData({ ...formData, merchandiser: value })}
              >
                <SelectTrigger id="merchandiser">
                  <SelectValue placeholder="Select merchandiser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {MERCHANDISER_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-tag">Client Tag</Label>
              <Select
                value={formData.tag}
                onValueChange={(value) => setFormData({ ...formData, tag: value })}
              >
                <SelectTrigger id="client-tag">
                  <SelectValue placeholder="Select client tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {CLIENT_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
