"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { CalendarDays, Check, ClipboardPaste, Image as ImageIcon, Loader2, PencilLine, Plus, Scissors, Trash2, Undo2, Upload, Users, X } from "lucide-react"

type WorkerRole = "tailor" | "cutting"

type SaveStatus = "loading" | "load-error" | "saving" | "saved" | "save-error"

type Tailor = {
  id: string
  name: string
  accent: string
  role: WorkerRole
}

type StitchingTask = {
  id: string
  designName: string
  clientName: string
  tailorId: string | null
  dateKey: string | null
  // Quarter of the day the task starts in (0–3). Only cutting work starts mid-day.
  startQuarter?: number
  estimatedDays: number
  imageUrl?: string
  autoAssign?: boolean
  quantity?: number
  isCustom?: boolean
  completed?: boolean
}

type CustomOrderDraft = {
  designName: string
  clientName: string
  quantity: string
  estimatedDays: number
  tailorId: string
  dateKey: string
  startQuarter: number
  imageUrl?: string
}

type WorkerDraft = {
  name: string
  role: WorkerRole
}

const TAILOR_COLORS = [
  "#7c3aed",
  "#0f766e",
  "#f59e0b",
  "#ef4444",
  "#2563eb",
  "#db2777",
  "#16a34a",
  "#ea580c",
]

const CUTTING_ACCENT = "#475569"
const CUTTING_COLUMN_WIDTH = 160
const TAILOR_COLUMN_WIDTH = 210

// Every day row is split into quarters so cutting work can be planned in 0.25 day steps.
const SLOTS_PER_DAY = 4
const SLOT_HEIGHT = 24
const MIN_VISIBLE_DAYS = 7
// Empty days shown after the last planned order so there is room to drop more work.
const TRAILING_BUFFER_DAYS = 3
// Past days kept above today so recent work can still be seen by scrolling up.
const MIN_PAST_DAYS = 7
const MAX_PAST_DAYS = 60
// How far ahead auto-assign may look for a free slot.
const PLANNING_HORIZON_DAYS = 90
const MS_PER_DAY = 86_400_000
const UNDO_TIMEOUT_MS = 6000
const SAVE_DEBOUNCE_MS = 800
const PLANNER_API = "/api/production-planner"

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  loading: "Loading…",
  "load-error": "Couldn't load saved plan — changes won't be saved",
  saving: "Saving…",
  saved: "All changes saved",
  "save-error": "Couldn't save — check your connection",
}

const QUARTER_LABELS = ["Start of day", "¼ day in", "½ day in", "¾ day in"]

// Smallest bookable unit per role, in quarter-day slots: tailors work in half days, cutting in quarter days.
const ROLE_SLOT_STEP: Record<WorkerRole, number> = { tailor: 2, cutting: 1 }

const getSlotStep = (role: WorkerRole | null) => (role ? ROLE_SLOT_STEP[role] : 1)

const getStepDays = (role: WorkerRole | null) => getSlotStep(role) / SLOTS_PER_DAY

const getStartOptions = (role: WorkerRole | null) =>
  QUARTER_LABELS.map((label, quarter) => ({ label, quarter })).filter(({ quarter }) => quarter % getSlotStep(role) === 0)

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

const toDayNumber = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number)
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

const fromDayNumber = (dayNumber: number) => new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10)

const initialTailors: Tailor[] = [
  { id: "cutting-1", name: "Cutting Master", accent: CUTTING_ACCENT, role: "cutting" },
  { id: "tailor-1", name: "Tailor A", accent: TAILOR_COLORS[0], role: "tailor" },
  { id: "tailor-2", name: "Tailor B", accent: TAILOR_COLORS[1], role: "tailor" },
  { id: "tailor-3", name: "Tailor C", accent: TAILOR_COLORS[2], role: "tailor" },
  { id: "tailor-4", name: "Tailor D", accent: TAILOR_COLORS[3], role: "tailor" },
  { id: "tailor-5", name: "Tailor E", accent: TAILOR_COLORS[4], role: "tailor" },
]

const getDateRange = (days: number, startKey: string) => {
  const start = new Date(`${startKey}T00:00:00`)
  return Array.from({ length: days }, (_, index) => formatDateKey(addDays(start, index)))
}

// Local testing only: ?today=YYYY-MM-DD makes the board behave as if it were opened on that date.
const getTestTodayOverride = () => {
  if (process.env.NODE_ENV === "production") return null
  const override = new URLSearchParams(window.location.search).get("today")
  return override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : null
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
      tailorId: "tailor-1",
      dateKey: formatDateKey(addDays(today, 0)),
      estimatedDays: 5,
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-4",
      designName: "Leah Dress",
      clientName: "Leah & Co",
      tailorId: "tailor-2",
      dateKey: formatDateKey(addDays(today, 1)),
      estimatedDays: 3,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-5",
      designName: "Mira Blazer",
      clientName: "Mira Atelier",
      tailorId: "tailor-3",
      dateKey: formatDateKey(addDays(today, 2)),
      estimatedDays: 7,
      imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-6",
      designName: "Kaira Suit",
      clientName: "Kaira Label",
      tailorId: "tailor-4",
      dateKey: formatDateKey(addDays(today, 3)),
      estimatedDays: 8,
      imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-7",
      designName: "Leah Dress cutting",
      clientName: "Leah & Co",
      tailorId: "cutting-1",
      dateKey: formatDateKey(addDays(today, 0)),
      startQuarter: 0,
      estimatedDays: 0.25,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
    {
      id: "task-8",
      designName: "Mira Blazer cutting",
      clientName: "Mira Atelier",
      tailorId: "cutting-1",
      dateKey: formatDateKey(addDays(today, 0)),
      startQuarter: 1,
      estimatedDays: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
      autoAssign: true,
    },
  ]
}

