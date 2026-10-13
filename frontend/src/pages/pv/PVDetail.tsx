import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'
import { useAuth } from '../../hooks/useAuth'

interface PaymentVoucherDetail {
  id: number
  pv_no: string
  pv_date: string
  vendor_name: string
  description: string
  amount: string
  vat_rate: string
  vat_amount: string
  wht_rate: string
  wht_amount: string
  net_amount: string
  status: 'draft' | 'approved' | 'void' | 'paid'
  approved_by?: number
  approved_date?: string
  void_reason?: string
  account_id: number
}

export default function PVDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pv, setPV] = useState<PaymentVoucherDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [showVoidDialog, setShowVoidDialog] = useState(false)

  useEffect(() => {
    fetchPV()
  }, [id])

  const fetchPV = async () => {
    try {
      const { data } = await api.get(`/api/v1/pv/${id}`)
      setPV(data)
    } catch (err) {
      console.error('Error fetching PV:', err)
      alert('ไม่สามารถโหลดข้อมูล')
      navigate('/pv')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!pv || actionLoading) return

    try {
      setActionLoading(true)
      await api.post(`/api/v1/pv/${id}/approve`)
      alert('อนุมัติสำเร็จ')
      fetchPV()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  const handleVoid = async () => {
    if (!pv || !voidReason.trim() || actionLoading) return

    try {
      setActionLoading(true)
      await api.post(`/api/v1/pv/${id}/void`, { void_reason: voidReason })
      alert('ยกเลิกสำเร็จ')
      setShowVoidDialog(false)
      fetchPV()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!pv) return <div className="text-center py-10">ไม่พบข้อมูล</div>

  const canApprove = pv.status === 'draft' && (user?.role === 'super_admin' || user?.role === 'admin')
  const canVoid = (pv.status === 'draft' || pv.status === 'approved') && (user?.role === 'super_admin' || user?.role === 'admin')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{pv.pv_no}</h2>
        <button
          onClick={() => navigate('/pv')}
          className="text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${
          pv.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          pv.status === 'approved' ? 'bg-green-100 text-green-800' :
          pv.status === 'void' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {pv.status === 'draft' && 'ร่าง'}
          {pv.status === 'approved' && 'อนุมัติแล้ว'}
          {pv.status === 'void' && 'ยกเลิก'}
          {pv.status === 'paid' && 'จ่ายแล้ว'}
        </span>
      </div>

      {/* Details */}
      <div className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">ผู้ขาย</p>
            <p className="text-lg font-semibold text-gray-900">{pv.vendor_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">วันที่</p>
            <p className="text-lg font-semibold text-gray-900">{formatThaiDate(new Date(pv.pv_date))}</p>
          </div>
        </div>

        {pv.description && (
          <div>
            <p className="text-sm text-gray-600">รายละเอียด</p>
            <p className="text-gray-900">{pv.description}</p>
          </div>
        )}

        {/* Calculation */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">จำนวนเงิน:</span>
            <span className="font-medium">฿{formatCurrency(parseFloat(pv.amount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">VAT {pv.vat_rate}%:</span>
            <span className="font-medium">฿{formatCurrency(parseFloat(pv.vat_amount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">หักภาษี {pv.wht_rate}%:</span>
            <span className="font-medium">-฿{formatCurrency(parseFloat(pv.wht_amount))}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold">จ่ายจริง:</span>
            <span className="font-bold text-lg text-blue-600">฿{formatCurrency(parseFloat(pv.net_amount))}</span>
          </div>
        </div>

        {pv.approved_date && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>อนุมัติโดย:</strong> {pv.approved_by} <br />
              <strong>วันที่อนุมัติ:</strong> {formatThaiDate(new Date(pv.approved_date))}
            </p>
          </div>
        )}

        {pv.void_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>เหตุผลการยกเลิก:</strong> {pv.void_reason}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={() => navigate('/pv')}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          ย้อนกลับ
        </button>

        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading ? 'กำลังประมวลผล...' : 'อนุมัติ'}
          </button>
        )}

        {canVoid && (
          <button
            onClick={() => setShowVoidDialog(true)}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            ยกเลิก
          </button>
        )}
      </div>

      {/* Void Dialog */}
      {showVoidDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ยกเลิกใบสำคัญจ่าย</h3>
            <p className="text-gray-600 mb-4">กรุณาระบุเหตุผลการยกเลิก</p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="เช่น ซ้ำการบันทึก, ข้อมูลผิด"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowVoidDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'กำลังประมวลผล...' : 'ยืนยันการยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
