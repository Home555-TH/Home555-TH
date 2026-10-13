import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface Invoice {
  id: number
  invoice_no: string
  invoice_date: string
  member_id: number
  description: string
  amount: string
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'partial'
  due_date: string
}

export default function ARInvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7))
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [monthYear, filterStatus])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const month = monthYear.replace('-', '')
      const params = new URLSearchParams({ month_year: month })
      if (filterStatus) params.append('status', filterStatus)

      const { data } = await api.get(`/api/v1/ar/invoice?${params}`)
      setInvoices(data.items || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ร่าง' },
      issued: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ส่งแล้ว' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'จ่ายแล้ว' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'จ่ายบางส่วน' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'ค้างชำระ' }
    }
    const badge = badges[status] || badges.draft
    return `${badge.bg} ${badge.text}`
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ใบแจ้งหนี้</h2>
        <button
          onClick={() => navigate('/ar/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + สร้างใบแจ้งหนี้ใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">ทั้งหมด</option>
              <option value="draft">ร่าง</option>
              <option value="issued">ส่งแล้ว</option>
              <option value="paid">จ่ายแล้ว</option>
              <option value="partial">จ่ายบางส่วน</option>
              <option value="overdue">ค้างชำระ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">เลขที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">รายละเอียด</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">วันที่ออก</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">วันครบกำหนด</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">จำนวนเงิน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  ไม่มีข้อมูลใบแจ้งหนี้
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_no}</td>
                  <td className="px-6 py-4 text-gray-700">{inv.description}</td>
                  <td className="px-6 py-4 text-gray-700">{formatThaiDate(new Date(inv.invoice_date))}</td>
                  <td className="px-6 py-4 text-gray-700">{formatThaiDate(new Date(inv.due_date))}</td>
                  <td className="px-6 py-4 text-right font-medium">฿{formatCurrency(parseFloat(inv.amount))}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(inv.status)}`}>
                      {inv.status === 'draft' && 'ร่าง'}
                      {inv.status === 'issued' && 'ส่งแล้ว'}
                      {inv.status === 'paid' && 'จ่ายแล้ว'}
                      {inv.status === 'partial' && 'จ่ายบางส่วน'}
                      {inv.status === 'overdue' && 'ค้างชำระ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/ar/${inv.id}`)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      ดู
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
