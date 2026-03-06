"use client"

import { useState, useEffect, useRef } from "react"
import Gantt from "frappe-gantt"
import { supabase, type Design, type DesignType } from "@/lib/supabase"
import { formatDisplayDate, calculateDaysBetween } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Edit2, AlertCircle } from "lucide-react"

type DesignWithClient = Design & {
  client_name?: string
}

type GanttTask = {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies: string
  custom_class: string
  design: DesignWithClient
}

export function TimelineGanttView() {
  const [designs, setDesigns] = useState<DesignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week")
  const [editingDesign, setEditingDesign] = useState<DesignWithClient | null>(null)
  const [newStartDate, setNewStartDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")
  const ganttContainer = useRef<HTMLDivElement>(null)
  const ganttInstance = useRef<any>(null)

  useEffect(() => {
    fetchDesigns()
  }, [])

  useEffect(() => {
    if (designs.length > 0 && ganttContainer.current) {
      renderGanttChart()
    }
  }, [designs, viewMode])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("designs")
        .select("*, clients(name)")
        .not("start_date", "is", null)
        .not("end_date", "is", null)
        .order("start_date", { ascending: true })

      if (error) throw error

      const designsWithClients: DesignWithClient[] = (data || []).map((design: any) => ({
        ...design,
        client_name: design.clients?.name || "Unknown Client",
      }))

      setDesigns(designsWithClients)
    } catch (error) {
      console.error("Error fetching designs:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderGanttChart = () => {
    if (!ganttContainer.current || designs.length === 0) return

    // Clear previous instance
    if (ganttInstance.current) {
      ganttContainer.current.innerHTML = ""
    }

    const tasks: GanttTask[] = designs.map((design) => {
      // Calculate progress based on current stage
      const stageOrder = [
        "Payment Received",
        "Fabric Finalize",
        "Pattern",
        "Grading",
        "Cutting",
        "Stitching",
        "Dye",
        "Print",
        "Embroidery",
        "Wash",
        "Kaaj",
        "Finishing",
        "Photoshoot",
        "Final Settlement",
        "Dispatch"
      ]
      const currentStageIndex = stageOrder.indexOf(design.status)
      const progress = currentStageIndex >= 0 ? ((currentStageIndex + 1) / stageOrder.length) * 100 : 0

      return {
        id: design.id,
        name: `${design.client_name} - ${design.title}`,
        start: design.start_date!,
        end: design.end_date!,
        progress: progress,
        dependencies: "",
        custom_class: design.type === "Sampling" ? "gantt-sampling" : "gantt-production",
        design: design,
      }
    })

    try {
      ganttInstance.current = new Gantt(ganttContainer.current, tasks, {
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        language: "en",
        header_height: 50,
        column_width: viewMode === "Day" ? 30 : viewMode === "Week" ? 100 : 200,
        step: 24,
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_modes: ["Day", "Week", "Month"],
        popup_trigger: "hover",
        custom_popup_html: function (task: any) {
          const design = task.design
          const totalDays = calculateDaysBetween(design.start_date!, design.end_date!)
          const stageOrder = [
            "Payment Received",
            "Fabric Finalize",
            "Pattern",
            "Grading",
            "Cutting",
            "Stitching",
            "Dye",
            "Print",
            "Embroidery",
            "Wash",
            "Kaaj",
            "Finishing",
            "Photoshoot",
            "Final Settlement",
            "Dispatch"
          ]
          const currentStageIndex = stageOrder.indexOf(design.status)
          const daysSinceStart = calculateDaysBetween(design.start_date!, new Date().toISOString().split("T")[0])
          
          return `
            <div class="gantt-tooltip">
              <div class="tooltip-header">
                <strong>${design.client_name}</strong>
              </div>
              <div class="tooltip-content">
                <p><strong>Design:</strong> ${design.title}</p>
                <p><strong>Type:</strong> <span class="badge-${design.type.toLowerCase()}">${design.type}</span></p>
                <p><strong>Quantity:</strong> ${design.quantity} units</p>
                <p><strong>Current Stage:</strong> ${design.status}</p>
                <p><strong>Progress:</strong> ${currentStageIndex + 1} of ${stageOrder.length}</p>
                <p><strong>Timeline:</strong> ${formatDisplayDate(design.start_date)} - ${formatDisplayDate(design.end_date)}</p>
                <p><strong>Duration:</strong> ${totalDays} days</p>
                ${daysSinceStart >= 0 && daysSinceStart <= totalDays 
                  ? `<p><strong>Status:</strong> Day ${daysSinceStart} of ${totalDays}</p>` 
                  : ""}
              </div>
            </div>
          `
        },
        on_click: (task: any) => {
          openEditDialog(task.design)
        },
      })
    } catch (error) {
      console.error("Error rendering Gantt chart:", error)
    }
  }

  const openEditDialog = (design: DesignWithClient) => {
    setEditingDesign(design)
    setNewStartDate(design.start_date || "")
    setNewEndDate(design.end_date || "")
  }

  const closeEditDialog = () => {
    setEditingDesign(null)
    setNewStartDate("")
    setNewEndDate("")
  }

  const handleDateUpdate = async () => {
    if (!editingDesign || !newStartDate || !newEndDate) return

    try {
      // Calculate duration of the design being edited
      const newDuration = calculateDaysBetween(newStartDate, newEndDate)
      const oldStartDate = new Date(editingDesign.start_date!)
      const newStartDateObj = new Date(newStartDate)

      // Update the current design
      const { error: updateError } = await supabase
        .from("designs")
        .update({
          start_date: newStartDate,
          end_date: newEndDate,
        })
        .eq("id", editingDesign.id)

      if (updateError) throw updateError

      // Get all designs that come after this one (by original start date)
      const subsequentDesigns = designs
        .filter((d) => {
          if (!d.start_date) return false
          const dStartDate = new Date(d.start_date)
          return dStartDate >= oldStartDate && d.id !== editingDesign.id
        })
        .sort((a, b) => {
          const aDate = new Date(a.start_date!)
          const bDate = new Date(b.start_date!)
          return aDate.getTime() - bDate.getTime()
        })

      // Cascade update: shift all subsequent designs
      let previousEndDate = new Date(newEndDate)

      for (const design of subsequentDesigns) {
        const designDuration = calculateDaysBetween(design.start_date!, design.end_date!)
        
        // New start date is the day after the previous design ends
        const cascadeStartDate = new Date(previousEndDate)
        cascadeStartDate.setDate(cascadeStartDate.getDate() + 1)
        
        // Calculate new end date
        const cascadeEndDate = new Date(cascadeStartDate)
        cascadeEndDate.setDate(cascadeEndDate.getDate() + designDuration - 1)

        const { error: cascadeError } = await supabase
          .from("designs")
          .update({
            start_date: cascadeStartDate.toISOString().split("T")[0],
            end_date: cascadeEndDate.toISOString().split("T")[0],
          })
          .eq("id", design.id)

        if (cascadeError) {
          console.error("Error cascading update:", cascadeError)
        }

        previousEndDate = cascadeEndDate
      }

      // Refresh the data
      await fetchDesigns()
      closeEditDialog()

      alert(
        `Timeline updated successfully!\n\n` +
        `${editingDesign.title} rescheduled.\n` +
        (subsequentDesigns.length > 0 
          ? `${subsequentDesigns.length} subsequent design(s) automatically shifted to prevent over-capacity.` 
          : "")
      )
    } catch (error: any) {
      alert("Error updating timeline: " + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading timeline...</p>
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Designs</h3>
        <p className="text-gray-600 mb-4">
          Designs need start and end dates to appear on the timeline.
        </p>
        <p className="text-sm text-gray-500">
          Add new designs from the Orders page to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "Day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("Day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "Week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("Week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "Month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("Month")}
            >
              Month
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Sampling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-sm text-gray-600">Production</span>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold">{designs.length}</span> designs
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Interactive Timeline</p>
          <p>
            • Hover over bars to see details • Click on a bar to edit dates • 
            Editing a design automatically shifts subsequent designs to prevent over-capacity
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
        <div ref={ganttContainer} className="gantt-container"></div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingDesign !== null} onOpenChange={closeEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Timeline</DialogTitle>
            <DialogDescription>
              Adjust the start and end dates. Subsequent designs will automatically shift.
            </DialogDescription>
          </DialogHeader>

          {editingDesign && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  <strong>Design:</strong> {editingDesign.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Client:</strong> {editingDesign.client_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {editingDesign.type} ({editingDesign.quantity} units)
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              {newStartDate && newEndDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900">
                  <p className="font-semibold mb-1">⚠️ Cascade Update</p>
                  <p>
                    Changing these dates will automatically shift all designs scheduled after this one 
                    to maintain the FIFO queue and prevent over-capacity.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleDateUpdate}>
              Update Timeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Styles */}
      <style jsx global>{`
        .gantt-container {
          min-height: 400px;
          font-family: inherit;
        }

        .gantt .bar-wrapper .bar.gantt-sampling {
          fill: #3B82F6 !important;
        }

        .gantt .bar-wrapper .bar.gantt-production {
          fill: #F97316 !important;
        }

        .gantt .bar-wrapper .bar-progress.gantt-sampling {
          fill: #1E40AF !important;
        }

        .gantt .bar-wrapper .bar-progress.gantt-production {
          fill: #C2410C !important;
        }

        .gantt-tooltip {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          min-width: 280px;
        }

        .tooltip-header {
          font-size: 16px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
        }

        .tooltip-content {
          font-size: 13px;
          line-height: 1.6;
        }

        .tooltip-content p {
          margin: 4px 0;
          color: #374151;
        }

        .tooltip-content strong {
          color: #111827;
          font-weight: 600;
        }

        .badge-sampling {
          background: #DBEAFE;
          color: #1E40AF;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-production {
          background: #FED7AA;
          color: #C2410C;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .gantt .grid-header {
          fill: #F9FAFB;
          stroke: #E5E7EB;
        }

        .gantt .grid-row {
          fill: #FFFFFF;
        }

        .gantt .grid-row:nth-child(even) {
          fill: #F9FAFB;
        }

        .gantt .today-highlight {
          fill: #FEF3C7;
          opacity: 0.3;
        }

        .gantt .bar-label {
          fill: #374151;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
