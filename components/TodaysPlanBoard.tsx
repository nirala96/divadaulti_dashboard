"use client"

import { useState, useEffect, useMemo } from "react"
import {
  getDesignsWithClients,
  updateDesignStageStatus,
  updateDesignPriority,
  type Design
} from "@/lib/actions"
import { MerchandiserTag } from "@/components/MerchandiserTag"
import { PATTERN_MASTER, CUTTING_MASTER, KARIGAAR_NAMES } from "@/lib/employees"
import { Scissors, Shirt, PenTool, Star, Loader2, ImageIcon, Droplet, Printer, PackageCheck, Sparkles } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'
type ColumnKey = 'finishing' | 'stitching' | 'cutting' | 'pattern' | 'embroidery' | 'dye' | 'print'

const stageState = (design: Design, stage: string): StageState =>
  (design.stage_status?.[stage] as StageState) || 'vacant'

// A stage counts as "cleared" once it's completed, or explicitly not needed
// for this design (e.g. a repeat order that reuses an existing pattern).
const isCleared = (state: StageState) => state === 'completed' || state === 'not-needed'
const isPending = (state: StageState) => state === 'vacant' || state === 'in-progress'

// Columns run right-to-left through the pipeline: start from what's closest
// to shipping (Finishing) and work back through whatever is still blocking
// it (Stitching, Cutting, Pattern, Embroidery, Dye, Print). Dye/Print/
// Embroidery are independent department queues that run in parallel with
// pattern-making, so a design can sit in more than one column at once -
// membership is checked per column rather than picking a single bucket.
const COLUMNS: { key: ColumnKey; stage: string; title: string; hint: string; icon: any; accent: string; matches: (d: Design) => boolean }[] = [
  {
    key: 'finishing',
    stage: 'Finishing',
    title: 'Ready to Finish',
    hint: 'Stitched — final step before shipping',
    icon: PackageCheck,
    accent: 'border-cyan-300 bg-cyan-50 text-cyan-800',
    matches: (d) => isCleared(stageState(d, 'Stitching')) && isPending(stageState(d, 'Finishing')),
  },
  {
    key: 'stitching',
    stage: 'Stitching',
    title: 'Ready to Stitch',
    hint: 'Cut and waiting on a karigaar',
    icon: Shirt,
    accent: 'border-pink-300 bg-pink-50 text-pink-800',
    matches: (d) => isCleared(stageState(d, 'Cutting')) && isPending(stageState(d, 'Stitching')),
  },
  {
    key: 'cutting',
    stage: 'Cutting',
    title: 'Ready to Cut',
    hint: 'Fabric, dye, print and pattern all done',
    icon: Scissors,
    accent: 'border-orange-300 bg-orange-50 text-orange-800',
    matches: (d) =>
      isCleared(stageState(d, 'Fabric Finalize')) &&
      isCleared(stageState(d, 'Dye')) &&
      isCleared(stageState(d, 'Print')) &&
      isCleared(stageState(d, 'Pattern')) &&
      isPending(stageState(d, 'Cutting')),
  },
  {
    key: 'pattern',
    stage: 'Pattern',
    title: 'Pattern to Make',
    hint: 'New orders waiting on a pattern',
    icon: PenTool,
    accent: 'border-blue-300 bg-blue-50 text-blue-800',
    matches: (d) => isPending(stageState(d, 'Pattern')),
  },
  {
    key: 'embroidery',
    stage: 'Embroidery',
    title: 'In Embroidery',
    hint: 'Currently with the embroidery unit',
    icon: Sparkles,
    accent: 'border-violet-300 bg-violet-50 text-violet-800',
    matches: (d) => isPending(stageState(d, 'Embroidery')),
  },
  {
    key: 'dye',
    stage: 'Dye',
    title: 'In Dye',
    hint: 'Currently with the dye unit',
    icon: Droplet,
    accent: 'border-rose-300 bg-rose-50 text-rose-800',
    matches: (d) => isPending(stageState(d, 'Dye')),
  },
  {
    key: 'print',
    stage: 'Print',
    title: 'In Print',
    hint: 'Currently with the print unit',
    icon: Printer,
    accent: 'border-lime-300 bg-lime-50 text-lime-800',
    matches: (d) => isPending(stageState(d, 'Print')),
  },
]

