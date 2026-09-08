"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Package, Calendar, ClipboardList, CheckCircle2, DollarSign, PauseCircle, Activity, ListChecks, FileText, MessageCircleQuestion, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const groups = [
  {
    title: "Planning",
    key: "planning",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Today's Plan", href: "/todays-plan", icon: ListChecks },
      { name: "Timeline", href: "/timeline", icon: Calendar },
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
      { name: "Work Points", href: "/work-points", icon: ClipboardList },
      // keep Orders accessible under Operations
      { name: "Orders", href: "/orders", icon: Package },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({ planning: true })

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Diva Daulti</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        {groups.map((g) => {
          const isOpen = !!open[g.key]
          return (
            <div key={g.key} className="mb-2">
              <button
                onClick={() => setOpen((s) => ({ ...s, [g.key]: !s[g.key] }))}
                className="group flex w-full items-center justify-between px-2 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 rounded-md"
              >
                <span className="flex items-center">
                  <span className="mr-2 text-sm">{g.title}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div className="mt-1 space-y-1 px-1">
                  {g.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                          )}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-400">Order Management System</p>
      </div>
    </div>
  )
}
