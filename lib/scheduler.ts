// Capacity-based production scheduler powering the Timeline tab.
//
// Two kinds of departments:
//  - "queued": a shared/dedicated daily capacity that a priority-ordered
//    backlog draws down (Pattern, Cutting, Stitching, Embroidery-Sampling).
//    A day's leftover work rolls into the next day.
//  - "turnaround": not capacity-limited - any number of orders can be "in"
//    it at once, each just takes a fixed number of elapsed days once its
//    prerequisite clears (Fabric Finalize, Dye, Print, Embroidery-Production).
//
// Pure functions, no DB access - the caller fetches designs/settings.

import type { Design, CapacitySettings } from './actions'

type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'

const stageState = (design: Design, stage: string): StageState =>
  (design.stage_status?.[stage] as StageState) || 'vacant'

const isCleared = (state: StageState) => state === 'completed' || state === 'not-needed'
const isPending = (state: StageState) => state === 'vacant' || state === 'in-progress'

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}
function dateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

// Priority = existing display order (is_priority first, then display_order),
// the same ordering already used for drag-reorder and the dashboard board.
function priorityComparator(a: Design, b: Design): number {
  const ap = a.is_priority ? 1 : 0
  const bp = b.is_priority ? 1 : 0
  if (ap !== bp) return bp - ap
  return (a.display_order ?? 999999) - (b.display_order ?? 999999)
}

// Sunday counts as a 50% capacity day (alternate Sundays are usually off).
export function getDailyCapacity(base: number, date: Date): number {
  return date.getDay() === 0 ? base * 0.5 : base
}

export type DepartmentKey =
  | 'pattern'
  | 'cutting'
  | 'stitchingSample'
  | 'stitchingProduction'
  | 'embroiderySampling'
  | 'fabricFinalize'
  | 'dye'
  | 'print'
  | 'embroideryProduction'

export interface CompletingItem {
  design: Design
}

export interface QueuedDepartment {
  key: DepartmentKey
  label: string
  kind: 'queued'
  unitLabel: string
  pendingUnits: number
  pendingBreakdown?: string
  todaysCapacity: number
  daysOfBacklog: number
  completingToday: CompletingItem[]
}

export interface TurnaroundDepartment {
  key: DepartmentKey
  label: string
  kind: 'turnaround'
  unitLabel: string
  pendingUnits: number
  completingToday: CompletingItem[]
}

export type Department = QueuedDepartment | TurnaroundDepartment

export interface ForecastDay {
  date: string
  isSunday: boolean
  completions: Partial<Record<DepartmentKey, CompletingItem[]>>
}

export interface SchedulerResult {
  departments: Department[]
  forecast: ForecastDay[]
}

const HORIZON_DAYS = 120
const FORECAST_DAYS = 14

// --- Turnaround departments (closed-form, no queue) -------------------

function turnaroundCompletionDate(
  design: Design,
  stage: string,
  durationDays: number,
  earliestStart: Date,
  today: Date
): Date {
  const state = stageState(design, stage)
  const startedAt = design.stage_started_at?.[stage]
  const start =
    state === 'in-progress' && startedAt ? toDateOnly(new Date(startedAt)) : earliestStart
  const completion = addDays(start, Math.max(0, Math.ceil(durationDays) - 1))
  return completion < today ? today : completion
}

// --- Main entry point ---------------------------------------------------

