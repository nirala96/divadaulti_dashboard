"use client"

import { useState, useEffect } from "react"
import { getFinancialData, updateClientPrice, type FinancialData } from "@/lib/actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, Users, Edit2, Save, X } from "lucide-react"

export function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getFinancialData()
      setData(result)
    } catch (error) {
      console.error('Failed to load financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (client: any) => {
    setEditingId(client.id)
    setEditPrice(client.price?.toString() || '0')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPrice('')
  }

  const saveEdit = async (clientId: string) => {
    try {
      await updateClientPrice(clientId, parseFloat(editPrice) || 0)
      await loadData()
      cancelEdit()
    } catch (error) {
      console.error('Failed to update price:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading financial data...</div>
  }

  if (!data) {
    return <div className="text-center py-12">No financial data available</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.summary.total_revenue)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients with Price</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.client_count}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Client Pricing Table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Client Pricing</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  {editingId === client.id ? (
                    <>
                      <td className="px-6 py-4 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-40 text-right"
                          placeholder="0.00"
                          autoFocus
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {client.order_count}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => saveEdit(client.id)} className="h-8">
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8">
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {client.price > 0 ? formatCurrency(client.price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {client.order_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => startEdit(client)} 
                          className="h-8"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit Price
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
