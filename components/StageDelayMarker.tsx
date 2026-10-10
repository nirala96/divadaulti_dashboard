import { type StageTiming, formatSince } from "@/lib/stagePlan"

export const stageDelayText = (t: StageTiming) =>
  `At ${t.stage} since ${formatSince(t)} — ${Math.floor(t.days)} day${Math.floor(t.days) === 1 ? "" : "s"}` +
  (t.limit !== null ? ` (limit ${t.limit})` : "")

// Red blinking "!" shown when a design has sat at a stage longer than its limit.
export function StageDelayMarker({ timing, className = "" }: { timing: StageTiming; className?: string }) {
  return (
    <span
      className={`stage-delay-blink inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none ${className}`}
      title={stageDelayText(timing)}
      aria-label={stageDelayText(timing)}
    >
      !
    </span>
  )
}
