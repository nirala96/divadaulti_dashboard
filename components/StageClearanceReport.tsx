"use client"

import { useEffect, useState } from "react"
import { getStageClearanceReport, type StageClearanceDay, type StageClearanceItem } from "@/lib/actions"
import { formatReportDate } from "@/lib/stagePlan"
import { ImageOff, Loader2 } from "lucide-react"

// Display order and wording; "Fabric Finalize" is what the team calls fabric sourcing.
const STAGE_ROWS: { stage: string; label: string }[] = [
  { stage: "Consultation", label: "Consultation done" },
  { stage: "Pattern", label: "Pattern made" },
  { stage: "Fabric Finalize", label: "Fabric done" },
  { stage: "Dye", label: "Dye done" },
  { stage: "Print", label: "Print done" },
  { stage: "Embroidery", label: "Embroidery done" },
  { stage: "Cutting", label: "Cutting done" },
  { stage: "Stitching", label: "Stitching done" },
  { stage: "Finishing", label: "Finishing done" },
]

const DEFAULT_VISIBLE_DAYS = 1

function ClearedThumb({ item }: { item: StageClearanceItem }) {
  return (
    <div className="group relative">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.design_title ?? ""} className="h-10 w-10 rounded-md object-cover border border-gray-200" />
      ) : (
        <div className="h-10 w-10 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
          <ImageOff className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
        <div className="font-semibold">{item.client_name || "No client"}</div>
        <div className="text-gray-200">{item.design_title || "Untitled design"}</div>
        <div className="text-gray-400">
          {item.quantity != null && `${item.quantity} pcs · `}by {item.actor}
        </div>
      </div>
    </div>
  )
}

export function StageClearanceReport() {
  const [days, setDays] = useState<StageClearanceDay[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getStageClearanceReport()
      .then(setDays)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading work done...
      </div>
    )
  }

  const visibleDays = showAll ? days : days.slice(0, DEFAULT_VISIBLE_DAYS)

  return (
    <div className="space-y-4">
      {visibleDays.map((day, i) => {
        const items = (stage: string) => day.stages.find((s) => s.stage === stage)?.items ?? []
        const total = day.stages.reduce((sum, s) => sum + s.items.length, 0)
        return (
          <div key={day.date} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div className="text-lg font-semibold text-gray-900">
                Work done · {formatReportDate(day.date)}
                {i === 0 && <span className="ml-2 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5 align-middle">Today</span>}
              </div>
              <div className="text-sm text-gray-500">{total} cleared</div>
            </div>

            <div className="divide-y divide-gray-100">
              {STAGE_ROWS.map(({ stage, label }) => {
                const cleared = items(stage)
                const pieces = cleared.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
                return (
                  <div key={stage} className="flex items-start gap-4 py-2.5">
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm text-gray-700">{label}</div>
                      <div className={`text-xl font-semibold ${cleared.length ? "text-gray-900" : "text-gray-300"}`}>
                        {cleared.length}
                        {pieces > 0 && <span className="ml-1.5 text-xs font-normal text-gray-500">{pieces} pcs</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {cleared.map((item, j) => (
                        <ClearedThumb key={j} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {days.length > DEFAULT_VISIBLE_DAYS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAll ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