// Round a duration up to the worker's step: half days for tailors, quarter days for cutting.
const normalizeDuration = (days: number, role: WorkerRole | null) => {
  const step = getSlotStep(role)
  // The tiny epsilon keeps exact values like 3.5 from being nudged up by floating point error.
  const slots = Math.ceil((Number(days) || 0) * SLOTS_PER_DAY - 1e-9)
  return Math.max(step, Math.ceil(slots / step) * step) / SLOTS_PER_DAY
}

const getTaskSlotCount = (task: Pick<StitchingTask, "estimatedDays">) =>
  Math.max(1, Math.round((Number(task.estimatedDays) || 0) * SLOTS_PER_DAY))

const getTaskStartSlot = (task: Pick<StitchingTask, "dateKey" | "startQuarter">) =>
  toDayNumber(task.dateKey as string) * SLOTS_PER_DAY + (task.startQuarter ?? 0)

const setTaskStartSlot = (task: StitchingTask, slot: number) => {
  task.dateKey = fromDayNumber(Math.floor(slot / SLOTS_PER_DAY))
  task.startQuarter = slot % SLOTS_PER_DAY
}

const getTaskDateSet = (task: Pick<StitchingTask, "dateKey" | "startQuarter" | "estimatedDays">) => {
  if (!task.dateKey) return []

  const firstDay = Math.floor(getTaskStartSlot(task) / SLOTS_PER_DAY)
  const lastDay = Math.floor((getTaskStartSlot(task) + getTaskSlotCount(task) - 1) / SLOTS_PER_DAY)

  return Array.from({ length: lastDay - firstDay + 1 }, (_, index) => fromDayNumber(firstDay + index))
}

const getTailorTimeline = (tasks: StitchingTask[], tailorId: string, excludeTaskId?: string) =>
  tasks
    .filter((task) => task.id !== excludeTaskId && task.tailorId === tailorId && task.dateKey)
    .sort((a, b) => getTaskStartSlot(a) - getTaskStartSlot(b))

const findEarliestFreeSlot = (
  task: StitchingTask,
  tailorId: string,
  tasks: StitchingTask[],
  dateKeys: string[]
) => {
  const slotCount = getTaskSlotCount(task)
  const timeline = getTailorTimeline(tasks, tailorId, task.id)

  for (const dateKey of dateKeys) {
    const candidateStart = toDayNumber(dateKey) * SLOTS_PER_DAY
    const candidateEnd = candidateStart + slotCount
    const conflict = timeline.some((existingTask) => {
      const existingStart = getTaskStartSlot(existingTask)
      return existingStart < candidateEnd && candidateStart < existingStart + getTaskSlotCount(existingTask)
    })

    if (!conflict) return dateKey
  }

  return null
}

// Pull the tasks that followed a removed task earlier to close the gap it leaves behind.
const closeGapInTailorTimeline = (tasks: StitchingTask[], removedTask: StitchingTask) => {
  if (!removedTask.tailorId || !removedTask.dateKey) return

  const removedStart = getTaskStartSlot(removedTask)
  const removedSlots = getTaskSlotCount(removedTask)
  let cursor = removedStart

  for (const task of getTailorTimeline(tasks, removedTask.tailorId, removedTask.id)) {
    const taskStart = getTaskStartSlot(task)
    if (taskStart <= removedStart) continue

    const newStart = Math.max(taskStart - removedSlots, cursor)
    setTaskStartSlot(task, newStart)
    cursor = newStart + getTaskSlotCount(task)
  }
}

// Push every task that overlaps or follows the placed task down so nothing on the worker overlaps.
const pushTailorTimeline = (tasks: StitchingTask[], placedTask: StitchingTask) => {
  if (!placedTask.tailorId || !placedTask.dateKey) return

  const placedStart = getTaskStartSlot(placedTask)
  let cursor = placedStart + getTaskSlotCount(placedTask)

  for (const task of getTailorTimeline(tasks, placedTask.tailorId, placedTask.id)) {
    const taskStart = getTaskStartSlot(task)
    const taskEnd = taskStart + getTaskSlotCount(task)

    // Tasks that finish before the placed task starts stay where they are.
    if (taskEnd <= placedStart) continue

    if (taskStart < cursor) {
      setTaskStartSlot(task, cursor)
      cursor += getTaskSlotCount(task)
    } else {
      cursor = taskEnd
    }
  }
}

