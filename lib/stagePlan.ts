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
