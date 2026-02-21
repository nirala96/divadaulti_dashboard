"use client"

import { useState, useEffect } from "react"
import { supabase, type Design, type DesignStatus, type DesignType } from "@/lib/supabase"
import { formatDisplayDate } from "@/lib/timeline"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Package, Calendar } from "lucide-react"
import Image from "next/image"

const STAGES: DesignStatus[] = [
  'Sourcing',
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Photoshoot',
  'Dispatch'
]

const STAGE_COLORS: Record<DesignStatus, string> = {
  'Sourcing': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Pattern': 'bg-blue-100 text-blue-800 border-blue-300',
  'Grading': 'bg-purple-100 text-purple-800 border-purple-300',
  'Cutting': 'bg-orange-100 text-orange-800 border-orange-300',
  'Stitching': 'bg-pink-100 text-pink-800 border-pink-300',
  'Photoshoot': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Dispatch': 'bg-green-100 text-green-800 border-green-300',
}

type DesignWithClient = Design & {
  client_name?: string
}

interface ProductionStatusBoardProps {
  filter?: DesignType | 'All'
}

export function ProductionStatusBoard({ filter = 'All' }: ProductionStatusBoardProps) {
  const [designs, setDesigns] = useState<DesignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<DesignType | 'All'>(filter)

  useEffect(() => {
    fetchDesigns()
  }, [activeFilter])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      // Fetch designs with client information
      const { data: designsData, error } = await supabase
        .from('designs')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to include client name
      const designsWithClients: DesignWithClient[] = (designsData || []).map((design: any) => ({
        ...design,
        client_name: design.clients?.name || 'Unknown Client'
      }))

      // Apply filter
      const filteredDesigns = activeFilter === 'All' 
        ? designsWithClients
        : designsWithClients.filter(d => d.type === activeFilter)

      setDesigns(filteredDesigns)
    } catch (error) {
      console.error('Error fetching designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const moveToNextStage = async (designId: string, currentStatus: DesignStatus) => {
    const currentIndex = STAGES.indexOf(currentStatus)
    if (currentIndex === STAGES.length - 1) {
      alert('Design is already at the final stage (Dispatch)')
      return
    }

    const nextStatus = STAGES[currentIndex + 1]

    try {
      const { error } = await supabase
        .from('designs')
        .update({ status: nextStatus })
        .eq('id', designId)

      if (error) throw error

      // Update local state
      setDesigns(prev =>
        prev.map(d =>
          d.id === designId ? { ...d, status: nextStatus } : d
        )
      )
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const getDesignsByStatus = (status: DesignStatus) => {
    return designs.filter(d => d.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading designs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('All')}
          >
            All Designs
          </Button>
          <Button
            variant={activeFilter === 'Sampling' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('Sampling')}
          >
            Sampling Only
          </Button>
          <Button
            variant={activeFilter === 'Production' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('Production')}
          >
            Production Only
          </Button>
        </div>
        <div className="ml-auto text-sm text-gray-600">
          Total: <span className="font-semibold">{designs.length}</span> designs
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const stageDesigns = getDesignsByStatus(stage)
            return (
              <div
                key={stage}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
              >
                {/* Column Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{stage}</h3>
                    <Badge className={STAGE_COLORS[stage]}>
                      {stageDesigns.length}
                    </Badge>
                  </div>
                  <div className="h-1 bg-gray-200 rounded">
                    <div
                      className={`h-full rounded ${STAGE_COLORS[stage].split(' ')[0]}`}
                      style={{
                        width: `${designs.length > 0 ? (stageDesigns.length / designs.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Design Cards */}
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {stageDesigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No designs in this stage
                    </div>
                  ) : (
                    stageDesigns.map((design) => (
                      <DesignCard
                        key={design.id}
                        design={design}
                        onMoveNext={() => moveToNextStage(design.id, design.status)}
                        isLastStage={stage === 'Dispatch'}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface DesignCardProps {
  design: DesignWithClient
  onMoveNext: () => void
  isLastStage: boolean
}

function DesignCard({ design, onMoveNext, isLastStage }: DesignCardProps) {
  const primaryImage = design.images && design.images.length > 0 ? design.images[0] : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Design Image */}
      {primaryImage ? (
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={primaryImage}
            alt={design.title}
            fill
            className="object-cover"
            sizes="(max-width: 320px) 100vw, 320px"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gray-200 flex items-center justify-center">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Client Name */}
        <div className="text-xs text-gray-500 font-medium">
          {design.client_name}
        </div>

        {/* Design Title */}
        <h4 className="font-semibold text-gray-900 line-clamp-2">
          {design.title}
        </h4>

        {/* Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={design.type === 'Sampling' ? 'secondary' : 'default'}>
              {design.type}
            </Badge>
            <span className="text-gray-600">
              Qty: <span className="font-semibold">{design.quantity}</span>
            </span>
          </div>
        </div>

        {/* Timeline Dates */}
        {(design.start_date || design.end_date) && (
          <div className="bg-gray-50 rounded p-2 space-y-1 text-xs">
            {design.start_date && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Start: {formatDisplayDate(design.start_date)}</span>
              </div>
            )}
            {design.end_date && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>End: {formatDisplayDate(design.end_date)}</span>
              </div>
            )}
          </div>
        )}

        {/* Move Button */}
        {!isLastStage && (
          <Button
            onClick={onMoveNext}
            size="sm"
            className="w-full gap-2"
            variant="outline"
          >
            Move to Next Stage
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {isLastStage && (
          <div className="text-center py-2 text-xs text-green-600 font-semibold">
            ✓ Completed
          </div>
        )}
      </CardContent>
    </Card>
  )
}
