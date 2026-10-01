"use client"

import { useEffect, useState } from "react"
import { getDailyReports } from "@/lib/actions"
import { buildDailyReportMessage, formatReportDate, pct, type DailyReport } from "@/lib/stagePlan"
import { MerchandiserTag } from "@/components/MerchandiserTag"
import { WhatsAppNudgeButtons } from "@/components/WhatsAppNudgeButtons"
import { Loader2 } from "lucide-react"

const barColor = (p: number) => (p >= 80 ? "bg-green-500" : p >= 50 ? "bg-amber-400" : "bg-red-400")

export function DailyReportBoard() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDailyReports()
      .then(setReports)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading reports...
      </div>
    )
  }

  if (reports.length === 0) {
    return <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">No reports yet.</div>
  }

  return (
    <div className="space-y-4">
      {reports.map((report, i) => {
        const { checkins, stageAlerts } = report.data
        const overall = pct(checkins.checked, checkins.total)
        const updated = new Date(report.updated_at).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        })
        return (
          <div key={report.report_date} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatReportDate(report.report_date)}
                  {i === 0 && <span className="ml-2 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5 align-middle">Today · live</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {checkins.checked} of {checkins.total} clients checked ·{" "}
                  <span className="font-semibold text-gray-800">{overall}%</span>
                  <span className="text-gray-400"> · {i === 0 ? "updated" : "final at"} {updated}</span>
                </div>
              </div>
              <WhatsAppNudgeButtons message={buildDailyReportMessage(report)} />
            </div>

            <div className="space-y-3">
              {checkins.merchandisers.map((m) => {
                const p = pct(m.checked, m.total)
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between gap-3 text-sm mb-1">
                      <MerchandiserTag name={m.name} />
                      <span className="text-gray-600">
                        {m.checked}/{m.total} · <span className="font-semibold text-gray-900">{p}%</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full ${barColor(p)}`} style={{ width: `${p}%` }} />
                    </div>
                    {m.unchecked.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">Not checked: {m.unchecked.join(", ")}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {stageAlerts.length > 0 && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
                {stageAlerts.map((a) => (
                  <div key={a.key} className="text-sm text-red-800">
                    <span className="font-semibold">{a.title}: {a.count} pending</span> (limit {a.limit})
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
