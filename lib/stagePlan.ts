// Shared "what's pending where" rules for Today's Plan. Used by the board
// itself (client) and by the Daily Report snapshot (server), so the counts
// in a WhatsApp nudge always match what people see on the board.

export type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'
export type ColumnKey = 'finishing' | 'stitching' | 'cutting' | 'pattern' | 'embroidery' | 'dye' | 'print' | 'fabricFinalize' | 'consultation'

type StagedDesign = { stage_status: Record<string, string> | null }

export const stageState = (design: StagedDesign, stage: string): StageState =>
  (design.stage_status?.[stage] as StageState) || 'vacant'

// A stage counts as "cleared" once it's completed, or explicitly not needed
// for this design (e.g. a repeat order that reuses an existing pattern).
export const isCleared = (state: StageState) => state === 'completed' || state === 'not-needed'
export const isPending = (state: StageState) => state === 'vacant' || state === 'in-progress'

const cleared = (d: StagedDesign, stage: string) => isCleared(stageState(d, stage))
const pending = (d: StagedDesign, stage: string) => isPending(stageState(d, stage))

export const STAGE_MATCHERS: Record<ColumnKey, (d: StagedDesign) => boolean> = {
  finishing: (d) => cleared(d, 'Stitching') && pending(d, 'Finishing'),
  stitching: (d) => cleared(d, 'Cutting') && pending(d, 'Stitching'),
  cutting: (d) =>
    cleared(d, 'Fabric Finalize') &&
    cleared(d, 'Dye') &&
    cleared(d, 'Print') &&
    cleared(d, 'Pattern') &&
    cleared(d, 'Embroidery') &&
    pending(d, 'Cutting'),
  pattern: (d) => cleared(d, 'Consultation') && pending(d, 'Pattern'),
  embroidery: (d) => cleared(d, 'Fabric Finalize') && pending(d, 'Embroidery'),
  dye: (d) => cleared(d, 'Fabric Finalize') && pending(d, 'Dye'),
  print: (d) => cleared(d, 'Fabric Finalize') && pending(d, 'Print'),
  fabricFinalize: (d) => cleared(d, 'Consultation') && pending(d, 'Fabric Finalize'),
  consultation: (d) => pending(d, 'Consultation'),
}

// Overload limits: more pending than this in a column triggers the
// "nudge the team on WhatsApp" alert on Today's Plan and in the Daily Report.
export const STAGE_ALERT_LIMITS: { key: ColumnKey; title: string; limit: number }[] = [
  { key: 'pattern', title: 'Pattern to Make', limit: 30 },
  { key: 'fabricFinalize', title: 'Fabric to Finalize', limit: 20 },
]

export type StageAlert = {
  key: ColumnKey
  title: string
  limit: number
  count: number
  byMerchandiser: { name: string; count: number }[]
}

