"use client"

import { useMemo, useState } from "react"
import { CalendarDays, GripVertical, Image as ImageIcon, PencilLine, Plus, Scissors, Trash2, X } from "lucide-react"

type Tailor = {
  id: string
  name: string
  accent: string
}

type StitchingTask = {
  id: string
  designName: string
  clientName: string
  tailorId: string
  dateKey: string
  estimatedDays: number
  imageUrl?: string
}

const TAILOR_COLORS = [
  "#7c3aed",
  "#0f766e",
  "#f59e0b",
  "#ef4444",
  "#2563eb",
  "#a855f7",
  "#14b8a6",
  "#f97316",
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

const initialTasks = (tailors: Tailor[]): StitchingTask[] => {
  const today = new Date()
  return [
    {
      id: "task-1",
      designName: "Aisha Kurta",
      clientName: "Aisha Boutique",
      tailorId: tailors[0].id,
      dateKey: formatDateKey(addDays(today, 1)),
      estimatedDays: 4,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "task-2",
      designName: "Nora Co-ord",
      clientName: "Nora Studio",
      tailorId: tailors[1].id,
      dateKey: formatDateKey(addDays(today, 2)),
      estimatedDays: 6,
      imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "task-3",
      designName: "Zara Set",
      clientName: "Zara House",
      tailorId: tailors[2].id,
      dateKey: formatDateKey(addDays(today, 3)),
      estimatedDays: 5,
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "task-4",
      designName: "Leah Dress",
      clientName: "Leah & Co",
      tailorId: tailors[3].id,
      dateKey: formatDateKey(addDays(today, 1)),
      estimatedDays: 3,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "task-5",
      designName: "Mira Blazer",
      clientName: "Mira Atelier",
      tailorId: tailors[4].id,
      dateKey: formatDateKey(addDays(today, 4)),
      estimatedDays: 7,
      imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "task-6",
      designName: "Kaira Suit",
      clientName: "Kaira Label",
      tailorId: tailors[0].id,
      dateKey: formatDateKey(addDays(today, 5)),
      estimatedDays: 8,
      imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
    },
  ]
}

export function ProductionStitchingBoard() {
  const [tailors, setTailors] = useState<Tailor[]>(initialTailors)
  const [tasks, setTasks] = useState<StitchingTask[]>(() => initialTasks(initialTailors))
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [newTailorName, setNewTailorName] = useState("")
  const [selectedTask, setSelectedTask] = useState<StitchingTask | null>(null)
  const [editedDays, setEditedDays] = useState(1)

  const dateKeys = useMemo(() => {
    const dates = Array.from(new Set(tasks.map((task) => task.dateKey)))
    return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }, [tasks])

  const moveTask = (taskId: string, tailorId: string, dateKey: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              tailorId,
              dateKey,
            }
          : task
      )
    )
  }

  const assignNewTailor = () => {
    const name = newTailorName.trim()
    if (!name) return

    const id = `tailor-${Date.now()}`
    setTailors((current) => [
      ...current,
      {
        id,
        name,
        accent: TAILOR_COLORS[current.length % TAILOR_COLORS.length],
      },
    ])
    setNewTailorName("")
  }

  const removeTailor = (tailorId: string) => {
    const replacementTailorId = tailors.find((tailor) => tailor.id !== tailorId)?.id

    setTailors((current) => current.filter((tailor) => tailor.id !== tailorId))
    setTasks((current) =>
      current.map((task) =>
        task.tailorId === tailorId ? { ...task, tailorId: replacementTailorId ?? task.tailorId } : task
      )
    )
  }

  const openTaskEditor = (task: StitchingTask) => {
    setSelectedTask(task)
    setEditedDays(task.estimatedDays)
  }

  const saveTaskUpdate = () => {
    if (!selectedTask) return

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id
          ? { ...task, estimatedDays: Math.max(1, Number(editedDays) || 1) }
          : task
      )
    )
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
          <h2 className="text-2xl font-bold text-slate-800">Tailor workload planner</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
          <CalendarDays className="h-4 w-4" />
          Date-based planning board
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[120px_repeat(5,minmax(190px,1fr))] gap-2">
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

            {dateKeys.map((dateKey) => (
              <div key={dateKey} className="contents">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600">
                  {formatDateLabel(dateKey)}
                </div>
                {tailors.map((tailor) => {
                  const tailoredTasks = tasks.filter(
                    (task) => task.tailorId === tailor.id && task.dateKey === dateKey
                  )

                  return (
                    <div
                      key={`${tailor.id}-${dateKey}`}
                      className="min-h-[110px] rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-2 transition-colors hover:border-violet-300 hover:bg-violet-50/40"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggingTaskId) {
                          moveTask(draggingTaskId, tailor.id, dateKey)
                          setDraggingTaskId(null)
                        }
                      }}
                    >
                      <div className="flex min-h-[90px] flex-col gap-2">
                        {tailoredTasks.length === 0 && (
                          <div className="flex h-full min-h-[70px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] font-medium text-slate-400">
                            Drop order here
                          </div>
                        )}

                        {tailoredTasks.map((task) => {
                          const tileHeight = Math.max(96, 72 + task.estimatedDays * 10)

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => openTaskEditor(task)}
                              className="group relative cursor-grab overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                              style={{
                                height: `${tileHeight}px`,
                                borderLeft: `4px solid ${tailor.accent}`,
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
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
                                    <p className="truncate text-xs font-bold text-slate-800">{task.designName}</p>
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                      <GripVertical className="h-3.5 w-3.5" />
                                    </span>
                                  </div>
                                  <p className="mt-1 truncate text-[11px] text-slate-500">{task.clientName}</p>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  {task.estimatedDays} days
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
                                  <PencilLine className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
          <Plus className="h-4 w-4" />
          Tailor management
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newTailorName}
            onChange={(event) => setNewTailorName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") assignNewTailor()
            }}
            placeholder="Add a new tailor"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={assignNewTailor}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Add tailor
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tailors.map((tailor) => (
            <div
              key={tailor.id}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tailor.accent }} />
              <span>{tailor.name}</span>
              {tailors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTailor(tailor.id)}
                  className="ml-1 rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${tailor.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
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
