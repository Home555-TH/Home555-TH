import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface PaymentVoucher {
  id: number
  pv_no: string
  pv_date: string
  vendor_name: string
  net_amount: string
  status: 'draft' | 'approved' | 'void' | 'paid'
  approved_date?: string
}

export default function PVList() {
  const navigate = useNavigate()
  const [pvs, setPVs] = useState<PaymentVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7))
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchPVs()
  }, [monthYear, filterStatus])

  const fetchPVs = async () => {
    try {
      setLoading(true)
      const month = monthYear.replace('-', '')
      const params = new URLSearchParams({ month_year: month })
      if (filterStatus) params.append('status', filterStatus)

      const { data } = await api.get(`/api/v1/pv?${params}`)
      setPVs(data.items || [])
    } catch (err) {
      console.error('Error fetching PVs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ร่าง' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'อนุมัติแล้ว' },
      void: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ยกเลิก' },
      paid: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'จ่ายแล้ว' }
    }
    const badge = badges[status] || badges.draft
    return `${badge.bg} ${badge.text}`
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ใบสำคัญจ่าย</h2>
        <button
          onClick={() => navigate('/pv/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + สร้างใบสำคัญจ่ายใหม่
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
              <option value="approved">อนุมัติแล้ว</option>
              <option value="paid">จ่ายแล้ว</option>
              <option value="void">ยกเลิก</option>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">วันที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ผู้ขาย</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">จำนวนเงิน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {pvs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  ไม่มีข้อมูลใบสำคัญจ่าย
                </td>
              </tr>
            ) : (
              pvs.map((pv) => (
                <tr key={pv.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{pv.pv_no}</td>
                  <td className="px-6 py-4 text-gray-700">{formatThaiDate(new Date(pv.pv_date))}</td>
                  <td className="px-6 py-4 text-gray-700">{pv.vendor_name}</td>
                  <td className="px-6 py-4 text-right font-medium">฿{formatCurrency(parseFloat(pv.net_amount))}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(pv.status)}`}>
                      {['draft', 'approved', 'void', 'paid'][['draft', 'approved', 'void', 'paid'].indexOf(pv.status)] === 'draft' && 'ร่าง'}
                      {['draft', 'approved', 'void', 'paid'][['draft', 'approved', 'void', 'paid'].indexOf(pv.status)] === 'approved' && 'อนุมัติแล้ว'}
                      {['draft', 'approved', 'void', 'paid'][['draft', 'approved', 'void', 'paid'].indexOf(pv.status)] === 'void' && 'ยกเลิก'}
                      {['draft', 'approved', 'void', 'paid'][['draft', 'approved', 'void', 'paid'].indexOf(pv.status)] === 'paid' && 'จ่ายแล้ว'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/pv/${pv.id}`)}
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
