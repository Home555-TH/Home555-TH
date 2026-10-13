import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../api/client'
import { formatCurrency } from '../../utils/format'

interface COAOption {
  id: number
  account_code: string
  account_name: string
}

interface PVFormData {
  vendor_name: string
  description: string
  pv_date: string
  account_id: number
  amount: number
  vat_rate: number
  wht_rate: number
}

export default function PVCreate() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PVFormData>({
    defaultValues: {
      pv_date: new Date().toISOString().split('T')[0],
      vat_rate: 7,
      wht_rate: 3,
      amount: 0
    }
  })

  const [coa, setCOA] = useState<COAOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const amount = watch('amount')
  const vatRate = watch('vat_rate')
  const whtRate = watch('wht_rate')

  // Recalculate on amount/rates change
  const vatAmount = amount * (vatRate / 100)
  const whtAmount = amount * (whtRate / 100)
  const netAmount = amount + vatAmount - whtAmount

  useEffect(() => {
    fetchCOA()
  }, [])

  const fetchCOA = async () => {
    try {
      const { data } = await api.get('/api/v1/coa')
      // Filter to expense accounts (5xxx-6xxx)
      const expenses = data.filter((acc: any) => acc.account_code.startsWith('5') || acc.account_code.startsWith('6'))
      setCOA(expenses)
    } catch (err) {
      console.error('Error fetching COA:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (formData: PVFormData) => {
    try {
      setSubmitting(true)
      const payload = {
        vendor_name: formData.vendor_name,
        description: formData.description,
        pv_date: formData.pv_date,
        account_id: formData.account_id,
        amount: formData.amount,
        vat_rate: formData.vat_rate,
        wht_rate: formData.wht_rate
      }

      const { data } = await api.post('/api/v1/pv', payload)
      navigate(`/pv/${data.id}`)
    } catch (err: any) {
      console.error('Error creating PV:', err.response?.data || err)
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">สร้างใบสำคัญจ่ายใหม่</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {/* Vendor Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">ข้อมูลผู้ขาย</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ขาย / ผู้บริหาร *</label>
            <input
              type="text"
              placeholder="เช่น บริษัท ABC จำกัด"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              {...register('vendor_name', { required: 'กรุณาระบุชื่อผู้ขาย' })}
            />
            {errors.vendor_name && <p className="text-red-500 text-sm mt-1">{errors.vendor_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
            <textarea
              placeholder="ซ่อมไฟฟ้าพื้นที่ร่วม..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              {...register('description')}
            />
          </div>
        </div>

        {/* Document Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">ข้อมูลเอกสาร</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('pv_date', { required: 'กรุณาระบุวันที่' })}
              />
              {errors.pv_date && <p className="text-red-500 text-sm mt-1">{errors.pv_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">บัญชี *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('account_id', { required: 'กรุณาเลือกบัญชี' })}
              >
                <option value="">-- เลือกบัญชี --</option>
                {coa.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
              {errors.account_id && <p className="text-red-500 text-sm mt-1">{errors.account_id.message}</p>}
            </div>
          </div>
        </div>

        {/* Amount Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">จำนวนเงิน</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('amount', { required: 'กรุณาระบุจำนวนเงิน' })}
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">VAT (%) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('vat_rate')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WHT (%) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('wht_rate')}
              />
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700">จำนวนเงิน:</span>
            <span className="font-medium">฿{formatCurrency(amount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">VAT {vatRate}%:</span>
            <span className="font-medium">฿{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">หักภาษี {whtRate}%:</span>
            <span className="font-medium">-฿{formatCurrency(whtAmount)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold">จ่ายจริง:</span>
            <span className="font-bold text-lg text-blue-600">฿{formatCurrency(netAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={() => navigate('/pv')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกเป็นร่าง'}
          </button>
        </div>
      </form>
    </div>
  )
}
