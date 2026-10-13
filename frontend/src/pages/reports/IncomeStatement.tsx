import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface IncomeStatementData {
  statement_date: string
  revenue_accounts: any[]
  total_revenue: string
  expense_accounts: any[]
  total_expense: string
  net_profit: string
  organization: string
  currency: string
}

export default function IncomeStatement() {
  const [statement, setStatement] = useState<IncomeStatementData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatement()
  }, [])

  const fetchStatement = async () => {
    try {
      const { data } = await api.get('/api/v1/reports/income-statement')
      setStatement(data)
    } catch (err) {
      console.error('Error fetching income statement:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!statement) return <div className="text-center py-10">ไม่สามารถโหลดข้อมูล</div>

  const totalRevenue = parseFloat(statement.total_revenue)
  const totalExpense = parseFloat(statement.total_expense)
  const netProfit = parseFloat(statement.net_profit)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="card text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{statement.organization}</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">งบกำไรขาดทุน</h3>
        <p className="text-sm text-gray-600">ณ วันที่ {formatThaiDate(new Date(statement.statement_date))}</p>
      </div>

      {/* Statement */}
      <div className="card space-y-6">
        {/* Revenue Section */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-lg">รายได้</h4>
          <table className="w-full">
            <tbody>
              {statement.revenue_accounts.map((acc, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 text-gray-700 pl-6">{acc.name}</td>
                  <td className="py-2 text-right text-gray-600">-</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-900 font-bold">
                <td className="py-3 text-gray-900">รวมรายได้</td>
                <td className="py-3 text-right text-gray-900">฿{formatCurrency(totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expense Section */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-lg">ค่าใช้จ่าย</h4>
          <table className="w-full">
            <tbody>
              {statement.expense_accounts.map((acc, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 text-gray-700 pl-6">{acc.name}</td>
                  <td className="py-2 text-right text-gray-600">-</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-900 font-bold">
                <td className="py-3 text-gray-900">รวมค่าใช้จ่าย</td>
                <td className="py-3 text-right text-gray-900">-฿{formatCurrency(totalExpense)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Profit */}
        <div className="border-t-4 border-gray-900 pt-4">
          <table className="w-full">
            <tbody>
              <tr className="font-bold text-lg">
                <td className="py-3 text-gray-900">กำไรสุทธิ</td>
                <td className={`py-3 text-right text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''} ฿{formatCurrency(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="card mt-6 flex justify-between text-sm text-gray-600">
        <div>วันพิมพ์: {formatThaiDate(new Date())}</div>
        <div>สกุลเงิน: {statement.currency}</div>
      </div>

      {/* Print Button */}
      <div className="text-center mt-6">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🖨️ พิมพ์รายงาน
        </button>
      </div>
    </div>
  )
}
