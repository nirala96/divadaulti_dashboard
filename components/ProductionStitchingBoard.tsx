"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, GripVertical, Image as ImageIcon, PencilLine, Scissors, X } from "lucide-react"

type Tailor = {
  id: string
  name: string
  accent: string
}

type StitchingTask = {
  id: string
  designName: string
  clientName: string
  tailorId: string | null
  dateKey: string | null
  estimatedDays: number
  imageUrl?: string
  autoAssign?: boolean
}

const TAILOR_COLORS = [
  "#7c3aed",
  "#0f766e",
  "#f59e0b",
  "#ef4444",
  "#2563eb",
]

const addDays = (base: Date, offset: number) => {
  const next = new Date(base)
  next.setDate(base.getDate() + offset)
  return next
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

const initialTailors: Tailor[] = [
  { id: "tailor-1", name: "Tailor A", accent: TAILOR_COLORS[0] },
  { id: "tailor-2", name: "Tailor B", accent: TAILOR_COLORS[1] },
  { id: "tailor-3", name: "Tailor C", accent: TAILOR_COLORS[2] },
  { id: "tailor-4", name: "Tailor D", accent: TAILOR_COLORS[3] },
  { id: "tailor-5", name: "Tailor E", accent: TAILOR_COLORS[4] },
]

const getDateRange = (days = 7) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, index) => formatDateKey(addDays(today, index)))
}

