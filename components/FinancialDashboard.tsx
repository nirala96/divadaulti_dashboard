"use client"

import { useState, useEffect } from "react"
import { getFinancialData, updateDesignFinancials, type FinancialData } from "@/lib/actions"
import { Card } from "@/components/ui/card"
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
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Edit2, Save, X } from "lucide-react"

type PaymentStatus = 'not-set' | 'pending' | 'partial' | 'paid' | 'overdue'

export function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    price: '',
    payment_received: '',
    payment_status: 'pending' as PaymentStatus,
    payment_date: '',
    notes_financial: ''
  })

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

  const startEdit = (design: any) => {
    setEditingId(design.id)
    setEditForm({
      price: design.price?.toString() || '',
      payment_received: design.payment_received?.toString() || '',
      payment_status: design.payment_status || 'pending',
      payment_date: design.payment_date || '',
      notes_financial: design.notes_financial || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      price: '',
      payment_received: '',
      payment_status: 'pending',
      payment_date: '',
      notes_financial: ''
    })
  }

  const saveEdit = async (designId: string) => {
    try {
      await updateDesignFinancials(designId, {
        price: parseFloat(editForm.price) || 0,
        payment_received: parseFloat(editForm.payment_received) || 0,
        payment_status: editForm.payment_status,
        payment_date: editForm.payment_date || null,
        notes_financial: editForm.notes_financial
      })
      await loadData()
      cancelEdit()
    } catch (error) {
      console.error('Failed to update financials:', error)
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

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'not-set': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-4 w-4" />
      case 'overdue': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-sm font-medium text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.summary.total_received)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(data.summary.total_pending)}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {data.summary.collection_rate.toFixed(1)}%
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Client-wise Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Client-wise Revenue</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.by_client.map((client) => (
                <tr key={client.client_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {client.order_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(client.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(client.total_received)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {formatCurrency(client.total_pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Design-wise Details */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Design
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.designs.map((design) => (
                <tr key={design.id} className="hover:bg-gray-50">
                  {editingId === design.id ? (
                    <>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{design.client_name}</div>
                        <div className="text-gray-500">{design.title}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="w-32 text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.payment_received}
                          onChange={(e) => setEditForm({ ...editForm, payment_received: e.target.value })}
                          className="w-32 text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Select value={editForm.payment_status} onValueChange={(value: PaymentStatus) => setEditForm({ ...editForm, payment_status: value })}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-set">Not Set</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="date"
                          value={editForm.payment_date}
                          onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
                          className="w-40"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => saveEdit(design.id)} className="h-8">
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{design.client_name}</div>
                        <div className="text-gray-500">{design.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {design.price > 0 ? formatCurrency(design.price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {design.payment_received > 0 ? formatCurrency(design.payment_received) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(design.payment_status)}`}>
                          {getStatusIcon(design.payment_status)}
                          {design.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {design.payment_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button size="sm" variant="outline" onClick={() => startEdit(design)} className="h-8">
                          <Edit2 className="h-4 w-4" />
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