export function getStageAlerts(designs: (StagedDesign & { client_merchandiser?: string | null })[]): StageAlert[] {
  return STAGE_ALERT_LIMITS.map(({ key, title, limit }) => {
    const items = designs.filter(STAGE_MATCHERS[key])
    const counts = new Map<string, number>()
    for (const d of items) {
      const name = d.client_merchandiser || 'Unassigned'
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return {
      key,
      title,
      limit,
      count: items.length,
      byMerchandiser: Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    }
  }).filter((a) => a.count > a.limit)
}

export function formatReportDate(dateKey: string): string {
  return new Date(dateKey + 'T00:00:00Z').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function stageAlertLines(alerts: StageAlert[]): string[] {
  return alerts.map(
    (a) =>
      `⚠️ *${a.title}: ${a.count} pending* (limit ${a.limit})\n   ` +
      a.byMerchandiser.map((m) => `${m.name} ${m.count}`).join(', ')
  )
}

export function buildStageAlertMessage(alerts: StageAlert[], dateKey: string): string {
  return [`*Production alert – ${formatReportDate(dateKey)}*`, '', ...stageAlertLines(alerts), '', 'Please clear these first.'].join('\n')
}

export type CheckinSummary = {
  total: number
  checked: number
  merchandisers: { name: string; total: number; checked: number; unchecked: string[] }[]
}

export type DailyReportData = {
  checkins: CheckinSummary
  stageAlerts: StageAlert[]
}

export type DailyReport = {
  report_date: string
  updated_at: string
  data: DailyReportData
}

export const pct = (checked: number, total: number) => (total === 0 ? 0 : Math.round((checked / total) * 100))

export function buildDailyReportMessage(report: DailyReport): string {
  const { checkins, stageAlerts } = report.data
  const lines = [
    `*Daily Check-In – ${formatReportDate(report.report_date)}*`,
    `Overall: ${checkins.checked}/${checkins.total} clients checked (${pct(checkins.checked, checkins.total)}%)`,
    '',
  ]
  for (const m of checkins.merchandisers) {
    const p = pct(m.checked, m.total)
    lines.push(`• *${m.name}*: ${m.checked}/${m.total} (${p}%)${p === 100 ? ' ✅' : ''}`)
    if (m.unchecked.length) lines.push(`   Not checked: ${m.unchecked.join(', ')}`)
  }
  if (stageAlerts.length) {
    lines.push('', ...stageAlertLines(stageAlerts))
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Stage delays: how long a design has been sitting at a stage, and whether
// that's longer than the stage's limit (red blinking "!" on the Dashboard
// and Today's Plan).

const COLUMN_STAGE: Record<ColumnKey, string> = {
  finishing: 'Finishing',
  stitching: 'Stitching',
  cutting: 'Cutting',
  pattern: 'Pattern',
  embroidery: 'Embroidery',
  dye: 'Dye',
  print: 'Print',
  fabricFinalize: 'Fabric Finalize',
  consultation: 'Consultation',
}

// The stages that must be cleared before a column's stage can start - so
// "waiting since" is when the last of these was finished.
const STAGE_GATES: Record<ColumnKey, string[]> = {
  finishing: ['Stitching'],
  stitching: ['Cutting'],
  cutting: ['Fabric Finalize', 'Dye', 'Print', 'Pattern', 'Embroidery'],
  pattern: ['Consultation'],
  embroidery: ['Fabric Finalize'],
  dye: ['Fabric Finalize'],
  print: ['Fabric Finalize'],
  fabricFinalize: ['Consultation'],
  consultation: [],
}

// Days a design may sit at a stage before it's flagged as concerning.
export const STAGE_DAY_LIMITS: Partial<Record<string, number>> = {
  'Fabric Finalize': 3,
  Dye: 2,
  Embroidery: 2,
  Pattern: 3,
  Cutting: 2,
  Stitching: 2,
  Finishing: 2,
}

export const STAGE_COLUMN_KEY = Object.fromEntries(
  Object.entries(COLUMN_STAGE).map(([key, stage]) => [stage, key])
) as Record<string, ColumnKey>

type TimedDesign = StagedDesign & {
  stage_started_at?: Record<string, string> | null
  stage_completed_at?: Record<string, string> | null
  created_at: string | Date
}

// Postgres text timestamps ("2026-09-06 07:06:39.058373+00") don't parse in
// Safari, so normalise to ISO with millisecond precision first.
function parseTimestamp(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const iso = String(value)
    .trim()
    .replace(' ', 'T')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})$/, '$1:00')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export type StageTiming = {
  stage: string
  since: Date
  estimated: boolean // true when some earlier stage has no recorded finish time
  days: number
  limit: number | null
  overdue: boolean
}

// How long a design has been at this column's stage: from when it was
// started if it's in progress, otherwise from when its prerequisite stages
// were finished. Returns null when the design isn't at this stage right now.
export function getStageTiming(design: TimedDesign, key: ColumnKey, now = Date.now()): StageTiming | null {
  if (!STAGE_MATCHERS[key](design)) return null
  const stage = COLUMN_STAGE[key]
  const created = parseTimestamp(design.created_at) || new Date(now)

  let estimated = false
  const gateTimes = STAGE_GATES[key].map((gate) => {
    const t = parseTimestamp(design.stage_completed_at?.[gate])
    if (t) return t.getTime()
    estimated = true
    return parseTimestamp(design.stage_started_at?.[gate])?.getTime() ?? null
  })
  let since = Math.max(created.getTime(), ...gateTimes.filter((t): t is number => t !== null))

  if (stageState(design, stage) === 'in-progress') {
    const started = parseTimestamp(design.stage_started_at?.[stage])
    if (started) {
      since = Math.max(since, started.getTime())
      estimated = false
    }
  }

  const days = Math.max(0, (now - since) / 86_400_000)
  const limit = STAGE_DAY_LIMITS[stage] ?? null
  return { stage, since: new Date(since), estimated, days, limit, overdue: limit !== null && days > limit }
}

export function formatSince(timing: StageTiming): string {
  const date = timing.since.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
  return `${timing.estimated ? '~' : ''}${date}`
}

// Mirrors updateDesignStageStatus's timestamps for the instant on-screen
// update, so delay markers are right before the next reload.
export function withStageChange<T extends TimedDesign>(design: T, stage: string, state: string): T {
  const now = new Date().toISOString()
  const completed = { ...(design.stage_completed_at || {}) }
  const started = { ...(design.stage_started_at || {}) }
  if (state === 'completed' || state === 'not-needed') completed[stage] = now
  else delete completed[stage]
  if (state === 'in-progress') started[stage] = now
  return {
    ...design,
    stage_status: { ...(design.stage_status || {}), [stage]: state },
    stage_completed_at: completed,
    stage_started_at: started,
  }
}
