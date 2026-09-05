"use client"

import { useState, useEffect, useMemo } from "react"
import { getDesignsWithClients, updateDesignDispatchDate, type Design } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, ImageIcon, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog"

interface DesignWithClient extends Design {
  client_name: string
  client_id: string
}

interface ClientGroup {
  client_id: string
  client_name: string
  designs: DesignWithClient[]
}

type Urgency = 'none' | 'normal' | 'warning' | 'critical'

// Dates coming back from server actions may arrive as Date instances rather
// than strings, and dispatch_date is a plain DATE column (no time component),
// so compare at UTC-midnight granularity to avoid off-by-one from local TZ.
function toUtcMidnight(value: string | Date): number {
  const d = new Date(value)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function daysUntil(dispatchDate: string | Date): number {
  const today = toUtcMidnight(new Date())
  const target = toUtcMidnight(dispatchDate)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function getDispatchUrgency(dispatchDate: string | null): Urgency {
  if (!dispatchDate) return 'none'
  const days = daysUntil(dispatchDate)
  if (days <= 1) return 'critical' // due tomorrow, today, or overdue
  if (days <= 2) return 'warning'
  return 'normal'
}

function toDateInputValue(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0]
}

const TILE_STYLES: Record<Urgency, string> = {
  none: 'bg-white border-dashed border-gray-300',
  normal: 'bg-white border-gray-200',
  warning: 'bg-yellow-50 border-yellow-400',
  critical: 'bg-red-50 border-red-400',
}

export function DispatchSchedule() {
  const [designs, setDesigns] = useState<DesignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      const data = await getDesignsWithClients()
      setDesigns(
        (data as any[]).map(design => ({
          ...design,
          client_name: design.client_name || 'Unknown Client',
        }))
      )
    } catch (error) {
      console.error('Error fetching designs for dispatch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = async (design: DesignWithClient, value: string) => {
    const newDate = value || null
    setDesigns(prev =>
      prev.map(d => (d.id === design.id ? { ...d, dispatch_date: newDate } : d))
    )
    try {
      await updateDesignDispatchDate(design.id, newDate)
    } catch (error: any) {
      console.error('Error updating dispatch date:', error)
      alert('Failed to update dispatch date: ' + error.message)
      setDesigns(prev =>
        prev.map(d => (d.id === design.id ? { ...d, dispatch_date: design.dispatch_date } : d))
      )
    }
  }

  const toggleClientExpansion = (clientId: string) => {
    setCollapsedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const clientGroups: ClientGroup[] = useMemo(() => {
    const groupedByClient: Record<string, DesignWithClient[]> = {}
    designs.forEach(design => {
      const clientId = design.client_id || 'unknown'
      if (!groupedByClient[clientId]) {
        groupedByClient[clientId] = []
      }
      groupedByClient[clientId].push(design)
    })
    return Object.entries(groupedByClient).map(([clientId, groupDesigns]) => ({
      client_id: clientId,
      client_name: groupDesigns[0]?.client_name || 'Unknown Client',
      designs: groupDesigns,
    }))
  }, [designs])

  const { warningCount, criticalCount } = useMemo(() => {
    let warning = 0
    let critical = 0
    designs.forEach(d => {
      const urgency = getDispatchUrgency(d.dispatch_date)
      if (urgency === 'warning') warning++
      if (urgency === 'critical') critical++
    })
    return { warningCount: warning, criticalCount: critical }
  }, [designs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dispatch schedule...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900">Dispatch Schedule</h2>
        <p className="text-sm text-gray-600 mt-1">
          Internal only — set the date each order should ship from our end. Tiles turn yellow ~2 days out and red at 1 day out or overdue. Not shown to clients.
        </p>
        {(warningCount > 0 || criticalCount > 0) && (
          <div className="flex items-center gap-4 mt-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {criticalCount} due now or overdue
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                {warningCount} due in ~2 days
              </div>
            )}
          </div>
        )}
      </div>

      {clientGroups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No active orders.
        </div>
      ) : (
        clientGroups.map(group => {
          const isExpanded = !collapsedClients.has(group.client_id)
          return (
            <div key={group.client_id} className="bg-white rounded-lg shadow overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b cursor-pointer"
                onClick={() => toggleClientExpansion(group.client_id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">{group.client_name}</div>
                  <div className="text-xs text-gray-500">
                    {group.designs.length} active order{group.designs.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.designs.map(design => {
                    const urgency = getDispatchUrgency(design.dispatch_date)
                    return (
                      <div
                        key={design.id}
                        className={`rounded-lg border-2 p-3 flex flex-col gap-2 ${TILE_STYLES[urgency]}`}
                      >
                        <div className="flex items-center gap-3">
                          {design.images && design.images.length > 0 ? (
                            <div
                              className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                              onClick={() => setPreviewImage(design.images![0])}
                            >
                              <Image
                                src={design.images![0]}
                                alt={design.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{design.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant={design.type === 'Sampling' ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {design.type}
                              </Badge>
                              <span className="text-xs text-gray-500">{design.quantity} pcs</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500">Dispatch date</label>
                          <input
                            type="date"
                            value={design.dispatch_date ? toDateInputValue(design.dispatch_date) : ''}
                            onChange={(e) => handleDateChange(design, e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          />
                        </div>

                        {design.dispatch_date && urgency !== 'normal' && (
                          <div className={`text-xs font-semibold ${urgency === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>
                            {daysUntil(design.dispatch_date) < 0
                              ? `${Math.abs(daysUntil(design.dispatch_date))} day${Math.abs(daysUntil(design.dispatch_date)) !== 1 ? 's' : ''} overdue`
                              : daysUntil(design.dispatch_date) === 0
                              ? 'Dispatch today'
                              : `${daysUntil(design.dispatch_date)} day${daysUntil(design.dispatch_date) !== 1 ? 's' : ''} left`}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}

      <ImagePreviewDialog imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  )
}
