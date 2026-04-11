import { getClientByTrackingToken } from '@/lib/actions'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Clock, Package, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'pattern_making', label: 'Pattern Making' },
  { key: 'fabric_cutting', label: 'Fabric Cutting' },
  { key: 'sewing_tailor', label: 'Sewing/Tailoring' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready_for_dispatch', label: 'Ready for Dispatch' }
]

type PageProps = {
  params: { token: string }
}

function getStageStatus(stageStatus: Record<string, string>, stageKey: string): string {
  return stageStatus?.[stageKey] || 'not-started'
}

function StageProgress({ stage, status }: { stage: typeof STAGES[0], status: string }) {
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in-progress'
  const isNotStarted = status === 'not-started' || status === 'vacant'
  
  return (
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-green-500' :
        isInProgress ? 'bg-blue-500 animate-pulse' :
        'bg-gray-200'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-white" />
        ) : isInProgress ? (
          <Clock className="w-6 h-6 text-white" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
        )}
      </div>
      
      <div className="flex-1">
        <h3 className={`font-medium ${
          isCompleted ? 'text-green-700' :
          isInProgress ? 'text-blue-700' :
          'text-gray-500'
        }`}>
          {stage.label}
        </h3>
        <p className="text-sm text-gray-600">
          {isCompleted ? 'Completed ✓' :
           isInProgress ? 'In Progress...' :
           'Not Started'}
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
                      <div key={stage.key}>
                        <StageProgress
                          stage={stage}
                          status={getStageStatus(design.stage_status as Record<string, string>, stage.key)}
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
