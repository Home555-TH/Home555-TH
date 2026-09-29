import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { formatCurrency } from '../utils/format'

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/members/summary')
      setSummary(data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-gray-600 text-sm">สมาชิกทั้งหมด</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{summary?.total_members || 0}</div>
          <div className="text-xs text-gray-500 mt-1">หมู่บ้าน</div>
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm">ยอดค้างชำระทั้งหมด</div>
          <div className="text-3xl font-bold text-red-600 mt-2">฿{formatCurrency(summary?.total_outstanding || 0)}</div>
          <div className="text-xs text-gray-500 mt-1">รวม</div>
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm">สถานะระบบ</div>
          <div className="text-3xl font-bold text-green-600 mt-2">✓</div>
          <div className="text-xs text-green-600 mt-1">ปกติ</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/members" className="block text-center p-4 rounded-lg border-2 border-blue-200 hover:bg-blue-50 transition-colors">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm font-medium text-gray-900">จัดการสมาชิก</div>
          </a>
          <a href="/settings" className="block text-center p-4 rounded-lg border-2 border-green-200 hover:bg-green-50 transition-colors">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-sm font-medium text-gray-900">ตั้งค่าระบบ</div>
          </a>
        </div>
      </div>
    </div>
  )
}
