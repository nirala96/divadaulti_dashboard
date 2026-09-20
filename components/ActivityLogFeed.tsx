"use client"

import { useEffect, useState } from "react"
import { getActivityLog, type ActivityLogEntry } from "@/lib/actions"
import { CheckCircle2, Loader2 } from "lucide-react"

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ActivityLogFeed() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivityLog()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading activity...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No activity yet. Entries show up here as stages get marked complete.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{entry.actor_display_name}</span> marked{" "}
              <span className="font-medium">{entry.stage}</span> completed
              {entry.client_name && (
                <>
                  {" "}
                  for <span className="font-medium">{entry.client_name}</span>
                </>
              )}
              {entry.design_title && <span className="text-gray-500"> — {entry.design_title}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-1">{formatWhen(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
