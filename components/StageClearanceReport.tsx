"use client"

import { Fragment, useEffect, useState } from "react"
import { getStageClearanceReport, type StageClearanceReport as Report } from "@/lib/actions"
import { formatReportDate } from "@/lib/stagePlan"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"

// "Fabric Finalize" is the stage name in the database; the team calls it fabric sourcing.
const STAGE_LABELS: Record<string, string> = {
  Consultation: "Consultation",
  "Fabric Finalize": "Fabric Sourcing",
}

const DEFAULT_VISIBLE_DAYS = 14

export function StageClearanceReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getStageClearanceReport()
      .then(setReport)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading stage clearance...
      </div>
    )
  }

  if (!report) {
    return <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Couldn&apos;t load stage clearance.</div>
  }

  const { stages, pending, days } = report
  const visibleDays = showAll ? days : days.slice(0, DEFAULT_VISIBLE_DAYS)
  const clearedIn = (stage: string, n: number) =>
    days.slice(0, n).reduce((sum, d) => sum + d.cleared[stage].length, 0)

  return (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Stage Clearance</h2>
        <p className="text-sm text-gray-500">Orders marked complete each day. Click a day to see which ones.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stages.map((stage) => (
          <div key={stage} className="rounded-md border border-gray-200 p-3">
            <div className="text-sm font-medium text-gray-700">{STAGE_LABELS[stage] ?? stage}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{clearedIn(stage, 1)}</div>
                <div className="text-xs text-gray-500">today</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">{clearedIn(stage, 7)}</div>
                <div className="text-xs text-gray-500">last 7 days</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-amber-600">{pending[stage]}</div>
                <div className="text-xs text-gray-500">pending now</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2 font-medium">Date</th>
            {stages.map((stage) => (
              <th key={stage} className="py-2 font-medium text-right">
                {STAGE_LABELS[stage] ?? stage}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleDays.map((day, i) => {
            const total = stages.reduce((sum, s) => sum + day.cleared[s].length, 0)
            const isOpen = expanded === day.date
            return (
              <Fragment key={day.date}>
                <tr
                  className={`border-b border-gray-100 ${total > 0 ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={() => total > 0 && setExpanded(isOpen ? null : day.date)}
                >
                  <td className="py-2 text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      {total > 0 ? (
                        isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <span className="w-4" />
                      )}
                      {formatReportDate(day.date)}
                      {i === 0 && <span className="ml-1 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5">Today</span>}
                    </span>
                  </td>
                  {stages.map((stage) => {
                    const count = day.cleared[stage].length
                    return (
                      <td key={stage} className={`py-2 text-right font-semibold ${count > 0 ? "text-gray-900" : "text-gray-300"}`}>
                        {count}
                      </td>
                    )
                  })}
                </tr>
                {isOpen && (
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td colSpan={stages.length + 1} className="px-6 py-3 space-y-3">
                      {stages
                        .filter((stage) => day.cleared[stage].length > 0)
                        .map((stage) => (
                          <div key={stage}>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                              {STAGE_LABELS[stage] ?? stage}
                            </div>
                            <ul className="space-y-0.5">
                              {day.cleared[stage].map((item, j) => (
                                <li key={j} className="text-gray-800">
                                  {item.client_name && <span className="font-medium">{item.client_name}</span>}
                                  {item.design_title && <span className="text-gray-600"> — {item.design_title}</span>}
                                  <span className="text-gray-400"> · by {item.actor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      {days.length > DEFAULT_VISIBLE_DAYS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAll ? `Show last ${DEFAULT_VISIBLE_DAYS} days` : `Show last ${days.length} days`}
        </button>
      )}
    </div>
  )
}
