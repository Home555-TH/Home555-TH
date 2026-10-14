import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface PayrollRecord {
  id: number
  employee_id: number
  payroll_no: string
  month_year: string
  base_salary: number
  gross_salary: number
  total_deduction: number
  net_pay: number
  status: string
  payroll_date: string
}

export default function Payroll() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchPayrollSummary()
  }, [monthYear])

  const fetchPayrollSummary = async () => {
    try {
      const { data } = await api.get(`/api/v1/hr/payroll-summary/${monthYear}`)
      setPayrolls(data.payrolls || [])
      setSummary(data)
    } catch (err) {
      console.error('Error fetching payroll:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">💰 เงินเดือน</h2>
        <input
          type="month"
          value={monthYear}
          onChange={(e) => setMonthYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-700">จำนวนพนักงาน</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total_employees}</p>
          </div>
          <div className="card bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">รวมเงินเดือน</p>
            <p className="text-2xl font-bold text-green-900">฿{formatCurrency(summary.total_gross)}</p>
          </div>
          <div className="card bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm text-orange-700">หักภาษี</p>
            <p className="text-2xl font-bold text-orange-900">฿{formatCurrency(summary.total_tax)}</p>
          </div>
          <div className="card bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm text-purple-700">เงินสุทธิ</p>
            <p className="text-2xl font-bold text-purple-900">฿{formatCurrency(summary.total_net)}</p>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">เลขที่</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">พนักงาน</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">เงินเดือน</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">หัก</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">สุทธิ</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">สถานะ</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => (
              <tr key={payroll.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{payroll.payroll_no}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{payroll.employee_id}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">฿{formatCurrency(payroll.gross_salary)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">฿{formatCurrency(payroll.total_deduction)}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-green-600">฿{formatCurrency(payroll.net_pay)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    payroll.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : payroll.status === 'approved'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payroll.status === 'paid' ? '✅ จ่ายแล้ว' : payroll.status === 'approved' ? '✓ อนุมัติ' : '⏳ ร่าง'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {payroll.status === 'draft' && (
                    <button className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      อนุมัติ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
