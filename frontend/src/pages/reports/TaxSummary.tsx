import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface TaxSummaryData {
  statement_date: string
  payment_vouchers: {
    count: number
    total_amount: string
    vat_7_percent: string
    withholding_tax_3_percent: string
  }
  revenue: {
    count: number
    total: string
  }
  tax_summary: {
    vat_payable: string
    wht_deductible: string
    net_tax: string
  }
  organization: string
  currency: string
}

export default function TaxSummary() {
  const [summary, setSummary] = useState<TaxSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/api/v1/reports/tax-summary')
      setSummary(data)
    } catch (err) {
      console.error('Error fetching tax summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!summary) return <div className="text-center py-10">ไม่สามารถโหลดข้อมูล</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{summary.organization}</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">สรุปภาษี (Tax Summary)</h3>
        <p className="text-sm text-gray-600">ณ วันที่ {formatThaiDate(new Date(summary.statement_date))}</p>
      </div>

      {/* VAT Section */}
      <div className="card space-y-4">
        <h4 className="font-bold text-gray-900 text-lg">ภาษีมูลค่าเพิ่ม (VAT)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">อัตราภาษี</p>
            <p className="text-2xl font-bold text-blue-900">7%</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">VAT ที่ต้องจ่าย</p>
            <p className="text-2xl font-bold text-green-900">฿{formatCurrency(parseFloat(summary.tax_summary.vat_payable))}</p>
          </div>
        </div>
      </div>

      {/* WHT Section */}
      <div className="card space-y-4">
        <h4 className="font-bold text-gray-900 text-lg">ภาษีที่หักไว้ (Withholding Tax)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700">อัตราภาษี</p>
            <p className="text-2xl font-bold text-orange-900">3%</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-700">WHT ที่หักได้</p>
            <p className="text-2xl font-bold text-purple-900">฿{formatCurrency(parseFloat(summary.tax_summary.wht_deductible))}</p>
          </div>
        </div>
      </div>

      {/* Payment Vouchers Summary */}
      <div className="card space-y-4">
        <h4 className="font-bold text-gray-900 text-lg">ใบสำคัญจ่าย (Payment Vouchers)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">จำนวนใบ</p>
            <p className="text-2xl font-bold text-gray-900">{summary.payment_vouchers.count}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">จำนวนเงิน</p>
            <p className="text-2xl font-bold text-gray-900">฿{formatCurrency(parseFloat(summary.payment_vouchers.total_amount))}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">VAT 7%</p>
            <p className="text-2xl font-bold text-gray-900">฿{formatCurrency(parseFloat(summary.payment_vouchers.vat_7_percent))}</p>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="card space-y-4">
        <h4 className="font-bold text-gray-900 text-lg">รายได้ (Revenue)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">จำนวนใบแจ้งหนี้</p>
            <p className="text-2xl font-bold text-green-900">{summary.revenue.count}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">รวมรายได้</p>
            <p className="text-2xl font-bold text-green-900">฿{formatCurrency(parseFloat(summary.revenue.total))}</p>
          </div>
        </div>
      </div>

      {/* Net Tax */}
      <div className="card bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-indigo-900 text-lg">ภาษีสุทธิ (Net Tax)</span>
          <span className="text-3xl font-bold text-indigo-900">
            ฿{formatCurrency(parseFloat(summary.tax_summary.net_tax))}
          </span>
        </div>
        <p className="text-sm text-indigo-700 mt-2">VAT ที่ต้องจ่าย ลบ WHT ที่หักได้</p>
      </div>

      {/* Footer */}
      <div className="card flex justify-between text-sm text-gray-600">
        <div>วันพิมพ์: {formatThaiDate(new Date())}</div>
        <div>สกุลเงิน: {summary.currency}</div>
      </div>

      {/* Print Button */}
      <div className="text-center">
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
