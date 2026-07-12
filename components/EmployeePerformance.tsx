"use client"

import { useState, useEffect, useMemo } from "react"
import { getStageWorkLogs, type StageWorkLog } from "@/lib/actions"
import { PATTERN_MASTER, CUTTING_MASTER, KARIGAAR_NAMES } from "@/lib/employees"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

type EmployeeSummary = {
  pieces: number
  totalSeconds: number
  timedPieces: number
}

const ROLE_GROUPS: { title: string; employees: string[] }[] = [
  { title: "Pattern Master", employees: [PATTERN_MASTER] },
  { title: "Cutting Master", employees: [CUTTING_MASTER] },
  { title: "Tailor Karigaars", employees: KARIGAAR_NAMES },
]

const STAGE_FILTERS = ["All", "Pattern", "Cutting", "Stitching"] as const
type StageFilter = (typeof STAGE_FILTERS)[number]

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return `${seconds}s`
}

export function EmployeePerformance() {
  const [logs, setLogs] = useState<StageWorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState<StageFilter>("All")

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const data = await getStageWorkLogs()
      setLogs(data)
    } catch (error) {
      console.error("Error fetching stage work logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const summaries = useMemo(() => {
    const map = new Map<string, EmployeeSummary>()
    for (const log of logs) {
      const existing = map.get(log.employee_name) || {
        pieces: 0,
        totalSeconds: 0,
        timedPieces: 0,
      }
      existing.pieces += 1
      if (log.duration_seconds != null) {
        existing.totalSeconds += log.duration_seconds
        existing.timedPieces += 1
      }
      map.set(log.employee_name, existing)
    }
    return map
  }, [logs])

  const filteredLogs = useMemo(() => {
    if (stageFilter === "All") return logs
    return logs.filter((l) => l.stage === stageFilter)
  }, [logs, stageFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading employee performance...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900">Employee Performance Monitor</h2>
        <p className="text-sm text-gray-600 mt-1">
          Pieces completed and average time taken per employee, tracked automatically as Pattern, Cutting, and
          Stitching are marked done.
        </p>
      </div>

      {ROLE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{group.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.employees.map((name) => {
              const summary = summaries.get(name)
              const pieces = summary?.pieces || 0
              const avgSeconds =
                summary && summary.timedPieces > 0
                  ? Math.round(summary.totalSeconds / summary.timedPieces)
                  : null
              return (
                <div key={name} className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm font-semibold text-gray-900">{name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{pieces}</span>
                    <span className="text-xs text-gray-500">piece{pieces !== 1 ? "s" : ""} done</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Avg: {formatDuration(avgSeconds)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          <div className="flex gap-2">
            {STAGE_FILTERS.map((stage) => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  stageFilter === stage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Design
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No completed pieces logged yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{log.design_title || "Unknown"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.client_name || "Unknown"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs">
                        {log.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.employee_name}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {new Date(log.completed_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-700">
                      {formatDuration(log.duration_seconds)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