const insertTaskIntoTailorTimeline = (
  tasks: StitchingTask[],
  taskId: string,
  tailor: Tailor,
  startDateKey: string,
  startQuarter = 0
) => {
  const next = tasks.map((task) => ({ ...task }))
  const movedTask = next.find((task) => task.id === taskId)
  if (!movedTask) return next

  movedTask.tailorId = tailor.id
  movedTask.dateKey = startDateKey
  const step = getSlotStep(tailor.role)
  movedTask.startQuarter = Math.floor(startQuarter / step) * step
  movedTask.estimatedDays = normalizeDuration(movedTask.estimatedDays, tailor.role)
  movedTask.autoAssign = true

  pushTailorTimeline(next, movedTask)

  return next
}

const autoAssignTasks = (tasks: StitchingTask[], tailors: Tailor[], dateKeys: string[]) => {
  const next = tasks.map((task) => ({ ...task }))
  const stitchingTailors = tailors.filter((tailor) => tailor.role === "tailor")

  for (const task of next) {
    if (task.autoAssign === false || (task.tailorId && task.dateKey)) continue

    let bestOption: { tailorId: string; dateKey: string } | null = null

    for (const tailor of stitchingTailors) {
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
      task.startQuarter = 0
      task.estimatedDays = normalizeDuration(task.estimatedDays, "tailor")
    }
  }

  return next
}

