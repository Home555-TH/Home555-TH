import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface BankTransaction {
  id: number
  transaction_date: string
  description: string
  amount: string
  type: 'income' | 'expense'
  status: 'pending' | 'matched' | 'reconciled' | 'unmatched'
  is_internal_transfer: boolean
}

interface ReconciliationSummary {
  total_transactions: number
  pending_count: number
  matched_count: number
  reconciled_count: number
  unmatched_count: number
  total_income: string
  total_expense: string
  net_amount: string
}

export default function BankReconciliation() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null)
  const [reconcileDialog, setReconcileDialog] = useState(false)
  const [matchedTo, setMatchedTo] = useState('Other')
  const [pvId, setPVId] = useState('')
  const [arReceiptId, setARReceiptId] = useState('')

  useEffect(() => {
    fetchData()
  }, [filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [txnRes, summaryRes] = await Promise.all([
        api.get(`/api/v1/bank/transactions?status=${filterStatus}`),
        api.get('/api/v1/bank/reconciliation')
      ])
      setTransactions(txnRes.data.items || [])
      setSummary(summaryRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReconcile = async () => {
    if (!selectedTxnId) return

    try {
      const payload: any = {
        matched_to: matchedTo
      }
      if (matchedTo === 'PV' && pvId) {
        payload.pv_id = parseInt(pvId)
      } else if (matchedTo === 'AR' && arReceiptId) {
        payload.ar_receipt_id = parseInt(arReceiptId)
      }

      await api.put(`/api/v1/bank/reconcile/${selectedTxnId}`, payload)
      alert('บันทึกการยืนยันสำเร็จ')
      setReconcileDialog(false)
      setSelectedTxnId(null)
      setPVId('')
      setARReceiptId('')
      fetchData()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message))
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ธนาคาร - ยืนยันรายการ</h2>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card">
            <p className="text-xs text-gray-600">รวมทั้งสิ้น</p>
            <p className="text-xl font-bold text-gray-900">{summary.total_transactions}</p>
          </div>
          <div className="card bg-yellow-50">
            <p className="text-xs text-yellow-800 font-medium">รอยืนยัน</p>
            <p className="text-xl font-bold text-yellow-900">{summary.pending_count}</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-xs text-green-800 font-medium">ยืนยันแล้ว</p>
            <p className="text-xl font-bold text-green-900">{summary.reconciled_count}</p>
          </div>
          <div className="card bg-blue-50">
            <p className="text-xs text-blue-800 font-medium">รายได้</p>
            <p className="text-lg font-bold text-blue-900">฿{formatCurrency(parseFloat(summary.total_income))}</p>
          </div>
          <div className="card bg-red-50">
            <p className="text-xs text-red-800 font-medium">ค่าใช้จ่าย</p>
            <p className="text-lg font-bold text-red-900">฿{formatCurrency(parseFloat(summary.total_expense))}</p>
          </div>
          <div className="card bg-purple-50">
            <p className="text-xs text-purple-800 font-medium">สุทธิ</p>
            <p className="text-lg font-bold text-purple-900">฿{formatCurrency(parseFloat(summary.net_amount))}</p>
          </div>
        </div>
      )}

      {/* Filter & Import */}
      <div className="card space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pending">รอยืนยัน</option>
              <option value="reconciled">ยืนยันแล้ว</option>
              <option value="unmatched">ไม่ตรงกัน</option>
              <option value="">ทั้งหมด</option>
            </select>
          </div>
          <button
            onClick={() => alert('ฟีเจอร์นำเข้า CSV ยังอยู่ระหว่างการพัฒนา')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📥 นำเข้า CSV
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">วันที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">รายละเอียด</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ประเภท</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">จำนวน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  ไม่มีรายการที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{formatThaiDate(new Date(txn.transaction_date))}</td>
                  <td className="px-6 py-4 text-sm">
                    {txn.description}
                    {txn.is_internal_transfer && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">โอนภายใน</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${txn.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {txn.type === 'income' ? 'รายได้' : 'ค่าใช้จ่าย'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'income' ? '+' : '-'}฿{formatCurrency(parseFloat(txn.amount))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      txn.status === 'reconciled' ? 'bg-green-100 text-green-800' :
                      txn.status === 'matched' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {txn.status === 'pending' && 'รอยืนยัน'}
                      {txn.status === 'reconciled' && 'ยืนยันแล้ว'}
                      {txn.status === 'matched' && 'ตรงกัน'}
                      {txn.status === 'unmatched' && 'ไม่ตรงกัน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedTxnId(txn.id)
                        setReconcileDialog(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      ยืนยัน
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reconcile Dialog */}
      {reconcileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ยืนยันรายการ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ตรงกับ</label>
                <select
                  value={matchedTo}
                  onChange={(e) => setMatchedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Other">อื่น ๆ</option>
                  <option value="PV">ใบสำคัญจ่าย (PV)</option>
                  <option value="AR">ใบแจ้งหนี้ (AR)</option>
                </select>
              </div>

              {matchedTo === 'PV' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลขที่ PV</label>
                  <input
                    type="number"
                    placeholder="ID ของ PV"
                    value={pvId}
                    onChange={(e) => setPVId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {matchedTo === 'AR' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลขที่ใบเสร็จ AR</label>
                  <input
                    type="number"
                    placeholder="ID ของ AR Receipt"
                    value={arReceiptId}
                    onChange={(e) => setARReceiptId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setReconcileDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReconcile}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                บันทึกการยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
