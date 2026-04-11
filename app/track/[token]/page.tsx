import { getClientByTrackingToken } from '@/lib/actions'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Clock, Package, Sparkles, Circle, Minus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STAGES = [
  'Payment Received',
  'Fabric Finalize',
  'Pattern',
  'Grading',
  'Cutting',
  'Stitching',
  'Dye',
  'Print',
  'Embroidery',
  'Wash',
  'Kaaj',
  'Finishing',
  'Photoshoot',
  'Final Settlement',
  'Dispatch'
]

const STAGE_COLORS: Record<string, string> = {
  'Payment Received': 'from-green-400 to-green-600',
  'Fabric Finalize': 'from-slate-400 to-slate-600',
  'Pattern': 'from-blue-400 to-blue-600',
  'Grading': 'from-purple-400 to-purple-600',
  'Cutting': 'from-orange-400 to-orange-600',
  'Stitching': 'from-pink-400 to-pink-600',
  'Dye': 'from-rose-400 to-rose-600',
  'Print': 'from-lime-400 to-lime-600',
  'Kaaj': 'from-indigo-400 to-indigo-600',
  'Embroidery': 'from-violet-400 to-violet-600',
  'Wash': 'from-cyan-400 to-cyan-600',
  'Finishing': 'from-teal-400 to-teal-600',
  'Photoshoot': 'from-fuchsia-400 to-fuchsia-600',
  'Final Settlement': 'from-amber-400 to-amber-600',
  'Dispatch': 'from-emerald-400 to-emerald-600',
}

const STAGE_ESTIMATED_DAYS: Record<string, number> = {
  'Payment Received': 0,
  'Fabric Finalize': 5,
  'Pattern': 1,
  'Grading': 1,
  'Cutting': 1,
  'Stitching': 2,
  'Dye': 2,
  'Print': 2,
  'Embroidery': 3,
  'Wash': 1,
  'Kaaj': 2,
  'Finishing': 1,
  'Photoshoot': 1,
  'Final Settlement': 1,
  'Dispatch': 1,
}

type PageProps = {
  params: { token: string }
}

type StageState = 'vacant' | 'not-needed' | 'in-progress' | 'completed'

function getStageStatus(stageStatus: Record<string, string>, stage: string): StageState {
  return (stageStatus?.[stage] as StageState) || 'vacant'
}

function StageProgress({ stage, status, color, estimatedDays }: { stage: string, status: StageState, color: string, estimatedDays: number }) {
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in-progress'
  const isNotNeeded = status === 'not-needed'
  const isVacant = status === 'vacant'
  
  return (
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-lg' :
        isInProgress ? `bg-gradient-to-br ${color} animate-pulse shadow-md` :
        isNotNeeded ? 'bg-gray-300' :
        'bg-gray-100 border-2 border-gray-300'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-7 h-7 text-white" />
        ) : isInProgress ? (
          <Clock className="w-6 h-6 text-white" />
        ) : isNotNeeded ? (
          <Minus className="w-6 h-6 text-gray-600" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1">
        <h3 className={`font-semibold ${
          isCompleted ? 'text-green-700' :
          isInProgress ? 'text-blue-700' :
          isNotNeeded ? 'text-gray-500' :
          'text-gray-400'
        }`}>
          {stage}
        </h3>
        <p className={`text-sm ${
          isCompleted ? 'text-green-600 font-medium' :
          'text-gray-600'
        }`}>
          {isCompleted ? '✓ Completed' :
           isInProgress ? 'In Progress...' :
           isNotNeeded ? 'Not Needed' :
           'Not Started'}
          {estimatedDays > 0 && !isCompleted && (
            <span className="text-gray-500 ml-2">
              (Est. {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'})
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default async function ClientTrackingPage({ params }: PageProps) {
  const data = await getClientByTrackingToken(params.token)
  
  if (!data) {
    notFound()
  }
  
  const { client, designs } = data
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Diva Daulti</h1>
              <p className="text-gray-600">Order Tracking</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {client.name}! 👋
          </h2>
          <p className="text-gray-600">
            Track the progress of your custom orders below
          </p>
        </div>
        
        {/* Orders */}
        {designs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Active Orders
            </h3>
            <p className="text-gray-500">
              You don't have any orders in progress at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {designs.map((design) => (
              <div key={design.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{design.title}</h3>
                      <p className="text-purple-100">
                        {design.type} • Quantity: {design.quantity}
                      </p>
                    </div>
                    {design.is_priority && (
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                        ⭐ Priority
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Images */}
                {design.images &&  design.images.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex gap-3 overflow-x-auto">
                      {design.images.map((img, idx) => (
                        <div key={idx} className="flex-shrink-0">
                          <Image
                            src={img}
                            alt={`${design.title} - ${idx + 1}`}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Progress Stages */}
                <div className="px-6 py-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Production Progress</h4>
                  <div className="space-y-4">
                    {STAGES.map((stage, idx) => (
                      <div key={stage}>
                        <StageProgress
                          stage={stage}
                          status={getStageStatus(design.stage_status as Record<string, string>, stage)}
                          color={STAGE_COLORS[stage]}
                          estimatedDays={STAGE_ESTIMATED_DAYS[stage]}
                        />
                        {idx < STAGES.length - 1 && (
                          <div className="ml-6 h-8 w-0.5 bg-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Timeline */}
                {design.start_date && design.end_date && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Started:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(design.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected Completion:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(design.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                

              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Questions about your order? Contact us for updates</p>
          <p className="mt-2">© 2024 Diva Daulti. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