const CompletionToggle = ({ task, onToggle }: { task: StitchingTask; onToggle: () => void }) => (
  <button
    type="button"
    aria-label={task.completed ? `Mark ${task.designName} as not done` : `Mark ${task.designName} as done`}
    title={task.completed ? "Done — click to undo" : "Mark as done"}
    onClick={(event) => {
      event.stopPropagation()
      onToggle()
    }}
    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition ${
      task.completed
        ? "border-emerald-500 bg-emerald-500 text-white"
        : "border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-500"
    }`}
  >
    <Check className="h-3 w-3" strokeWidth={3} />
  </button>
)

const TaskThumbnail = ({ task, className }: { task: StitchingTask; className: string }) => (
  <div
    className={`flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 ${
      task.completed ? "grayscale" : ""
    } ${className}`}
  >
    {task.imageUrl ? (
      <img src={task.imageUrl} alt={task.designName} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-slate-100 text-[10px] font-bold text-violet-700">
        <ImageIcon className="h-3.5 w-3.5" />
      </div>
    )}
  </div>
)

const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch("/api/upload", { method: "POST", body: formData })
  if (!response.ok) throw new Error("Failed to upload image")

  const data = await response.json()
  return data.urls[0] as string
}

const ImagePicker = ({
  imageUrl,
  onChange,
  onUploadingChange,
}: {
  imageUrl?: string
  onChange: (imageUrl: string | undefined) => void
  onUploadingChange: (isUploading: boolean) => void
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    setError(null)
    setIsUploading(true)
    onUploadingChange(true)
    try {
      onChange(await uploadImage(file))
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
      onUploadingChange(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  // ⌘V / Ctrl+V anywhere while the picker is open uploads a copied image. Text pastes are left alone.
  const handleFileRef = useRef(handleFile)
  handleFileRef.current = handleFile

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageFile = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"))
      if (!imageFile) return

      event.preventDefault()
      handleFileRef.current(imageFile)
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [])

  // The Paste button reads the clipboard directly, which is the only way to paste on phones.
  const pasteFromClipboard = async () => {
    setError(null)
    try {
      for (const item of await navigator.clipboard.read()) {
        const imageType = item.types.find((type) => type.startsWith("image/"))
        if (imageType) {
          const blob = await item.getType(imageType)
          await handleFile(new File([blob], `pasted-image.${imageType.split("/")[1]}`, { type: imageType }))
          return
        }
      }
      setError("No image found on the clipboard. Copy an image first.")
    } catch {
      setError("Couldn't read the clipboard. Try ⌘V / Ctrl+V instead.")
    }
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-slate-700">Image</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          ) : imageUrl ? (
            <img src={imageUrl} alt="Order" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {imageUrl ? "Change image" : "Add image"}
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={pasteFromClipboard}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste
          </button>
          {imageUrl && !isUploading && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">Tip: copy an image and press ⌘V / Ctrl+V to paste it here.</p>
      )}
    </div>
  )
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-medium text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"

export function ProductionStitchingBoard() {
  const [tailors, setTailors] = useState<Tailor[]>(initialTailors)
  const [tasks, setTasks] = useState<StitchingTask[]>(() => initialTasks())
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<StitchingTask | null>(null)
  const [editedDays, setEditedDays] = useState(1)
  const [editedImageUrl, setEditedImageUrl] = useState<string | undefined>(undefined)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [customOrderDraft, setCustomOrderDraft] = useState<CustomOrderDraft | null>(null)
  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [workerDraft, setWorkerDraft] = useState<WorkerDraft>({ name: "", role: "tailor" })
  const [isTrashActive, setIsTrashActive] = useState(false)
  const [lastRemoval, setLastRemoval] = useState<{ designName: string; previousTasks: StitchingTask[] } | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading")
  const [todayKey, setTodayKey] = useState(() => formatDateKey(new Date()))
  const [isTestDate, setIsTestDate] = useState(false)

  // Read in an effect so the server and first client render agree on the date.
  useEffect(() => {
    const override = getTestTodayOverride()
    if (override) {
      setTodayKey(override)
      setIsTestDate(true)
    }
  }, [])
  // Saving only starts once the stored plan has loaded, so a failed load never overwrites it with seed data.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    fetch(PLANNER_API)
      .then(async (response) => {
        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data.tailors)) setTailors(data.tailors)
          if (Array.isArray(data.tasks)) setTasks(data.tasks)
        } else if (response.status !== 404) {
          throw new Error(`Failed to load planner (${response.status})`)
        }
        hasLoadedRef.current = true
        setSaveStatus("saved")
      })
      .catch(() => {
        if (!cancelled) setSaveStatus("load-error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedRef.current) return

    setSaveStatus("saving")
    const timeout = setTimeout(() => {
      fetch(PLANNER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailors, tasks }),
      })
        .then((response) => setSaveStatus(response.ok ? "saved" : "save-error"))
        .catch(() => setSaveStatus("save-error"))
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [tailors, tasks])

  const planningDateKeys = useMemo(() => getDateRange(PLANNING_HORIZON_DAYS, todayKey), [todayKey])

  // Cover past work (scroll up) through the last planned day (scroll down); the board opens scrolled to today.
  const dateKeys = useMemo(() => {
    const todayNumber = toDayNumber(todayKey)
    let firstDay = todayNumber - MIN_PAST_DAYS
    let lastDay = todayNumber + MIN_VISIBLE_DAYS - 1

    for (const task of tasks) {
      if (!task.dateKey) continue
      const startSlot = getTaskStartSlot(task)
      firstDay = Math.min(firstDay, Math.floor(startSlot / SLOTS_PER_DAY))
      lastDay = Math.max(lastDay, Math.floor((startSlot + getTaskSlotCount(task) - 1) / SLOTS_PER_DAY) + TRAILING_BUFFER_DAYS)
    }

    firstDay = Math.max(firstDay, todayNumber - MAX_PAST_DAYS)
    return getDateRange(lastDay - firstDay + 1, fromDayNumber(firstDay))
  }, [tasks, todayKey])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const boardHeaderRef = useRef<HTMLDivElement>(null)
  const todayRowRef = useRef<HTMLDivElement>(null)
  const scrolledToDayRef = useRef<string | null>(null)

  useEffect(() => {
    if (saveStatus === "loading" || scrolledToDayRef.current === todayKey) return

    const container = scrollContainerRef.current
    const todayRow = todayRowRef.current
    if (!container || !todayRow) return

    const headerHeight = (boardHeaderRef.current?.offsetHeight ?? 0) + 8
    container.scrollTop += todayRow.getBoundingClientRect().top - container.getBoundingClientRect().top - headerHeight
    scrolledToDayRef.current = todayKey
  }, [saveStatus, todayKey, dateKeys])

  useEffect(() => {
    setTasks((current) => autoAssignTasks(current, tailors, planningDateKeys))
  }, [tailors, planningDateKeys])

  useEffect(() => {
    if (!lastRemoval) return
    const timeout = setTimeout(() => setLastRemoval(null), UNDO_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [lastRemoval])

  const readyTasks = useMemo(
    () => tasks.filter((task) => !task.tailorId && !task.dateKey && task.autoAssign === false),
    [tasks]
  )

  const visibleStartSlot = toDayNumber(dateKeys[0]) * SLOTS_PER_DAY
  const visibleEndSlot = visibleStartSlot + dateKeys.length * SLOTS_PER_DAY

  const columnWidths = tailors.map((tailor) => (tailor.role === "cutting" ? CUTTING_COLUMN_WIDTH : TAILOR_COLUMN_WIDTH))

  const getTailorRole = (tailorId: string | null) => tailors.find((tailor) => tailor.id === tailorId)?.role ?? null

  const moveTask = (taskId: string, tailor: Tailor, dateKey: string, startQuarter = 0) => {
    setTasks((current) => insertTaskIntoTailorTimeline(current, taskId, tailor, dateKey, startQuarter))
  }

  // Quarter-day slot of the tile that was grabbed, so the tile lands where it is drawn, not where the pointer is.
  const grabSlotOffsetRef = useRef(0)

  const startDrag = (event: DragEvent, taskId: string, fromBoard = false) => {
    const tileTop = event.currentTarget.getBoundingClientRect().top
    grabSlotOffsetRef.current = fromBoard ? Math.max(0, Math.floor((event.clientY - tileTop) / SLOT_HEIGHT)) : 0
    event.dataTransfer.setData("text/plain", taskId)
    event.dataTransfer.effectAllowed = "move"
    // Defer so the browser captures the drag image before tiles stop receiving pointer events.
    setTimeout(() => setDraggingTaskId(taskId), 0)
  }

  const endDrag = () => {
    setDraggingTaskId(null)
    setDropTarget(null)
    setIsTrashActive(false)
  }

  const dropZoneProps = (tailor: Tailor, dateKey: string, startQuarter: number) => {
    const targetId = `${tailor.id}-${dateKey}-${startQuarter}`

    return {
      onDragOver: (event: DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
        setDropTarget(targetId)
      },
      onDragLeave: () => setDropTarget((current) => (current === targetId ? null : current)),
      onDrop: (event: DragEvent) => {
        event.preventDefault()
        const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId
        if (taskId) {
          const step = getSlotStep(tailor.role)
          // Which quarter of this drop zone the pointer is over, then back up to where the tile's top edge is.
          const zoneTop = event.currentTarget.getBoundingClientRect().top
          const slotInZone = Math.min(step - 1, Math.max(0, Math.floor((event.clientY - zoneTop) / SLOT_HEIGHT)))
          const tileTopSlot = toDayNumber(dateKey) * SLOTS_PER_DAY + startQuarter + slotInZone - grabSlotOffsetRef.current
          const startSlot = Math.round(tileTopSlot / step) * step
          moveTask(taskId, tailor, fromDayNumber(Math.floor(startSlot / SLOTS_PER_DAY)), startSlot % SLOTS_PER_DAY)
        }
        endDrag()
      },
      isActive: dropTarget === targetId,
    }
  }

  const openTaskEditor = (task: StitchingTask) => {
    setSelectedTask(task)
    setEditedDays(task.estimatedDays)
    setEditedImageUrl(task.imageUrl)
  }

  const saveTaskUpdate = () => {
    if (!selectedTask) return

    setTasks((current) => {
      const updated = current.map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              estimatedDays: normalizeDuration(editedDays, getTailorRole(task.tailorId)),
              imageUrl: editedImageUrl,
              autoAssign: task.tailorId ? true : task.autoAssign,
            }
          : task
      )

      const updatedTask = updated.find((task) => task.id === selectedTask.id)
      if (updatedTask?.tailorId && updatedTask.dateKey) {
        pushTailorTimeline(updated, updatedTask)
        return updated
      }

      return autoAssignTasks(updated, tailors, planningDateKeys)
    })
    setSelectedTask(null)
  }

  const openCustomOrderForm = () => {
    setCustomOrderDraft({
      designName: "",
      clientName: "",
      quantity: "",
      estimatedDays: 1,
      tailorId: "",
      dateKey: todayKey,
      startQuarter: 0,
    })
  }

  const saveCustomOrder = () => {
    if (!customOrderDraft || !customOrderDraft.designName.trim()) return

    const targetTailor = tailors.find((tailor) => tailor.id === customOrderDraft.tailorId)
    const quantity = Number(customOrderDraft.quantity)
    const newTask: StitchingTask = {
      id: `custom-${Date.now()}`,
      designName: customOrderDraft.designName.trim(),
      clientName: customOrderDraft.clientName.trim() || "Custom order",
      quantity: quantity > 0 ? quantity : undefined,
      tailorId: null,
      dateKey: null,
      estimatedDays: normalizeDuration(customOrderDraft.estimatedDays, targetTailor?.role ?? null),
      autoAssign: false,
      isCustom: true,
      imageUrl: customOrderDraft.imageUrl,
    }

    setTasks((current) => {
      const withNewTask = [...current, newTask]
      if (!targetTailor || !customOrderDraft.dateKey) return withNewTask

      // Slot the order in on the chosen day and push that worker's later work down.
      return insertTaskIntoTailorTimeline(
        withNewTask,
        newTask.id,
        targetTailor,
        customOrderDraft.dateKey,
        customOrderDraft.startQuarter
      )
    })
    setCustomOrderDraft(null)
  }

  const toggleTaskCompleted = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    )
  }

  const removeTask = (taskId: string) => {
    const removedTask = tasks.find((task) => task.id === taskId)
    if (removedTask) setLastRemoval({ designName: removedTask.designName, previousTasks: tasks })

    setTasks((current) => {
      const next = current.map((task) => ({ ...task }))
      const removedTask = next.find((task) => task.id === taskId)
      if (removedTask) closeGapInTailorTimeline(next, removedTask)
      return next.filter((task) => task.id !== taskId)
    })
    setSelectedTask(null)
  }

  const undoRemoval = () => {
    if (!lastRemoval) return
    setTasks(lastRemoval.previousTasks)
    setLastRemoval(null)
  }

  const addWorker = () => {
    const name = workerDraft.name.trim()
    if (!name) return

    setTailors((current) => [
      ...current,
      {
        id: `${workerDraft.role}-${Date.now()}`,
        name,
        role: workerDraft.role,
        accent:
          workerDraft.role === "cutting"
            ? CUTTING_ACCENT
            : TAILOR_COLORS[current.filter((tailor) => tailor.role === "tailor").length % TAILOR_COLORS.length],
      },
    ])
    setWorkerDraft({ name: "", role: workerDraft.role })
  }

  const removeWorker = (tailor: Tailor) => {
    const assignedCount = taskCountForTailor(tailor.id)
    if (
      assignedCount > 0 &&
      !window.confirm(`${tailor.name} has ${assignedCount} order(s). Remove them and move their orders to Ready to cut?`)
    ) {
      return
    }

    // Orders of a removed worker go back to the Ready to cut tray to be planned again.
    setTasks((current) =>
      current.map((task) =>
        task.tailorId === tailor.id
          ? { ...task, tailorId: null, dateKey: null, startQuarter: undefined, autoAssign: false }
          : task
      )
    )
    setTailors((current) => current.filter((entry) => entry.id !== tailor.id))
  }

  // Counts open work only; finished orders stay on the board greyed out.
  const taskCountForTailor = (tailorId: string) =>
    tasks.filter((task) => task.tailorId === tailorId && !task.completed).length

  const selectedTaskRole = selectedTask ? getTailorRole(selectedTask.tailorId) : null
  const customOrderRole = customOrderDraft ? getTailorRole(customOrderDraft.tailorId || null) : null

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
        <div className="flex flex-wrap items-center gap-2">
          {isTestDate && (
            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              Test date: {formatDateLabel(todayKey)}
            </span>
          )}
          <span
            className={`text-xs font-medium ${
              saveStatus === "load-error" || saveStatus === "save-error" ? "text-red-600" : "text-slate-400"
            }`}
          >
            {SAVE_STATUS_LABELS[saveStatus]}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
            <CalendarDays className="h-4 w-4" />
            Today {formatDateLabel(todayKey)} · planned until {formatDateLabel(dateKeys[dateKeys.length - 1])}
          </div>
          <button
            type="button"
            onClick={() => setIsTeamOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <Users className="h-4 w-4" />
            Manage team
          </button>
          <button
            type="button"
            onClick={openCustomOrderForm}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add custom order
          </button>
        </div>
      </div>

      {saveStatus === "loading" && (
        <div className="py-10 text-center text-sm text-slate-400">Loading planner…</div>
      )}

      {/* Hidden until the saved plan arrives so the seed data never flashes on screen. */}
      <div
        ref={scrollContainerRef}
        className={`max-h-[70vh] overflow-auto rounded-xl pb-3 ${saveStatus === "loading" ? "hidden" : ""}`}
      >
        <div style={{ minWidth: 120 + columnWidths.reduce((total, width) => total + width + 8, 0) }}>
          <div
            className="grid gap-x-2"
            style={{
              gridTemplateColumns: `120px ${columnWidths.map((width) => `minmax(${width}px, ${width === CUTTING_COLUMN_WIDTH ? 0.7 : 1}fr)`).join(" ")}`,
              gridTemplateRows: `auto repeat(${dateKeys.length * SLOTS_PER_DAY}, ${SLOT_HEIGHT}px)`,
            }}
          >
            <div ref={boardHeaderRef} className="sticky left-0 top-0 z-30 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Date
            </div>

            {tailors.map((tailor) => (
              <div
                key={tailor.id}
                className="sticky top-0 z-20 mb-2 flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-800 shadow-sm"
                style={{ borderLeft: `4px solid ${tailor.accent}` }}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{tailor.name}</span>
                  {tailor.role === "cutting" && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Cutting</span>
                  )}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {taskCountForTailor(tailor.id)}
                </span>
              </div>
            ))}

            {dateKeys.map((dateKey, dayIndex) => {
              const isToday = dateKey === todayKey
              const isPast = dateKey < todayKey

              return (
                <div
                  key={dateKey}
                  ref={isToday ? todayRowRef : undefined}
                  className={`sticky left-0 z-20 my-1 flex flex-col justify-center rounded-xl border px-3 text-sm font-medium ${
                    isToday
                      ? "border-violet-300 bg-violet-100 text-violet-800"
                      : isPast
                        ? "border-slate-200 bg-slate-100 text-slate-400"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                  style={{ gridColumn: 1, gridRow: `${dayIndex * SLOTS_PER_DAY + 2} / span ${SLOTS_PER_DAY}` }}
                >
                  {formatDateLabel(dateKey)}
                  {isToday && <span className="text-[10px] font-semibold uppercase tracking-wide">Today</span>}
                </div>
              )
            })}

            {tailors.map((tailor, columnIndex) =>
              dateKeys.map((dateKey, dayIndex) => {
                const dayRow = dayIndex * SLOTS_PER_DAY + 2

                // One drop zone per bookable step: half days for tailors, quarter days for cutting.
                return (
                  <div
                    key={`${tailor.id}-${dateKey}`}
                    className="my-1 flex flex-col overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50/60"
                    style={{ gridColumn: columnIndex + 2, gridRow: `${dayRow} / span ${SLOTS_PER_DAY}` }}
                  >
                    {getStartOptions(tailor.role).map(({ label, quarter }) => {
                      const { isActive, ...handlers } = dropZoneProps(tailor, dateKey, quarter)
                      return (
                        <div
                          key={label}
                          title={label}
                          className={`flex-1 transition-colors ${quarter > 0 ? "border-t border-dotted border-slate-200" : ""} ${
                            isActive ? "bg-violet-100" : ""
                          }`}
                          {...handlers}
                        />
                      )
                    })}
                  </div>
                )
              })
            )}

            {tailors.map((tailor, columnIndex) =>
              tasks.map((task) => {
                if (task.tailorId !== tailor.id || !task.dateKey) return null

                // Clip the task to the visible range so it lines up with the date rows.
                const startSlot = getTaskStartSlot(task)
                const clippedStart = Math.max(startSlot, visibleStartSlot)
                const clippedEnd = Math.min(startSlot + getTaskSlotCount(task), visibleEndSlot)
                if (clippedEnd <= clippedStart) return null

                const taskDates = getTaskDateSet(task)
                // Cutting work and half-day tailor work are too short for the full card, so they get a single row.
                const isCompact = tailor.role === "cutting" || clippedEnd - clippedStart <= 2
                const quantityLabel = task.quantity ? ` · ${task.quantity} pcs` : ""

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => startDrag(event, task.id, true)}
                    onDragEnd={endDrag}
                    onClick={() => openTaskEditor(task)}
                    title={`${task.designName} · ${task.clientName}${quantityLabel} · ${task.estimatedDays} days`}
                    className={`group relative z-10 cursor-grab overflow-hidden border border-slate-200 shadow-sm transition duration-200 hover:shadow-md active:cursor-grabbing ${
                      task.completed ? "bg-slate-100" : "bg-white"
                    } ${
                      isCompact ? "flex items-center gap-1.5 rounded-lg p-0.5 pr-1.5" : "m-1 flex flex-col justify-between rounded-xl"
                    }`}
                    style={{
                      gridColumn: columnIndex + 2,
                      gridRow: `${clippedStart - visibleStartSlot + 2} / span ${clippedEnd - clippedStart}`,
                      margin: isCompact ? "2px 6px" : undefined,
                      padding: isCompact ? undefined : "6px 8px",
                      borderLeft: `4px solid ${task.completed ? "#cbd5e1" : tailor.accent}`,
                      // Let drops fall through to the day cell underneath while dragging.
                      pointerEvents: draggingTaskId ? "none" : "auto",
                      opacity: draggingTaskId === task.id ? 0.4 : 1,
                    }}
                  >
                    {isCompact ? (
                      <>
                        <TaskThumbnail task={task} className="aspect-square h-full max-h-10" />
                        <span
                          className={`block min-w-0 flex-1 truncate text-[10px] font-semibold ${
                            task.completed ? "text-slate-400 line-through" : "text-slate-700"
                          }`}
                        >
                          {task.designName}
                        </span>
                        <CompletionToggle task={task} onToggle={() => toggleTaskCompleted(task.id)} />
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <TaskThumbnail task={task} className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-[10px] font-bold ${
                                task.completed ? "text-slate-400 line-through" : "text-slate-800"
                              }`}
                            >
                              {task.designName}
                            </p>
                            <p className="mt-0.5 truncate text-[9px] text-slate-500">
                              {task.clientName}
                              {quantityLabel}
                            </p>
                          </div>
                          <CompletionToggle task={task} onToggle={() => toggleTaskCompleted(task.id)} />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[8px] font-medium text-slate-400">
                            {formatDateLabel(taskDates[0])}
                            {taskDates.length > 1 ? ` – ${formatDateLabel(taskDates[taskDates.length - 1])}` : ""}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-600">
                              {task.estimatedDays}d
                            </span>
                            <button
                              type="button"
                              aria-label={`Edit ${task.designName}`}
                              className="rounded-md border border-slate-200 bg-white p-0.5 text-slate-500 opacity-80 transition hover:border-violet-200 hover:text-violet-700"
                              onClick={(event) => {
                                event.stopPropagation()
                                openTaskEditor(task)
                              }}
                            >
                              <PencilLine className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className={`mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 ${saveStatus === "loading" ? "hidden" : ""}`}>
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
                  onDragStart={(event) => startDrag(event, task.id)}
                  onDragEnd={endDrag}
                  onClick={() => openTaskEditor(task)}
                  title={`${task.designName} · ${task.clientName} · ${task.estimatedDays} days`}
                  className="group relative w-[190px] cursor-grab overflow-hidden rounded-xl border border-violet-200 bg-violet-50 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <TaskThumbnail task={task} className="h-10 w-10 border-violet-200 bg-white" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-slate-800">{task.designName}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {task.clientName}
                        {task.quantity ? ` · ${task.quantity} pcs` : ""}
                      </p>
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

      {draggingTaskId && (
        <div
          className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-dashed px-8 py-5 text-sm font-semibold shadow-2xl transition ${
            isTrashActive ? "scale-110 border-red-500 bg-red-50 text-red-600" : "border-red-300 bg-white text-red-500"
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
            setIsTrashActive(true)
          }}
          onDragLeave={() => setIsTrashActive(false)}
          onDrop={(event) => {
            event.preventDefault()
            const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId
            if (taskId) removeTask(taskId)
            endDrag()
          }}
        >
          <Trash2 className="h-6 w-6" />
          Drop here to delete order
        </div>
      )}

      {lastRemoval && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          <span>
            Deleted <strong>{lastRemoval.designName}</strong>
          </span>
          <button
            type="button"
            onClick={undoRemoval}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/20"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
        </div>
      )}

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
                <span className="mt-1 block truncate text-base font-semibold text-slate-800">
                  {selectedTask.clientName}
                  {selectedTask.quantity ? ` · ${selectedTask.quantity} pcs` : ""}
                </span>
              </div>

              {selectedTask.tailorId && (
                <button
                  type="button"
                  onClick={() => {
                    toggleTaskCompleted(selectedTask.id)
                    setSelectedTask({ ...selectedTask, completed: !selectedTask.completed })
                  }}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    selectedTask.completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                  {selectedTask.completed ? "Done — click to mark as not done" : "Mark as done"}
                </button>
              )}

              <ImagePicker
                imageUrl={editedImageUrl}
                onChange={setEditedImageUrl}
                onUploadingChange={setIsImageUploading}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Estimated completion days</span>
                <input
                  type="number"
                  min={getStepDays(selectedTaskRole)}
                  step={getStepDays(selectedTaskRole)}
                  max={30}
                  value={editedDays}
                  onChange={(event) => setEditedDays(Number(event.target.value))}
                  className={inputClassName}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {selectedTaskRole === "tailor" ? "Tailors are planned in 0.5 day steps." : "Can be planned in 0.25 day steps."}
                </span>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => removeTask(selectedTask.id)}
                className="mr-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove order
              </button>
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
                disabled={isImageUploading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {customOrderDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault()
              saveCustomOrder()
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">New order</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">Add custom order</h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomOrderDraft(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close custom order form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Item name</span>
                <input
                  autoFocus
                  required
                  placeholder="e.g. Tavi pant"
                  value={customOrderDraft.designName}
                  onChange={(event) => setCustomOrderDraft({ ...customOrderDraft, designName: event.target.value })}
                  className={inputClassName}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Quantity (pcs)</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 20"
                    value={customOrderDraft.quantity}
                    onChange={(event) => setCustomOrderDraft({ ...customOrderDraft, quantity: event.target.value })}
                    className={inputClassName}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Estimated days</span>
                  <input
                    type="number"
                    min={getStepDays(customOrderRole)}
                    step={getStepDays(customOrderRole)}
                    max={30}
                    value={customOrderDraft.estimatedDays}
                    onChange={(event) =>
                      setCustomOrderDraft({ ...customOrderDraft, estimatedDays: Number(event.target.value) })
                    }
                    className={inputClassName}
                  />
                </label>
              </div>

              <ImagePicker
                imageUrl={customOrderDraft.imageUrl}
                onChange={(imageUrl) => setCustomOrderDraft((draft) => (draft ? { ...draft, imageUrl } : draft))}
                onUploadingChange={setIsImageUploading}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Client / order (optional)</span>
                <input
                  placeholder="Custom order"
                  value={customOrderDraft.clientName}
                  onChange={(event) => setCustomOrderDraft({ ...customOrderDraft, clientName: event.target.value })}
                  className={inputClassName}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Assign to</span>
                  <select
                    value={customOrderDraft.tailorId}
                    onChange={(event) => setCustomOrderDraft({ ...customOrderDraft, tailorId: event.target.value })}
                    className={inputClassName}
                  >
                    <option value="">Ready to cut</option>
                    {tailors.map((tailor) => (
                      <option key={tailor.id} value={tailor.id}>
                        {tailor.name}
                        {tailor.role === "cutting" ? " (cutting)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Start date</span>
                  <input
                    type="date"
                    min={todayKey}
                    disabled={!customOrderDraft.tailorId}
                    value={customOrderDraft.dateKey}
                    onChange={(event) => setCustomOrderDraft({ ...customOrderDraft, dateKey: event.target.value })}
                    className={`${inputClassName} disabled:opacity-50`}
                  />
                </label>
              </div>

              {customOrderRole && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Start time</span>
                  <select
                    value={customOrderDraft.startQuarter}
                    onChange={(event) =>
                      setCustomOrderDraft({ ...customOrderDraft, startQuarter: Number(event.target.value) })
                    }
                    className={inputClassName}
                  >
                    {getStartOptions(customOrderRole).map(({ label, quarter }) => (
                      <option key={label} value={quarter}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <p className="text-xs text-slate-500">
                {customOrderDraft.tailorId
                  ? "The order starts at this point and the later orders of that person move down to make room."
                  : "The order goes to Ready to cut, so you can drag it onto anyone's timeline."}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomOrderDraft(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isImageUploading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                Add order
              </button>
            </div>
          </form>
        </div>
      )}

      {isTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Production team</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">Manage team</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close team manager"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-[40vh] space-y-2 overflow-y-auto">
              {tailors.length === 0 && <li className="py-4 text-center text-sm text-slate-400">No one in the team yet.</li>}
              {tailors.map((tailor) => (
                <li
                  key={tailor.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  style={{ borderLeft: `4px solid ${tailor.accent}` }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{tailor.name}</p>
                    <p className="text-xs text-slate-500">
                      {tailor.role === "cutting" ? "Cutting master" : "Tailor"} · {taskCountForTailor(tailor.id)} order(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWorker(tailor)}
                    aria-label={`Remove ${tailor.name}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 space-y-3 border-t border-slate-100 pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                addWorker()
              }}
            >
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input
                  required
                  placeholder="Name"
                  value={workerDraft.name}
                  onChange={(event) => setWorkerDraft({ ...workerDraft, name: event.target.value })}
                  className={inputClassName}
                />
                <select
                  value={workerDraft.role}
                  onChange={(event) => setWorkerDraft({ ...workerDraft, role: event.target.value as WorkerRole })}
                  className={inputClassName}
                >
                  <option value="tailor">Tailor</option>
                  <option value="cutting">Cutting master</option>
                </select>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Add to team
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
