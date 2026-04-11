"use client"

import { useState, useEffect } from "react"
import { getClients, getDesignsWithClients, getTasks } from "@/lib/actions"
import { Sidebar } from "@/components/Sidebar"

export default function DebugPage() {
  const [status, setStatus] = useState({
    database: 'Railway PostgreSQL',
    clients: { count: 0, error: null as any },
    designs: { count: 0, error: null as any },
    tasks: { count: 0, error: null as any }
  })

  useEffect(() => {
    async function runTests() {
      // Test clients
      try {
        const clients = await getClients()
        setStatus(prev => ({
          ...prev,
          clients: {
            count: clients?.length || 0,
            error: null
          }
        }))
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          clients: {
            count: 0,
            error: error
          }
        }))
      }

      // Test designs
      try {
        const designs = await getDesignsWithClients()
        setStatus(prev => ({
          ...prev,
          designs: {
            count: designs?.length || 0,
            error: null
          }
        }))
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          designs: {
            count: 0,
            error: error
          }
        }))
      }

      // Test tasks
      try {
        const tasks = await getTasks()
        setStatus(prev => ({
          ...prev,
          tasks: {
            count: tasks?.length || 0,
            error: null
          }
        }))
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          tasks: {
            count: 0,
            error: error
          }
        }))
      }
    }

    runTests()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Connection Debug</h1>
          
          <div className="space-y-4">
            {/* Database Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Database</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="font-bold">Database:</span> {status.database}
                </div>
                <div className="text-green-600">
                  ✅ Using Railway PostgreSQL via server actions
                </div>
              </div>
            </div>

            {/* Clients Test */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Clients Table</h2>
              {status.clients.error ? (
                <div className="text-red-600">
                  <p className="font-bold">❌ Error:</p>
                  <pre className="mt-2 text-sm">{JSON.stringify(status.clients.error, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-green-600">
                  <p className="font-bold">✅ Success</p>
                  <p className="mt-2">Found {status.clients.count} clients</p>
                </div>
              )}
            </div>

            {/* Designs Test */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Designs Table</h2>
              {status.designs.error ? (
                <div className="text-red-600">
                  <p className="font-bold">❌ Error:</p>
                  <pre className="mt-2 text-sm">{JSON.stringify(status.designs.error, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-green-600">
                  <p className="font-bold">✅ Success</p>
                  <p className="mt-2">Found {status.designs.count} designs</p>
                </div>
              )}
            </div>

            {/* Tasks Test */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Tasks Table</h2>
              {status.tasks.error ? (
                <div className="text-red-600">
                  <p className="font-bold">❌ Error:</p>
                  <pre className="mt-2 text-sm">{JSON.stringify(status.tasks.error, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-green-600">
                  <p className="font-bold">✅ Success</p>
                  <p className="mt-2">Found {status.tasks.count} tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
