"use client"

import { useEffect, useState } from "react"
import {
  getDashboardUsers,
  addDashboardUser,
  removeDashboardUser,
  type DashboardUser,
  type DashboardRole,
} from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, UserPlus } from "lucide-react"

const ROLES: { value: DashboardRole; label: string }[] = [
  { value: "merchandiser", label: "Merchandiser" },
  { value: "sales", label: "Sales" },
  { value: "admin", label: "Admin" },
]

const ROLE_COLORS: Record<DashboardRole, string> = {
  merchandiser: "bg-blue-50 text-blue-700 border-blue-200",
  sales: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
}

export function UserManager() {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<DashboardRole>("merchandiser")
  const [adding, setAdding] = useState(false)
  const [removingUsername, setRemovingUsername] = useState<string | null>(null)

  const refresh = () => {
    getDashboardUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUsername = username.trim().toLowerCase()
    if (!trimmedUsername || !password || !displayName.trim()) return
    if (users.some((u) => u.username === trimmedUsername)) {
      alert(`"${trimmedUsername}" already has a login.`)
      return
    }
    setAdding(true)
    try {
      await addDashboardUser(trimmedUsername, password, displayName, role)
      setDisplayName("")
      setUsername("")
      setPassword("")
      setRole("merchandiser")
      refresh()
    } catch (error: any) {
      alert("Failed to add login: " + error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (user: DashboardUser) => {
    if (!confirm(`Remove ${user.display_name}'s login ("${user.username}")? They won't be able to log in anymore.`)) return
    setRemovingUsername(user.username)
    try {
      await removeDashboardUser(user.username)
      refresh()
    } catch (error: any) {
      alert("Failed to remove login: " + error.message)
    } finally {
      setRemovingUsername(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Dashboard Logins</h2>
      <p className="text-sm text-gray-500 mb-4">
        Give merchandisers, karigaars, or anyone else their own username and password. Merchandiser logins only see
        Dashboard, Today&apos;s Plan, Daily Check-In, Timeline, and Work Points - Sales and Admin get full access.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400 mb-4">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">No logins yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {users.map((user) => (
            <span
              key={user.username}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
            >
              <span className="font-medium text-gray-900">{user.display_name}</span>
              <span className="text-gray-400">@{user.username}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
              <button
                onClick={() => handleRemove(user)}
                disabled={removingUsername === user.username}
                className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title={`Remove ${user.display_name}'s login`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="new-user-display-name">Name</Label>
          <Input
            id="new-user-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Ritu"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-user-username">Username</Label>
          <Input
            id="new-user-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ritu"
            autoCapitalize="none"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-user-role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as DashboardRole)}>
            <SelectTrigger id="new-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-user-password">Password</Label>
          <div className="flex gap-2">
            <Input
              id="new-user-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
            />
            <Button type="submit" disabled={adding || !username.trim() || !password || !displayName.trim()}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