const initialTasks = (): StitchingTask[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [
    {
      id: "task-1",
      designName: "Aisha Kurta",
      clientName: "Aisha Boutique",
      tailorId: null,
      dateKey: null,
      estimatedDays: 4,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      autoAssign: false,
    },
    {
      id: "task-2",
      designName: "Nora Co-ord",
      clientName: "Nora Studio",
      tailorId: null,
      dateKey: null,
      estimatedDays: 6,
      imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
      autoAssign: false,
    },
    {
      id: "task-3",
      designName: "Aarav Sherwani",
      clientName: "Aarav House",
      tailorId: initialTailors[0].id,
      dateKey: formatDateKey(addDays(today, 0)),
      estimatedDays: 5,
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-4",
      designName: "Leah Dress",
      clientName: "Leah & Co",
      tailorId: initialTailors[1].id,
      dateKey: formatDateKey(addDays(today, 1)),
      estimatedDays: 3,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-5",
      designName: "Mira Blazer",
      clientName: "Mira Atelier",
      tailorId: initialTailors[2].id,
      dateKey: formatDateKey(addDays(today, 2)),
      estimatedDays: 7,
      imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-6",
      designName: "Kaira Suit",
      clientName: "Kaira Label",
      tailorId: initialTailors[3].id,
      dateKey: formatDateKey(addDays(today, 3)),
      estimatedDays: 8,
      imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
  ]
}

const getTaskDateSet = (task: Pick<StitchingTask, "dateKey" | "estimatedDays">) => {
  if (!task.dateKey) return []

  const start = new Date(`${task.dateKey}T00:00:00`)
  const count = Math.max(1, Number(task.estimatedDays) || 1)

  return Array.from({ length: count }, (_, index) => formatDateKey(addDays(start, index)))
}

const findEarliestFreeSlot = (
  task: StitchingTask,
  tailorId: string,
  tasks: StitchingTask[],
  dateKeys: string[]
) => {
  const duration = Math.max(1, Number(task.estimatedDays) || 1)

  for (const dateKey of dateKeys) {
    const candidateDates = new Set(getTaskDateSet({ dateKey, estimatedDays: duration }))
    const conflict = tasks.some((existingTask) => {
      if (existingTask.id === task.id || existingTask.tailorId !== tailorId || !existingTask.dateKey) return false
      const existingDates = new Set(getTaskDateSet(existingTask))
      return Array.from(candidateDates).some((value) => existingDates.has(value))
    })

    if (!conflict) return dateKey
  }

  return null
}

const autoAssignTasks = (tasks: StitchingTask[], tailors: Tailor[], dateKeys: string[]) => {
  const next = tasks.map((task) => ({ ...task }))

  for (const task of next) {
    if (task.autoAssign === false || (task.tailorId && task.dateKey)) continue

    let bestOption: { tailorId: string; dateKey: string } | null = null

    for (const tailor of tailors) {
      const candidateDate = findEarliestFreeSlot(task, tailor.id, next, dateKeys)
      if (!candidateDate) continue

      const isEarlier = !bestOption || candidateDate < bestOption.dateKey
      if (isEarlier) {
        bestOption = { tailorId: tailor.id, dateKey: candidateDate }
      }
    }

    if (bestOption) {
      task.tailorId = bestOption.tailorId
      task.dateKey = bestOption.dateKey
    }
  }

  return next
}

export function ProductionStitchingBoard() {
  const [tailors] = useState<Tailor[]>(initialTailors)
  const [tasks, setTasks] = useState<StitchingTask[]>(() => initialTasks())
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<StitchingTask | null>(null)
  const [editedDays, setEditedDays] = useState(1)

  const dateKeys = useMemo(() => getDateRange(7), [])

  useEffect(() => {
    setTasks((current) => autoAssignTasks(current, tailors, dateKeys))
  }, [tailors, dateKeys])

  const readyTasks = useMemo(
    () => tasks.filter((task) => !task.tailorId && !task.dateKey && task.autoAssign === false),
    [tasks]
  )

  const moveTask = (taskId: string, tailorId: string | null, dateKey: string | null) => {
    setTasks((current) => {
      const updated = current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              tailorId,
              dateKey,
              autoAssign: true,
            }
          : task
      )

      return autoAssignTasks(updated, tailors, dateKeys)
    })
  }

  const openTaskEditor = (task: StitchingTask) => {
    setSelectedTask(task)
    setEditedDays(task.estimatedDays)
  }

  const saveTaskUpdate = () => {
    if (!selectedTask) return

    setTasks((current) => {
      const updated = current.map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              estimatedDays: Math.max(1, Number(editedDays) || 1),
              autoAssign: task.tailorId ? true : task.autoAssign,
            }
          : task
      )

      const taskToReassign = updated.find((task) => task.id === selectedTask.id)
      if (taskToReassign && (!taskToReassign.tailorId || !taskToReassign.dateKey)) {
        return autoAssignTasks(updated, tailors, dateKeys)
      }

      return autoAssignTasks(updated, tailors, dateKeys)
    })
    setSelectedTask(null)
  }

  const taskCountForTailor = (tailorId: string) => tasks.filter((task) => task.tailorId === tailorId).length

  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
            <Scissors className="h-3.5 w-3.5" />
            Production Stitching Management
          </div>
          <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-800">Tailor workload planner</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
          <CalendarDays className="h-4 w-4" />
          Starts today, {formatDateLabel(dateKeys[0])}
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[120px_repeat(5,minmax(210px,1fr))] gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Date
            </div>

            {tailors.map((tailor) => (
              <div
                key={tailor.id}
                className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-800"
                style={{ borderLeft: `4px solid ${tailor.accent}` }}
              >
                <span>{tailor.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {taskCountForTailor(tailor.id)}
                </span>
              </div>
            ))}

            <div className="flex flex-col gap-2">
              {dateKeys.map((dateKey) => (
                <div
                  key={dateKey}
                  className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600"
                >
                  {formatDateLabel(dateKey)}
                </div>
              ))}
            </div>

            {tailors.map((tailor) => {
              const columnTasks = tasks.filter(
                (task) => task.tailorId === tailor.id && task.dateKey && dateKeys.includes(task.dateKey)
              )

              return (
                <div
                  key={tailor.id}
                  className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-2"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingTaskId) {
                      const task = tasks.find((entry) => entry.id === draggingTaskId)
                      if (!task) return

                      const candidateDate = findEarliestFreeSlot(task, tailor.id, tasks, dateKeys)
                      if (!candidateDate) return

                      moveTask(task.id, tailor.id, candidateDate)
                      setDraggingTaskId(null)
                    }
                  }}
                  style={{ minHeight: `${dateKeys.length * 88}px` }}
                >
                  {dateKeys.map((dateKey) => (
                    <div
                      key={`${tailor.id}-${dateKey}`}
                      className="mb-2 rounded-xl border border-dashed border-slate-200 bg-white/30"
                      style={{ height: "82px" }}
                    />
                  ))}

                  {columnTasks.map((task) => {
                    if (!task.dateKey) return null

                    const startIndex = dateKeys.indexOf(task.dateKey)
                    const duration = Math.max(1, Number(task.estimatedDays) || 1)
                    const rowHeight = 82
                    const gap = 8
                    const top = startIndex * (rowHeight + gap)
                    const height = Math.max(rowHeight, duration * rowHeight - (duration - 1) * gap)

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggingTaskId(task.id)}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onClick={() => openTaskEditor(task)}
                        title={`${task.designName} · ${task.clientName} · ${task.estimatedDays} days`}
                        className="group absolute left-2 right-2 z-10 cursor-grab overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                        style={{
                          top: `${top + 4}px`,
                          height: `${height}px`,
                          borderLeft: `4px solid ${tailor.accent}`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                            {task.imageUrl ? (
                              <img src={task.imageUrl} alt={task.designName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-slate-100 text-[10px] font-bold text-violet-700">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-[11px] font-bold text-slate-800">{task.designName}</p>
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                <GripVertical className="h-3 w-3" />
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[10px] text-slate-500">{task.clientName}</p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                            {task.estimatedDays}d
                          </span>
                          <button
                            type="button"
                            aria-label={`Edit ${task.designName}`}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 opacity-80 transition hover:border-violet-200 hover:text-violet-700"
                            onClick={(event) => {
                              event.stopPropagation()
                              openTaskEditor(task)
                            }}
                          >
                            <PencilLine className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
          Ready to cut
        </div>

        <div className="min-h-[110px] rounded-xl border border-dashed border-violet-200 bg-white p-3">
          {readyTasks.length === 0 ? (
            <div className="flex h-[70px] items-center justify-center text-sm text-slate-400">
              All production is assigned to tailors.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {readyTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingTaskId(task.id)}
                  onDragEnd={() => setDraggingTaskId(null)}
                  onClick={() => openTaskEditor(task)}
                  title={`${task.designName} · ${task.clientName} · ${task.estimatedDays} days`}
                  className="group relative w-[190px] cursor-grab overflow-hidden rounded-xl border border-violet-200 bg-violet-50 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-violet-200 bg-white">
                      {task.imageUrl ? (
                        <img src={task.imageUrl} alt={task.designName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-slate-100 text-[10px] font-bold text-violet-700">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-slate-800">{task.designName}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">{task.clientName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                      {task.estimatedDays}d
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${task.designName}`}
                      className="rounded-md border border-violet-200 bg-white p-1 text-violet-600 opacity-80 transition hover:border-violet-300"
                      onClick={(event) => {
                        event.stopPropagation()
                        openTaskEditor(task)
                      }}
                    >
                      <PencilLine className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Task estimate</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">{selectedTask.designName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close task editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-xl bg-violet-50 p-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700">Client</span>
                <span className="mt-1 block text-base font-semibold text-slate-800">{selectedTask.clientName}</span>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Estimated completion days</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editedDays}
                  onChange={(event) => setEditedDays(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-medium text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTaskUpdate}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Save estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
