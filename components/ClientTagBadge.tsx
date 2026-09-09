"use client"

import { useState } from "react"
import { Tag as TagIcon } from "lucide-react"
import { updateClientTag } from "@/lib/actions"
import { CLIENT_TAGS } from "@/lib/clientTags"
import { getClientTagColor } from "@/lib/clientTagColors"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const NO_TAG = "__no_tag__"

interface ClientTagBadgeProps {
  clientId: string
  tag: string | null
  onTagChanged?: (tag: string | null) => void
}

export function ClientTagBadge({ clientId, tag, onTagChanged }: ClientTagBadgeProps) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (value: string) => {
    const nextTag = value === NO_TAG ? null : value
    setSaving(true)
    try {
      await updateClientTag(clientId, nextTag)
      onTagChanged?.(nextTag)
    } catch (error: any) {
      alert("Failed to update tag: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const color = tag ? getClientTagColor(tag) : null

  return (
    <Select value={tag ?? NO_TAG} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        className={
          tag
            ? `h-auto w-auto gap-1 rounded-full border px-2 py-0.5 text-xs font-medium [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60 ${color!.bg} ${color!.text} ${color!.border}`
            : "h-auto w-auto gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-400 hover:border-gray-400 hover:text-gray-600 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60"
        }
        title={tag ? `Tag: ${tag} (click to change)` : "Tag this client"}
      >
        {tag ? (
          <SelectValue />
        ) : (
          <span className="inline-flex items-center gap-1">
            <TagIcon className="h-3 w-3" />
            Tag
          </span>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_TAG}>No tag</SelectItem>
        {CLIENT_TAGS.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
