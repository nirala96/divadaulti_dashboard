"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Package, Calendar, ClipboardList, ClipboardCheck, CheckCircle2, DollarSign, PauseCircle, Activity, ListChecks, FileText, MessageCircleQuestion, ChevronDown, ChevronsLeft, ChevronsRight, History, BarChart3, KeyRound, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCurrentSession } from "@/lib/actions"
import { MERCHANDISER_ALLOWED_PATHS } from "@/lib/roles"

const groups = [
  {
    title: "Planning",
    key: "planning",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Today's Plan", href: "/todays-plan", icon: ListChecks },
      { name: "Daily Check-In", href: "/daily-checkin", icon: ClipboardCheck },
      { name: "Daily Report", href: "/daily-report", icon: BarChart3 },
      { name: "Timeline", href: "/timeline", icon: Calendar },
      { name: "Work Points", href: "/work-points", icon: ClipboardList },
      { name: "Production Stitching", href: "/production-stitching", icon: ClipboardList },
    ],
  },
  {
    title: "Order Archive",
    key: "order-archive",
    items: [
      { name: "Completed Orders", href: "/completed-orders", icon: CheckCircle2 },
      { name: "On Hold", href: "/on-hold", icon: PauseCircle },
    ],
  },
  {
    title: "Business Dev",
    key: "business-dev",
    items: [
      { name: "Quotation", href: "/quotation", icon: FileText },
      { name: "Sales Pitch", href: "/sales-pitch", icon: MessageCircleQuestion },
    ],
  },
  {
    title: "Operations",
    key: "operations",
    items: [
      { name: "Finance", href: "/finance", icon: DollarSign },
      { name: "Performance", href: "/performance", icon: Activity },
      // keep Orders accessible under Operations
      { name: "Orders", href: "/orders", icon: Package },
    ],
  },
  {
    title: "Admin",
    key: "admin",
    items: [
      { name: "Activity Log", href: "/activity-log", icon: History },
      { name: "Dashboard Logins", href: "/users", icon: KeyRound },
    ],
  },
]

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState<Record<string, boolean>>({ planning: true })
  const [loggingOut, setLoggingOut] = useState(false)
  const [isMerchandiser, setIsMerchandiser] = useState(false)
  // Desktop: shrink to an icon rail. Mobile: the menu slides in over the page instead.
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true")
    } catch {}
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(!current))
      } catch {}
      return !current
    })
  }

  useEffect(() => {
    getCurrentSession()
      .then((session) => setIsMerchandiser(session?.role === 'merchandiser'))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  const visibleGroups = isMerchandiser
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((item) => MERCHANDISER_ALLOWED_PATHS.includes(item.href)) }))
        .filter((g) => g.items.length > 0)
    : groups

  const renderNav = (compact: boolean) => (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {visibleGroups.map((g) => {
          // The icon rail has no room for group headers, so it lists every item.
          const isOpen = compact || !!open[g.key]
          return (
            <div key={g.key} className={cn("mb-2", compact && "border-b border-gray-800 pb-2 last:border-b-0")}>
              {!compact && (
                <button
                  onClick={() => setOpen((s) => ({ ...s, [g.key]: !s[g.key] }))}
                  className="group flex w-full items-center justify-between px-2 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 rounded-md"
                >
                  <span className="flex items-center">
                    <span className="mr-2 text-sm">{g.title}</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </button>
              )}

              {isOpen && (
                <div className={cn("mt-1 space-y-1", !compact && "px-1")}>
                  {g.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={compact ? item.name : undefined}
                        className={cn(
                          "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          compact && "justify-center",
                          isActive
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            !compact && "mr-3",
                            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                          )}
                        />
                        {!compact && item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className={cn("border-t border-gray-800 space-y-3", compact ? "p-2" : "p-4")}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={compact ? "Log out" : undefined}
          className={cn(
            "flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50",
            compact && "justify-center"
          )}
        >
          <LogOut className={cn("h-5 w-5 flex-shrink-0 text-gray-400", !compact && "mr-3")} />
          {!compact && (loggingOut ? "Logging out..." : "Log out")}
        </button>
        {!compact && <p className="text-xs text-gray-400">Order Management System</p>}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile: a slim bar that opens the full menu as a drawer */}
      <div className="flex h-full w-12 flex-shrink-0 flex-col items-center bg-gray-900 py-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex h-full w-64 max-w-[85vw] flex-col bg-gray-900 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
              <h1 className="text-xl font-bold text-white">Diva Daulti</h1>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(false)}
          </div>
          <button aria-label="Close menu" className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop: full sidebar that can collapse to an icon rail */}
      <div
        className={cn(
          "hidden h-full flex-shrink-0 flex-col bg-gray-900 transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-gray-800",
            collapsed ? "justify-center" : "justify-between px-4"
          )}
        >
          {!collapsed && <h1 className="text-xl font-bold text-white">Diva Daulti</h1>}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
        </div>
        {renderNav(collapsed)}
      </div>
    </>
  )
}
