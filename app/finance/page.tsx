"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { FinancialDashboard } from "@/components/FinancialDashboard"

export default function FinancePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Financial Dashboard
            </h1>
            <p className="text-gray-600">
              Track payments, revenue, and financial metrics for all orders
            </p>
          </div>
          <FinancialDashboard />
        </div>
      </main>
    </div>
  )
}
