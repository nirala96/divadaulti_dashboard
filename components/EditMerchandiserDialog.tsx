"use client"

import { useEffect, useState } from "react"
import { updateClientMerchandiser } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MerchandiserTag } from "@/components/MerchandiserTag"

interface EditMerchandiserDialogProps {
  clientId: string
  clientName: string
  currentMerchandiser: string | null
  knownMerchandisers: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (merchandiser: string | null) => void
}

export function EditMerchandiserDialog({
  clientId,
  clientName,
  currentMerchandiser,
  knownMerchandisers,
  open,
  onOpenChange,
  onSaved,
}: EditMerchandiserDialogProps) {
  const [value, setValue] = useState(currentMerchandiser || "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValue(currentMerchandiser || "")
  }, [open, currentMerchandiser])

  const handleSave = async (nextValue: string | null) => {
    setSaving(true)
    try {
      await updateClientMerchandiser(clientId, nextValue)
      onSaved(nextValue)
      onOpenChange(false)
    } catch (error: any) {
      alert("Failed to update merchandiser: " + error.message)
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
            <Label htmlFor="merchandiser-input">Merchandiser name</Label>
            <Input
              id="merchandiser-input"
              list="known-merchandisers"
              placeholder="e.g. Anjali"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <datalist id="known-merchandisers">
              {knownMerchandisers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          {knownMerchandisers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {knownMerchandisers.map((name) => (
                <MerchandiserTag key={name} name={name} onClick={() => setValue(name)} />
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {currentMerchandiser ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSave(null)}
              disabled={saving}
              className="text-gray-500"
            >
              Remove tag
            </Button>
          ) : <span />}
          <Button type="button" onClick={() => handleSave(value)} disabled={saving || !value.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
