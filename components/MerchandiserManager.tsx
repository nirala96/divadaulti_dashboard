"use client"

import { useState } from "react"
import {
  getMerchandisers,
  addMerchandiser,
  removeMerchandiser,
  countClientsForMerchandiser,
  type Merchandiser,
} from "@/lib/actions"
import { useMerchandiserNames } from "@/lib/useMerchandiserNames"
import { MerchandiserTag } from "@/components/MerchandiserTag"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"

export function MerchandiserManager() {
  const { merchandiserNames, refreshMerchandisers } = useMerchandiserNames()
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [removingName, setRemovingName] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    if (merchandiserNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      alert(`"${trimmed}" is already in the list.`)
      return
    }
    setAdding(true)
    try {
      await addMerchandiser(trimmed)
      setNewName("")
      refreshMerchandisers()
    } catch (error: any) {
      alert("Failed to add merchandiser: " + error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (name: string) => {
    setRemovingName(name)
    try {
      const count = await countClientsForMerchandiser(name)
      const message =
        count > 0
          ? `${count} client${count === 1 ? " is" : "s are"} currently tagged to "${name}". Remove "${name}" from the list anyway? Those clients keep the tag until it's changed, but "${name}" won't be selectable for new ones.`
          : `Remove "${name}" from the merchandiser list?`
      if (!confirm(message)) return
      await removeMerchandiser(name)
      refreshMerchandisers()
    } catch (error: any) {
      alert("Failed to remove merchandiser: " + error.message)
    } finally {
      setRemovingName(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Merchandisers</h2>
      <p className="text-sm text-gray-500 mb-4">
        Add or remove people from the merchandiser list used across Clients, Dashboard, and Today's Plan.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {merchandiserNames.length === 0 ? (
          <span className="text-sm text-gray-400">No merchandisers yet.</span>
        ) : (
          merchandiserNames.map((name) => (
            <span key={name} className="inline-flex items-center gap-1">
              <MerchandiserTag name={name} />
              <button
                onClick={() => handleRemove(name)}
                disabled={removingName === name}
                className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title={`Remove ${name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2 max-w-sm">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New merchandiser name"
        />
        <Button id="add-merchandiser-btn" type="submit" disabled={adding || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>
    </div>
  )
}
