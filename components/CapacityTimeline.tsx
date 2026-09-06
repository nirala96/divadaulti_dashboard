"use client"

import { useState, useEffect, useMemo } from "react"
import {
  getDesignsWithClients,
  getCapacitySettings,
  updateCapacitySettings,
  getStageWorkLogs,
  type Design,
  type CapacitySettings,
  type StageWorkLog,
} from "@/lib/actions"
import {
  runScheduler,
  getDailyCapacity,
  toISTDateOnly,
  type Department,
  type DepartmentKey,
  type CompletingItem,
} from "@/lib/scheduler"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, ImageIcon } from "lucide-react"
import Image from "next/image"

interface DesignWithClient extends Design {
  client_name: string
  client_id: string
}

function MiniThumb({ design }: { design: Design }) {
  const url = design.images?.[0]
  if (url) {
    return (
      <div className="relative w-6 h-6 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        <Image src={url} alt={design.title} fill className="object-cover" sizes="24px" unoptimized />
      </div>
    )
  }
  return (
    <div className="w-6 h-6 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
      <ImageIcon className="h-3 w-3 text-gray-400" />
    </div>
  )
}

function CompletingList({ items, max = 8 }: { items: CompletingItem[]; max?: number }) {
  if (items.length === 0) return null
  return (
    <ul className="space-y-1 max-h-28 overflow-y-auto">
      {items.slice(0, max).map(item => (
        <li key={item.design.id} className="flex items-center gap-2 text-xs text-gray-700">
          <MiniThumb design={item.design} />
          <span className="truncate">
            {(item.design as DesignWithClient).client_name} — {item.design.title}
          </span>
        </li>
      ))}
      {items.length > max && <li className="text-xs text-gray-400 pl-8">+{items.length - max} more</li>}
    </ul>
  )
}

const SETTINGS_FIELDS: { key: keyof CapacitySettings; label: string; unit: string }[] = [
  { key: "pattern_per_day", label: "Pattern", unit: "styles/day" },
  { key: "cutting_sample_per_day", label: "Cutting - Sample", unit: "pieces/day equivalent" },
  { key: "cutting_production_per_day", label: "Cutting - Production", unit: "pieces/day equivalent" },
  { key: "stitching_sample_per_day", label: "Stitching - Sample", unit: "pieces/day" },
  { key: "stitching_production_per_day", label: "Stitching - Production", unit: "pieces/day" },
  { key: "embroidery_sampling_per_day", label: "Embroidery - Sampling", unit: "designs/day" },
  { key: "fabric_finalize_days", label: "Fabric Finalize", unit: "days turnaround" },
  { key: "dye_days", label: "Dye", unit: "days turnaround" },
  { key: "embroidery_production_days", label: "Embroidery - Production", unit: "days turnaround" },
  { key: "print_days", label: "Print", unit: "days turnaround" },
]