const daysWaiting = (createdAt: string | undefined): number => {
  if (!createdAt) return 0
  const diffMs = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

const sortForColumn = (designs: Design[]): Design[] =>
  [...designs].sort((a, b) => {
    const priorityDiff = (b.is_priority ? 1 : 0) - (a.is_priority ? 1 : 0)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

export default function TodaysPlanBoard() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [stitchingPrompt, setStitchingPrompt] = useState<Design | null>(null)
  const [selectedKarigaar, setSelectedKarigaar] = useState("")

  useEffect(() => {
    getDesignsWithClients()
      .then(setDesigns)
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo(() => {
    const result = {} as Record<ColumnKey, Design[]>
    for (const column of COLUMNS) {
      result[column.key] = sortForColumn(designs.filter(column.matches))
    }
    return result
  }, [designs])

  const applyLocalStageUpdate = (designId: string, stage: string, state: StageState) => {
    setDesigns(prev =>
      prev.map(d => (d.id === designId ? { ...d, stage_status: { ...d.stage_status, [stage]: state } } : d))
    )
  }

  const startStage = async (design: Design, stage: string) => {
    setBusyId(design.id)
    applyLocalStageUpdate(design.id, stage, 'in-progress')
    try {
      await updateDesignStageStatus(design.id, stage, 'in-progress')
    } catch (error: any) {
      console.error('Error starting stage:', error)
      alert('Failed to start: ' + error.message)
    } finally {
      setBusyId(null)
    }
  }

  const completeStage = async (design: Design, stage: string, employeeName?: string) => {
    setBusyId(design.id)
    applyLocalStageUpdate(design.id, stage, 'completed')
    try {
      await updateDesignStageStatus(design.id, stage, 'completed', employeeName)
    } catch (error: any) {
      console.error('Error completing stage:', error)
      alert('Failed to mark complete: ' + error.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleComplete = (design: Design, stage: string) => {
    if (stage === 'Stitching') {
      setSelectedKarigaar("")
      setStitchingPrompt(design)
      return
    }
    completeStage(design, stage)
  }

  const confirmStitchingComplete = async () => {
    if (!stitchingPrompt || !selectedKarigaar) return
    const design = stitchingPrompt
    setStitchingPrompt(null)
    await completeStage(design, 'Stitching', selectedKarigaar)
  }

  const togglePriority = async (design: Design) => {
    const newPriority = !design.is_priority
    setDesigns(prev => prev.map(d => (d.id === design.id ? { ...d, is_priority: newPriority } : d)))
    try {
      await updateDesignPriority(design.id, newPriority)
    } catch (error: any) {
      console.error('Error updating priority:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading today&apos;s plan...
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          What&apos;s ready to ship first, then what&apos;s blocking it — finishing, stitching, cutting, pattern, embroidery, dye, print.
        </p>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4">
        {COLUMNS.map(column => {
          const items = columns[column.key]
          const Icon = column.icon
          return (
            <div key={column.key} className="flex flex-col bg-white rounded-lg border border-gray-200 min-h-[200px] w-[300px] flex-shrink-0">
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-lg border-b ${column.accent}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-semibold text-sm">{column.title}</div>
                    <div className="text-xs opacity-75">{column.hint}</div>
                  </div>
                </div>
                <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-white/70 text-sm font-bold">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 p-3 space-y-3">
                {items.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-10">Nothing here right now</div>
                )}
                {items.map(design => {
                  const state = stageState(design, column.stage)
                  const isBusy = busyId === design.id
                  const fixedEmployee =
                    column.key === 'pattern' ? PATTERN_MASTER : column.key === 'cutting' ? CUTTING_MASTER : null

                  return (
                    <div
                      key={design.id}
                      className={`rounded-md border p-3 ${design.is_priority ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {design.images && design.images.length > 0 ? (
                            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={design.images[0]}
                                alt={design.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900 truncate">
                                {design.client_name}
                              </span>
                              {design.client_merchandiser && (
                                <MerchandiserTag name={design.client_merchandiser} />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 truncate">{design.title}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{design.type}</span>
                              <span>&middot;</span>
                              <span>Qty {design.quantity}</span>
                              <span>&middot;</span>
                              <span>{daysWaiting(design.created_at)}d waiting</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => togglePriority(design)}
                          title={design.is_priority ? "Priority — click to unset" : "Mark as priority"}
                          className="flex-shrink-0"
                        >
                          <Star
                            className={`h-4 w-4 ${design.is_priority ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {fixedEmployee && (
                          <span className="text-xs text-gray-400">{fixedEmployee}</span>
                        )}
                        {!fixedEmployee && <span />}

                        {state === 'in-progress' ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isBusy}
                            onClick={() => handleComplete(design, column.stage)}
                          >
                            Mark done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={isBusy}
                            onClick={() => startStage(design, column.stage)}
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!stitchingPrompt} onOpenChange={(open) => !open && setStitchingPrompt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Who stitched this piece?</DialogTitle>
            <DialogDescription>
              Select the karigaar who completed stitching. This credits the piece to their performance record.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedKarigaar} onValueChange={setSelectedKarigaar}>
              <SelectTrigger>
                <SelectValue placeholder="Choose karigaar" />
              </SelectTrigger>
              <SelectContent>
                {KARIGAAR_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStitchingPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={confirmStitchingComplete} disabled={!selectedKarigaar}>
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
