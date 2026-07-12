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

const ALL_EMPLOYEES = [PATTERN_MASTER, CUTTING_MASTER, ...KARIGAAR_NAMES]

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return `${seconds}s`
}

// Monday-start week bucket, e.g. "2026-07-06"
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString().split("T")[0]
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  return `${fmt(start)} – ${fmt(end)}`
}

export function EmployeePerformance() {
  const [logs, setLogs] = useState<StageWorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState<StageFilter>("All")
  const [employeeFilter, setEmployeeFilter] = useState<string>("All")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

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
    return logs.filter((l) => {
      if (stageFilter !== "All" && l.stage !== stageFilter) return false
      if (employeeFilter !== "All" && l.employee_name !== employeeFilter) return false
      const completedDate = l.completed_at.split("T")[0]
      if (dateFrom && completedDate < dateFrom) return false
      if (dateTo && completedDate > dateTo) return false
      return true
    })
  }, [logs, stageFilter, employeeFilter, dateFrom, dateTo])

  const hasActiveFilters = stageFilter !== "All" || employeeFilter !== "All" || !!dateFrom || !!dateTo

  const clearFilters = () => {
    setStageFilter("All")
    setEmployeeFilter("All")
    setDateFrom("")
    setDateTo("")
  }

  const weeklySummary = useMemo(() => {
    const map = new Map<string, { employee: string; weekStart: string; pieces: number; totalSeconds: number; timedPieces: number }>()
    for (const log of filteredLogs) {
      const weekStart = getWeekStart(log.completed_at)
      const key = `${log.employee_name}__${weekStart}`
      const existing = map.get(key) || { employee: log.employee_name, weekStart, pieces: 0, totalSeconds: 0, timedPieces: 0 }
      existing.pieces += 1
      if (log.duration_seconds != null) {
        existing.totalSeconds += log.duration_seconds
        existing.timedPieces += 1
      }
      map.set(key, existing)
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.weekStart !== b.weekStart) return b.weekStart.localeCompare(a.weekStart)
      return a.employee.localeCompare(b.employee)
    })
  }, [filteredLogs])

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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Karigaar / Employee</label>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="All">All</option>
            {ALL_EMPLOYEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
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
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Weekly Report */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pieces delivered per karigaar, grouped by week (Mon–Sun).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week Of
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pieces
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weeklySummary.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No pieces logged for this filter yet.
                  </td>
                </tr>
              ) : (
                weeklySummary.map((row) => {
                  const avgSeconds = row.timedPieces > 0 ? Math.round(row.totalSeconds / row.timedPieces) : null
                  return (
                    <tr key={`${row.employee}__${row.weekStart}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{formatWeekLabel(row.weekStart)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.employee}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{row.pieces}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-700">{formatDuration(avgSeconds)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          <span className="text-xs text-gray-500">
            {filteredLogs.length} piece{filteredLogs.length !== 1 ? "s" : ""}
          </span>
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