// IST-anchored, same convention as lib/scheduler.ts - this is an India-based
// business, so "today" and daily buckets need to mean the IST calendar day
// regardless of the viewer's own timezone.
function toDateOnly(value: string | Date): string {
  return toISTDateOnly(new Date(value)).toISOString().split("T")[0]
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return `Today — ${formatShortDate(dateStr)}`
  if (index === 1) return `Tomorrow — ${formatShortDate(dateStr)}`
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

const ALL_DEPARTMENT_ORDER: DepartmentKey[] = [
  "pattern",
  "cutting",
  "stitchingSample",
  "stitchingProduction",
  "embroiderySampling",
  "fabricFinalize",
  "dye",
  "print",
  "embroideryProduction",
]

export function CapacityTimeline() {
  const [designs, setDesigns] = useState<DesignWithClient[]>([])
  const [settings, setSettings] = useState<CapacitySettings | null>(null)
  const [formValues, setFormValues] = useState<CapacitySettings | null>(null)
  const [logs, setLogs] = useState<StageWorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [designsData, settingsData, logsData] = await Promise.all([
        getDesignsWithClients(),
        getCapacitySettings(),
        getStageWorkLogs(),
      ])
      setDesigns(designsData as DesignWithClient[])
      setSettings(settingsData)
      setFormValues(settingsData)
      setLogs(logsData)
    } catch (error) {
      console.error("Error loading timeline data:", error)
    } finally {
      setLoading(false)
    }
  }

  const result = useMemo(() => {
    if (!settings) return null
    return runScheduler(designs, settings, new Date())
  }, [designs, settings])

  const efficiency = useMemo(() => {
    if (!settings) return null
    const todayIST = toISTDateOnly(new Date())
    const days: Date[] = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(todayIST)
      d.setUTCDate(d.getUTCDate() - i)
      days.push(d)
    }
    const dayKeys = new Set(days.map(toDateOnly))

    const sums: Record<string, { actual: number; capacity: number }> = {
      Pattern: { actual: 0, capacity: 0 },
      Cutting: { actual: 0, capacity: 0 },
      "Stitching-Sample": { actual: 0, capacity: 0 },
      "Stitching-Production": { actual: 0, capacity: 0 },
    }

    for (const day of days) {
      sums.Pattern.capacity += getDailyCapacity(settings.pattern_per_day, day)
      // Cutting capacity expressed in "cutting-days" (1 or 0.5) for a consistent %.
      sums.Cutting.capacity += getDailyCapacity(1, day)
      sums["Stitching-Sample"].capacity += getDailyCapacity(settings.stitching_sample_per_day, day)
      sums["Stitching-Production"].capacity += getDailyCapacity(settings.stitching_production_per_day, day)
    }

    for (const log of logs) {
      const key = toDateOnly(log.completed_at)
      if (!dayKeys.has(key)) continue
      if (log.stage === "Pattern") {
        sums.Pattern.actual += 1
      } else if (log.stage === "Cutting" && log.design_quantity != null) {
        const cost =
          log.design_type === "Sampling"
            ? 1 / settings.cutting_sample_per_day
            : 1 / settings.cutting_production_per_day
        sums.Cutting.actual += log.design_quantity * cost
      } else if (log.stage === "Stitching" && log.design_quantity != null) {
        if (log.design_type === "Sampling") sums["Stitching-Sample"].actual += log.design_quantity
        else if (log.design_type === "Production") sums["Stitching-Production"].actual += log.design_quantity
      }
    }

    return Object.entries(sums).map(([label, { actual, capacity }]) => ({
      label,
      actual: round1(actual),
      capacity: round1(capacity),
      pct: capacity > 0 ? Math.round((actual / capacity) * 100) : null,
    }))
  }, [logs, settings])

  const handleSettingChange = (key: keyof CapacitySettings, value: string) => {
    if (!formValues) return
    const num = parseFloat(value)
    setFormValues({ ...formValues, [key]: isNaN(num) ? 0 : num })
  }

  const handleSaveSettings = async () => {
    if (!formValues) return
    setSaving(true)
    try {
      await updateCapacitySettings(formValues)
      setSettings(formValues)
    } catch (error: any) {
      alert("Failed to save capacity settings: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !result || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading timeline...</p>
      </div>
    )
  }

  const { departments, forecast } = result
  const queued = departments.filter((d): d is Extract<Department, { kind: "queued" }> => d.kind === "queued")
  const turnaround = departments.filter((d): d is Extract<Department, { kind: "turnaround" }> => d.kind === "turnaround")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Timeline</h2>
            <p className="text-sm text-gray-600 mt-1">
              Backlog, today's completions, and a forecast, computed from real stage progress and department capacity.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(s => !s)}>
            {showSettings ? "Hide capacity settings" : "Edit capacity settings"}
          </Button>
        </div>

        {showSettings && formValues && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SETTINGS_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {field.label} <span className="text-gray-400">({field.unit})</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formValues[field.key]}
                    onChange={e => handleSettingChange(field.key, e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save capacity settings"}
              </Button>
              <p className="text-xs text-gray-500">
                Trims Sourcing and Finishing aren't capacity-limited here (Trims is same-day; Finishing has no
                capacity number yet — let me know one if you want it modeled).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* This week's plan - the main "what happens when" view */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          This week's plan — what happens in each department, day by day
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {forecast.slice(0, 7).map((day, index) => {
            const activeDepts = ALL_DEPARTMENT_ORDER.map(key => ({
              key,
              dept: departments.find(d => d.key === key)!,
              items: day.completions[key] || [],
            })).filter(d => d.items.length > 0)

            return (
              <div
                key={day.date}
                className={`bg-white rounded-lg shadow p-4 ${day.isSunday ? "border-l-4 border-amber-300" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">{dayLabel(day.date, index)}</div>
                  {day.isSunday && <span className="text-xs text-amber-600">Sunday, 50% capacity</span>}
                </div>
                {activeDepts.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-2">Nothing scheduled to finish this day yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {activeDepts.map(({ key, dept, items }) => (
                      <div key={key}>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {dept.label} ({items.length})
                        </div>
                        <CompletingList items={items} max={5} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Queued departments - backlog */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Queued departments — backlog as of today
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {queued.map(dept => (
            <div key={dept.key} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-semibold text-gray-900">{dept.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{round1(dept.daysOfBacklog)}</span>
                <span className="text-xs text-gray-500">days of backlog</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dept.pendingBreakdown ?? `${dept.pendingUnits} ${dept.unitLabel} pending`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Today's capacity: {round1(dept.todaysCapacity)}
                {dept.key === "cutting" ? " cutting-day" : ""}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Finishing today ({dept.completingToday.length})
                </div>
                {dept.completingToday.length === 0 ? (
                  <div className="text-xs text-gray-400">Nothing scheduled to finish today</div>
                ) : (
                  <CompletingList items={dept.completingToday} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Turnaround departments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Fixed-turnaround departments (not capacity-queued)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {turnaround.map(dept => (
            <div key={dept.key} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-semibold text-gray-900">{dept.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{dept.pendingUnits}</span>
                <span className="text-xs text-gray-500">orders in progress</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Expected back today ({dept.completingToday.length})
                </div>
                {dept.completingToday.length === 0 ? (
                  <div className="text-xs text-gray-400">None expected today</div>
                ) : (
                  <CompletingList items={dept.completingToday} max={6} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Efficiency */}
      {efficiency && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Efficiency — last 7 days (actual vs capacity)
          </h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {efficiency.map(row => (
                <div key={row.label}>
                  <div className="text-sm font-medium text-gray-700">{row.label}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {row.pct !== null ? `${row.pct}%` : "—"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {row.actual} done / {row.capacity} possible
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              Only Pattern, Cutting and Stitching are tracked here — they're the only stages with per-completion
              logs (Dye/Print/Embroidery/Fabric Finalize/Finishing aren't attributed to an employee, so there's
              nothing to measure). Cutting/Stitching numbers exclude completions for since-deleted designs, since
              their original quantity isn't preserved.
            </p>
          </div>
        </div>
      )}

      {/* Forecast */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          14-day outlook — quick glance (counts only)
        </h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                {queued.map(dept => (
                  <th key={dept.key} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    {dept.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecast.map(day => (
                <tr key={day.date} className={day.isSunday ? "bg-amber-50" : ""}>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {formatShortDate(day.date)}
                    {day.isSunday && <span className="text-xs text-amber-600 ml-1">(Sun, 50%)</span>}
                  </td>
                  {queued.map(dept => {
                    const count = day.completions[dept.key as DepartmentKey]?.length || 0
                    return (
                      <td key={dept.key} className="px-4 py-2 text-center text-sm text-gray-600">
                        {count > 0 ? count : <span className="text-gray-300">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          Counts are how many orders finish that stage on that day, based on today's queue and priority order — it
          shifts as work actually gets completed day to day.
        </p>
      </div>
    </div>
  )
}
