"use client"

import { useEffect, useState } from "react"
import { updateClientMerchandiser, updateClientTag } from "@/lib/actions"
import { MERCHANDISER_NAMES } from "@/lib/merchandisers"
import { CLIENT_TAGS } from "@/lib/clientTags"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const UNASSIGNED = "__unassigned__"

interface EditMerchandiserDialogProps {
  clientId: string
  clientName: string
  currentMerchandiser: string | null
  currentTag?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (merchandiser: string | null, tag: string | null) => void
}

export function EditMerchandiserDialog({
  clientId,
  clientName,
  currentMerchandiser,
  currentTag,
  open,
  onOpenChange,
  onSaved,
}: EditMerchandiserDialogProps) {
  const [value, setValue] = useState(currentMerchandiser || UNASSIGNED)
  const [tagValue, setTagValue] = useState(UNASSIGNED)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValue(currentMerchandiser || UNASSIGNED)
    if (open) setTagValue(currentTag ?? UNASSIGNED)
  }, [open, currentMerchandiser])

  const handleSave = async () => {
    const nextValue = value === UNASSIGNED ? null : value
    const nextTag = tagValue === UNASSIGNED ? null : tagValue
    setSaving(true)
    try {
      await updateClientMerchandiser(clientId, nextValue)
      await updateClientTag(clientId, nextTag)
      onSaved(nextValue, nextTag)
      onOpenChange(false)
    } catch (error: any) {
      alert("Failed to update merchandiser/tag: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tag Merchandiser</DialogTitle>
          <DialogDescription>
            Assign the merchandiser handling <strong>{clientName}</strong>, so you can filter clients per person.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="merchandiser-select">Merchandiser</Label>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger id="merchandiser-select">
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
            <Label htmlFor="client-tag-select">Client Tag</Label>
            <Select value={tagValue} onValueChange={setTagValue}>
              <SelectTrigger id="client-tag-select">
                <SelectValue placeholder="Select tag" />
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
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
