import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface AgingItem {
  member_id: number
  member_name: string
  house_no: string
  outstanding_balance: string
  days_overdue: number
  age_bucket: string
}

interface AgingReport {
  total_outstanding: string
  total_overdue: string
  age_0_30: string
  age_30_60: string
  age_60_90: string
  age_90_plus: string
  items: AgingItem[]
}

export default function ARAging() {
  const [report, setReport] = useState<AgingReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgingReport()
  }, [])

  const fetchAgingReport = async () => {
    try {
      const { data } = await api.get('/api/v1/ar/aging')
      setReport(data)
    } catch (err) {
      console.error('Error fetching aging report:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!report) return <div className="text-center py-10">ไม่สามารถโหลดข้อมูล</div>

  const getBucketColor = (ageBucket: string) => {
    if (ageBucket.includes('0-30')) return 'bg-blue-50 border-blue-200 text-blue-900'
    if (ageBucket.includes('30-60')) return 'bg-yellow-50 border-yellow-200 text-yellow-900'
    if (ageBucket.includes('60-90')) return 'bg-orange-50 border-orange-200 text-orange-900'
    return 'bg-red-50 border-red-200 text-red-900'
  }

  const getBadgeColor = (ageBucket: string) => {
    if (ageBucket.includes('0-30')) return 'bg-blue-100 text-blue-800'
    if (ageBucket.includes('30-60')) return 'bg-yellow-100 text-yellow-800'
    if (ageBucket.includes('60-90')) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">รายงานลูกหนี้ (AR Aging Report)</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-xs text-gray-600">ยอดค้างชำระทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900">฿{formatCurrency(parseFloat(report.total_outstanding))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-600">ยอดค้างชำระเกินกำหนด</p>
          <p className="text-2xl font-bold text-red-600">฿{formatCurrency(parseFloat(report.total_overdue))}</p>
        </div>
        <div className={`card border-2 ${getBucketColor('0-30')}`}>
          <p className="text-xs font-medium">0-30 วัน</p>
          <p className="text-xl font-bold">฿{formatCurrency(parseFloat(report.age_0_30))}</p>
        </div>
        <div className={`card border-2 ${getBucketColor('30-60')}`}>
          <p className="text-xs font-medium">30-60 วัน</p>
          <p className="text-xl font-bold">฿{formatCurrency(parseFloat(report.age_30_60))}</p>
        </div>
        <div className={`card border-2 ${getBucketColor('60-90')}`}>
          <p className="text-xs font-medium">60-90 วัน</p>
          <p className="text-xl font-bold">฿{formatCurrency(parseFloat(report.age_60_90))}</p>
        </div>
        <div className={`card border-2 ${getBucketColor('90+')}`}>
          <p className="text-xs font-medium">90+ วัน</p>
          <p className="text-xl font-bold">฿{formatCurrency(parseFloat(report.age_90_plus))}</p>
        </div>
      </div>

      {/* Detail Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-4">รายละเอียดลูกหนี้</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">บ้านเลขที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ชื่อสมาชิก</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">ค้างชำระ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">อายุ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">วันค้าง</th>
            </tr>
          </thead>
          <tbody>
            {report.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  ไม่มีลูกหนี้ค้างชำระ
                </td>
              </tr>
            ) : (
              report.items.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.house_no}</td>
                  <td className="px-6 py-4 text-gray-700">{item.member_name}</td>
                  <td className="px-6 py-4 text-right font-medium">฿{formatCurrency(parseFloat(item.outstanding_balance))}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getBadgeColor(item.age_bucket)}`}>
                      {item.age_bucket}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{item.days_overdue} วัน</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
