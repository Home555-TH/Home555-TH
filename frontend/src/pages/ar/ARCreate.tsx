import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../api/client'
import { formatCurrency, formatThaiDate } from '../../utils/format'

interface MemberOption {
  id: number
  house_no: string
  name: string
  outstanding_balance: number
}

interface ARFormData {
  member_id: number
  invoice_date: string
  due_date: string
  description: string
  amount: number
}

export default function ARCreate() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ARFormData>({
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 0
    }
  })

  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const selectedMemberId = watch('member_id')
  const selectedMember = members.find(m => m.id === selectedMemberId)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/api/members?limit=500')
      setMembers(data.items || [])
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (formData: ARFormData) => {
    try {
      setSubmitting(true)
      const payload = {
        member_id: formData.member_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        description: formData.description,
        amount: formData.amount
      }

      const { data } = await api.post('/api/v1/ar/invoice', payload)
      navigate(`/ar/${data.id}`)
    } catch (err: any) {
      console.error('Error creating invoice:', err.response?.data || err)
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">สร้างใบแจ้งหนี้ใหม่</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {/* Member Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">เลือกสมาชิก</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สมาชิก *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              {...register('member_id', { required: 'กรุณาเลือกสมาชิก' })}
            >
              <option value="">-- เลือกสมาชิก --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.house_no} - {member.name}
                </option>
              ))}
            </select>
            {errors.member_id && <p className="text-red-500 text-sm mt-1">{errors.member_id.message}</p>}
          </div>

          {selectedMember && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>บ้านเลขที่:</strong> {selectedMember.house_no} | <strong>ชื่อ:</strong> {selectedMember.name}
              </p>
              <p className="text-sm text-blue-900">
                <strong>ยอดค้างชำระปัจจุบัน:</strong> ฿{formatCurrency(selectedMember.outstanding_balance)}
              </p>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">รายละเอียดใบแจ้งหนี้</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ออกใบแจ้งหนี้ *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('invoice_date', { required: 'กรุณาระบุวันที่' })}
              />
              {errors.invoice_date && <p className="text-red-500 text-sm mt-1">{errors.invoice_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันครบกำหนด *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                {...register('due_date', { required: 'กรุณาระบุวันครบกำหนด' })}
              />
              {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด *</label>
            <input
              type="text"
              placeholder="เช่น ค่าสมาชิก มกราคม 2568"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              {...register('description', { required: 'กรุณาระบุรายละเอียด' })}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

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
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={() => navigate('/ar')}
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
