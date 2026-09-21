"use client"

import { useEffect, useMemo, useState } from "react"
import { getClientCheckins, setClientCheckin, type ClientCheckin } from "@/lib/actions"
import { useMerchandiserNames } from "@/lib/useMerchandiserNames"
import { MerchandiserTag } from "@/components/MerchandiserTag"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"

type CheckFilter = "All" | "Checked" | "Unchecked"

export function ClientCheckinBoard() {
  const { merchandiserNames } = useMerchandiserNames()
  const [checkins, setCheckins] = useState<ClientCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [activeMerchandiserFilter, setActiveMerchandiserFilter] = useState<string | null>(null)
  const [activeCheckFilter, setActiveCheckFilter] = useState<CheckFilter>("All")

  useEffect(() => {
    getClientCheckins()
      .then(setCheckins)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let out = checkins
    if (activeMerchandiserFilter) out = out.filter((c) => c.merchandiser === activeMerchandiserFilter)
    if (activeCheckFilter === "Checked") out = out.filter((c) => c.checked_today)
    if (activeCheckFilter === "Unchecked") out = out.filter((c) => !c.checked_today)
    return out
  }, [checkins, activeMerchandiserFilter, activeCheckFilter])

  const checkedCount = useMemo(() => checkins.filter((c) => c.checked_today).length, [checkins])

  const toggle = async (client: ClientCheckin) => {
    const nextChecked = !client.checked_today
    setBusyId(client.client_id)
    setCheckins((prev) =>
      prev.map((c) => (c.client_id === client.client_id ? { ...c, checked_today: nextChecked } : c))
    )
    try {
      await setClientCheckin(client.client_id, nextChecked)
    } catch (error: any) {
      console.error("Error updating check-in:", error)
      alert("Failed to update: " + error.message)
      setCheckins((prev) =>
        prev.map((c) => (c.client_id === client.client_id ? { ...c, checked_today: !nextChecked } : c))
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Daily Client Check-In</h1>
        <p className="text-sm text-gray-500 mt-1">
          Has the merchandiser spoken to this client today? Resets automatically every night at midnight.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by Merchandiser:</span>
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant={activeMerchandiserFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMerchandiserFilter(null)}
            >
              All
            </Button>
            {merchandiserNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveMerchandiserFilter(activeMerchandiserFilter === name ? null : name)}
                className={activeMerchandiserFilter === name ? "ring-2 ring-offset-1 ring-gray-400 rounded-full" : ""}
              >
                <MerchandiserTag name={name} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          <div className="flex gap-2">
            <Button
              variant={activeCheckFilter === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCheckFilter("All")}
            >
              All
            </Button>
            <Button
              variant={activeCheckFilter === "Checked" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCheckFilter("Checked")}
            >
              Checked
            </Button>
            <Button
              variant={activeCheckFilter === "Unchecked" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCheckFilter("Unchecked")}
            >
              Unchecked
            </Button>
          </div>
          <span className="text-sm text-gray-400 ml-auto">
            {checkedCount} of {checkins.length} checked today
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading clients...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">No clients match this filter.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((client) => (
            <button
              key={client.client_id}
              onClick={() => toggle(client)}
              disabled={busyId === client.client_id}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors disabled:opacity-60 ${
                client.checked_today
                  ? "border-green-300 bg-green-50 hover:bg-green-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded border ${
                  client.checked_today ? "bg-green-500 border-green-500" : "border-gray-300 bg-white"
                }`}
              >
                {client.checked_today && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className="text-sm font-medium text-gray-900 truncate">{client.client_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
