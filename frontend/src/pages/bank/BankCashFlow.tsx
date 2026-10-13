import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency } from '../../utils/format'

interface CashFlowItem {
  month_year: string
  income: string
  expense: string
  net: string
}

interface CashFlowReport {
  items: CashFlowItem[]
  total_income: string
  total_expense: string
  net_total: string
}

export default function BankCashFlow() {
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCashFlow()
  }, [])

  const fetchCashFlow = async () => {
    try {
      const { data } = await api.get('/api/v1/bank/cash-flow')
      setCashFlow(data)
    } catch (err) {
      console.error('Error fetching cash flow:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMonthYear = (monthYear: string) => {
    const year = parseInt(monthYear.substring(0, 4))
    const month = parseInt(monthYear.substring(4, 6))
    const months = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    return `${months[month]} ${year + 543}`
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!cashFlow) return <div className="text-center py-10">ไม่สามารถโหลดข้อมูล</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">กระแสเงินสด (Cash Flow)</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-green-50">
          <p className="text-xs text-green-700 font-medium">รายได้รวม</p>
          <p className="text-2xl font-bold text-green-900">฿{formatCurrency(parseFloat(cashFlow.total_income))}</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-xs text-red-700 font-medium">ค่าใช้จ่ายรวม</p>
          <p className="text-2xl font-bold text-red-900">฿{formatCurrency(parseFloat(cashFlow.total_expense))}</p>
        </div>
        <div className={`card ${parseFloat(cashFlow.net_total) >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium ${parseFloat(cashFlow.net_total) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            กระแสเงินสดสุทธิ
          </p>
          <p className={`text-2xl font-bold ${parseFloat(cashFlow.net_total) >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            {parseFloat(cashFlow.net_total) >= 0 ? '+' : ''}฿{formatCurrency(parseFloat(cashFlow.net_total))}
          </p>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-4">รายละเอียดรายเดือน</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">เดือน</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">รายได้</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">ค่าใช้จ่าย</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">สุทธิ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {cashFlow.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  ไม่มีข้อมูลกระแสเงินสด
                </td>
              </tr>
            ) : (
              cashFlow.items.map((item, idx) => {
                const netAmount = parseFloat(item.net)
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{formatMonthYear(item.month_year)}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      +฿{formatCurrency(parseFloat(item.income))}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      -฿{formatCurrency(parseFloat(item.expense))}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netAmount >= 0 ? '+' : ''}฿{formatCurrency(netAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        netAmount > 0 ? 'bg-green-100 text-green-800' :
                        netAmount < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {netAmount > 0 && 'เศษเหลือ'}
                        {netAmount < 0 && 'ขาดทุน'}
                        {netAmount === 0 && 'เท่ากัน'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Chart - Simple Text Visualization */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">การเปรียบเทียบรายเดือน</h3>
        <div className="space-y-4">
          {cashFlow.items.map((item, idx) => {
            const income = parseFloat(item.income)
            const expense = parseFloat(item.expense)
            const maxAmount = Math.max(...cashFlow.items.map(i => Math.max(parseFloat(i.income), parseFloat(i.expense))))
            const incomeWidth = (income / maxAmount) * 100
            const expenseWidth = (expense / maxAmount) * 100

            return (
              <div key={idx}>
                <p className="text-xs font-medium text-gray-700 mb-1">{formatMonthYear(item.month_year)}</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="bg-green-100 rounded h-6 flex items-center pl-2" style={{ width: `${Math.max(incomeWidth, 5)}%` }}>
                      <span className="text-xs font-semibold text-green-800">฿{formatCurrency(income)}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-red-100 rounded h-6 flex items-center pl-2" style={{ width: `${Math.max(expenseWidth, 5)}%` }}>
                      <span className="text-xs font-semibold text-red-800">฿{formatCurrency(expense)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