export function runScheduler(
  designs: Design[],
  settings: CapacitySettings,
  today: Date = new Date()
): SchedulerResult {
  const day0 = toDateOnly(today)

  // 1. Turnaround departments: Fabric Finalize has no prerequisite; Dye,
  // Print and Embroidery-Production all key off Fabric Finalize clearing.
  const fabricDate = new Map<string, Date | null>()
  const dyeDate = new Map<string, Date | null>()
  const printDate = new Map<string, Date | null>()
  const embroideryProdDate = new Map<string, Date | null>()

  for (const d of designs) {
    const fabricState = stageState(d, 'Fabric Finalize')
    if (isPending(fabricState)) {
      fabricDate.set(d.id, turnaroundCompletionDate(d, 'Fabric Finalize', settings.fabric_finalize_days, day0, day0))
    } else {
      fabricDate.set(d.id, null) // already cleared, not relevant to backlog
    }

    const fabricAvailableFrom = isCleared(fabricState) ? day0 : fabricDate.get(d.id)!

    const dyeState = stageState(d, 'Dye')
    if (isPending(dyeState)) {
      dyeDate.set(d.id, turnaroundCompletionDate(d, 'Dye', settings.dye_days, fabricAvailableFrom, day0))
    } else {
      dyeDate.set(d.id, null)
    }

    const printState = stageState(d, 'Print')
    if (isPending(printState)) {
      printDate.set(d.id, turnaroundCompletionDate(d, 'Print', settings.print_days, fabricAvailableFrom, day0))
    } else {
      printDate.set(d.id, null)
    }

    const embState = stageState(d, 'Embroidery')
    if (d.type === 'Production' && isPending(embState)) {
      embroideryProdDate.set(
        d.id,
        turnaroundCompletionDate(d, 'Embroidery', settings.embroidery_production_days, fabricAvailableFrom, day0)
      )
    } else {
      embroideryProdDate.set(d.id, null)
    }
  }

  // 2. Queued departments: day-by-day greedy simulation, priority order.
  // Track remaining "units" per design per queued stage; a design's stage
  // clears once its units hit 0.
  const patternRemaining = new Map<string, number>()
  const cuttingRemaining = new Map<string, number>() // pieces
  const stitchSampleRemaining = new Map<string, number>()
  const stitchProdRemaining = new Map<string, number>()
  const embSamplingRemaining = new Map<string, number>()

  for (const d of designs) {
    if (isPending(stageState(d, 'Pattern'))) patternRemaining.set(d.id, 1)
    if (isPending(stageState(d, 'Cutting'))) cuttingRemaining.set(d.id, d.quantity || 1)
    if (isPending(stageState(d, 'Stitching'))) {
      if (d.type === 'Sampling') stitchSampleRemaining.set(d.id, d.quantity || 1)
      else stitchProdRemaining.set(d.id, d.quantity || 1)
    }
    if (d.type === 'Sampling' && isPending(stageState(d, 'Embroidery'))) {
      embSamplingRemaining.set(d.id, 1)
    }
  }

  const patternCompletionDay = new Map<string, number>()
  const cuttingCompletionDay = new Map<string, number>()
  const stitchCompletionDay = new Map<string, number>()

  const forecast: ForecastDay[] = []

  const patternDoneToday: CompletingItem[][] = []
  const cuttingDoneToday: CompletingItem[][] = []
  const stitchSampleDoneToday: CompletingItem[][] = []
  const stitchProdDoneToday: CompletingItem[][] = []
  const embSamplingDoneToday: CompletingItem[][] = []

  const byId = new Map(designs.map(d => [d.id, d]))

  const cuttingCostPerUnit = (d: Design) =>
    d.type === 'Sampling' ? 1 / settings.cutting_sample_per_day : 1 / settings.cutting_production_per_day

  let dayIndex = 0
  while (
    dayIndex < HORIZON_DAYS &&
    (patternRemaining.size > 0 ||
      cuttingRemaining.size > 0 ||
      stitchSampleRemaining.size > 0 ||
      stitchProdRemaining.size > 0 ||
      embSamplingRemaining.size > 0)
  ) {
    const date = addDays(day0, dayIndex)
    const factor = getDailyCapacity(1, date) // 1 or 0.5

    // Pattern - no prerequisite.
    let patternBudget = settings.pattern_per_day * factor
    const patternDone: CompletingItem[] = []
    for (const d of Array.from(patternRemaining.keys()).map(id => byId.get(id)!).sort(priorityComparator)) {
      if (patternBudget < 1) break
      patternRemaining.delete(d.id)
      patternCompletionDay.set(d.id, dayIndex)
      patternBudget -= 1
      patternDone.push({ design: d })
    }
    patternDoneToday.push(patternDone)

    // Cutting - shared budget, eligible once Fabric Finalize + Dye + Print +
    // Pattern are all cleared (real or simulated).
    let cuttingBudget = 1 * factor // one "cutting day," Sunday halved
    const cuttingDone: CompletingItem[] = []
    const cuttingQueue = Array.from(cuttingRemaining.keys())
      .map(id => byId.get(id)!)
      .filter(d => {
        const fabricOk = fabricDate.get(d.id) === null || fabricDate.get(d.id)! <= date
        const dyeOk = dyeDate.get(d.id) === null || dyeDate.get(d.id)! <= date
        const printOk = printDate.get(d.id) === null || printDate.get(d.id)! <= date
        const patternOk = isCleared(stageState(d, 'Pattern')) || (patternCompletionDay.get(d.id) ?? Infinity) <= dayIndex
        return fabricOk && dyeOk && printOk && patternOk
      })
      .sort(priorityComparator)
    for (const d of cuttingQueue) {
      if (cuttingBudget <= 0) break
      const remainingPieces = cuttingRemaining.get(d.id)!
      const cost = cuttingCostPerUnit(d)
      const affordablePieces = cuttingBudget / cost
      const piecesDone = Math.min(remainingPieces, affordablePieces)
      cuttingBudget -= piecesDone * cost
      const newRemaining = remainingPieces - piecesDone
      if (newRemaining <= 1e-9) {
        cuttingRemaining.delete(d.id)
        cuttingCompletionDay.set(d.id, dayIndex)
        cuttingDone.push({ design: d })
      } else {
        cuttingRemaining.set(d.id, newRemaining)
      }
    }
    cuttingDoneToday.push(cuttingDone)

    // Stitching - separate sample/production pools, eligible once Cutting clears.
    const cuttingClearedFor = (d: Design) =>
      isCleared(stageState(d, 'Cutting')) || (cuttingCompletionDay.get(d.id) ?? Infinity) <= dayIndex

    let stitchSampleBudget = settings.stitching_sample_per_day * factor
    const stitchSampleDone: CompletingItem[] = []
    for (const d of Array.from(stitchSampleRemaining.keys()).map(id => byId.get(id)!).filter(cuttingClearedFor).sort(priorityComparator)) {
      if (stitchSampleBudget <= 0) break
      const remaining = stitchSampleRemaining.get(d.id)!
      const done = Math.min(remaining, stitchSampleBudget)
      stitchSampleBudget -= done
      const newRemaining = remaining - done
      if (newRemaining <= 1e-9) {
        stitchSampleRemaining.delete(d.id)
        stitchCompletionDay.set(d.id, dayIndex)
        stitchSampleDone.push({ design: d })
      } else {
        stitchSampleRemaining.set(d.id, newRemaining)
      }
    }
    stitchSampleDoneToday.push(stitchSampleDone)

    let stitchProdBudget = settings.stitching_production_per_day * factor
    const stitchProdDone: CompletingItem[] = []
    for (const d of Array.from(stitchProdRemaining.keys()).map(id => byId.get(id)!).filter(cuttingClearedFor).sort(priorityComparator)) {
      if (stitchProdBudget <= 0) break
      const remaining = stitchProdRemaining.get(d.id)!
      const done = Math.min(remaining, stitchProdBudget)
      stitchProdBudget -= done
      const newRemaining = remaining - done
      if (newRemaining <= 1e-9) {
        stitchProdRemaining.delete(d.id)
        stitchCompletionDay.set(d.id, dayIndex)
        stitchProdDone.push({ design: d })
      } else {
        stitchProdRemaining.set(d.id, newRemaining)
      }
    }
    stitchProdDoneToday.push(stitchProdDone)

    // Embroidery (Sampling only) - eligible once Fabric Finalize clears.
    let embBudget = settings.embroidery_sampling_per_day * factor
    const embDone: CompletingItem[] = []
    const embQueue = Array.from(embSamplingRemaining.keys())
      .map(id => byId.get(id)!)
      .filter(d => fabricDate.get(d.id) === null || fabricDate.get(d.id)! <= date)
      .sort(priorityComparator)
    for (const d of embQueue) {
      if (embBudget < 1) break
      embSamplingRemaining.delete(d.id)
      embBudget -= 1
      embDone.push({ design: d })
    }
    embSamplingDoneToday.push(embDone)

    if (dayIndex < FORECAST_DAYS) {
      forecast.push({
        date: dateKey(date),
        isSunday: date.getDay() === 0,
        completions: {
          pattern: patternDone,
          cutting: cuttingDone,
          stitchingSample: stitchSampleDone,
          stitchingProduction: stitchProdDone,
          embroiderySampling: embDone,
        },
      })
    }

    dayIndex++
  }

  // 3. Assemble department summaries.
  const todaysFactor = getDailyCapacity(1, day0)

  const patternPending = designs.filter(d => isPending(stageState(d, 'Pattern'))).length
  const patternCapacityToday = settings.pattern_per_day * todaysFactor

  const cuttingSamplePending = designs.filter(d => d.type === 'Sampling' && isPending(stageState(d, 'Cutting')))
  const cuttingProdPending = designs.filter(d => d.type === 'Production' && isPending(stageState(d, 'Cutting')))
  const cuttingBudgetPending =
    cuttingSamplePending.reduce((s, d) => s + (d.quantity || 1) / settings.cutting_sample_per_day, 0) +
    cuttingProdPending.reduce((s, d) => s + (d.quantity || 1) / settings.cutting_production_per_day, 0)

  const stitchSamplePendingCount = designs
    .filter(d => d.type === 'Sampling' && isPending(stageState(d, 'Stitching')))
    .reduce((s, d) => s + (d.quantity || 1), 0)
  const stitchProdPendingCount = designs
    .filter(d => d.type === 'Production' && isPending(stageState(d, 'Stitching')))
    .reduce((s, d) => s + (d.quantity || 1), 0)

  const embSamplingPendingCount = designs.filter(
    d => d.type === 'Sampling' && isPending(stageState(d, 'Embroidery'))
  ).length

  const departments: Department[] = [
    {
      key: 'pattern',
      label: 'Pattern',
      kind: 'queued',
      unitLabel: 'styles',
      pendingUnits: patternPending,
      todaysCapacity: patternCapacityToday,
      daysOfBacklog: patternCapacityToday > 0 ? patternPending / settings.pattern_per_day : 0,
      completingToday: patternDoneToday[0] || [],
    },
    {
      key: 'cutting',
      label: 'Cutting',
      kind: 'queued',
      unitLabel: 'orders',
      pendingBreakdown: `${cuttingSamplePending.length} sample + ${cuttingProdPending.length} production orders pending`,
      pendingUnits: cuttingSamplePending.length + cuttingProdPending.length,
      todaysCapacity: todaysFactor, // expressed as "cutting-days"
      daysOfBacklog: cuttingBudgetPending,
      completingToday: cuttingDoneToday[0] || [],
    },
    {
      key: 'stitchingSample',
      label: 'Stitching (Sample)',
      kind: 'queued',
      unitLabel: 'pieces',
      pendingUnits: stitchSamplePendingCount,
      todaysCapacity: settings.stitching_sample_per_day * todaysFactor,
      daysOfBacklog: stitchSamplePendingCount / settings.stitching_sample_per_day,
      completingToday: stitchSampleDoneToday[0] || [],
    },
    {
      key: 'stitchingProduction',
      label: 'Stitching (Production)',
      kind: 'queued',
      unitLabel: 'pieces',
      pendingUnits: stitchProdPendingCount,
      todaysCapacity: settings.stitching_production_per_day * todaysFactor,
      daysOfBacklog: stitchProdPendingCount / settings.stitching_production_per_day,
      completingToday: stitchProdDoneToday[0] || [],
    },
    {
      key: 'embroiderySampling',
      label: 'Embroidery (Sampling)',
      kind: 'queued',
      unitLabel: 'designs',
      pendingUnits: embSamplingPendingCount,
      todaysCapacity: settings.embroidery_sampling_per_day * todaysFactor,
      daysOfBacklog: embSamplingPendingCount / settings.embroidery_sampling_per_day,
      completingToday: embSamplingDoneToday[0] || [],
    },
    {
      key: 'fabricFinalize',
      label: 'Fabric Finalize',
      kind: 'turnaround',
      unitLabel: 'orders in progress',
      pendingUnits: designs.filter(d => isPending(stageState(d, 'Fabric Finalize'))).length,
      completingToday: designs
        .filter(d => fabricDate.get(d.id) && dateKey(fabricDate.get(d.id)!) === dateKey(day0))
        .map(d => ({ design: d })),
    },
    {
      key: 'dye',
      label: 'Dye',
      kind: 'turnaround',
      unitLabel: 'orders in progress',
      pendingUnits: designs.filter(d => isPending(stageState(d, 'Dye'))).length,
      completingToday: designs
        .filter(d => dyeDate.get(d.id) && dateKey(dyeDate.get(d.id)!) === dateKey(day0))
        .map(d => ({ design: d })),
    },
    {
      key: 'print',
      label: 'Print',
      kind: 'turnaround',
      unitLabel: 'orders in progress',
      pendingUnits: designs.filter(d => isPending(stageState(d, 'Print'))).length,
      completingToday: designs
        .filter(d => printDate.get(d.id) && dateKey(printDate.get(d.id)!) === dateKey(day0))
        .map(d => ({ design: d })),
    },
    {
      key: 'embroideryProduction',
      label: 'Embroidery (Production)',
      kind: 'turnaround',
      unitLabel: 'orders in progress',
      pendingUnits: designs.filter(d => d.type === 'Production' && isPending(stageState(d, 'Embroidery'))).length,
      completingToday: designs
        .filter(d => embroideryProdDate.get(d.id) && dateKey(embroideryProdDate.get(d.id)!) === dateKey(day0))
        .map(d => ({ design: d })),
    },
  ]

  return { departments, forecast }
}
