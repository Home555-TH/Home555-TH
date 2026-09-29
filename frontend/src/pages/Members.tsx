import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { formatCurrency, getDebtLevel, getMemberStatusLabel } from '../utils/format'
import toast from 'react-hot-toast'

interface Member {
  id: number
  house_no: string
  name: string
  phone?: string
  email?: string
  outstanding_balance: number
  status: string
}

interface MemberFormData {
  house_no: string
  name: string
  phone?: string
  email?: string
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberFormData>()

  useEffect(() => {
    fetchMembers()
  }, [search])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/members', { params: { search, limit: 500 } })
      setMembers(data.items)
    } catch (err) {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (editingId) {
        await api.put(`/members/${editingId}`, data)
        toast.success('แก้ไขสมาชิกสำเร็จ')
      } else {
        await api.post('/members', data)
        toast.success('เพิ่มสมาชิกสำเร็จ')
      }
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchMembers()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('ยืนยันการลบ?')) return
    try {
      await api.delete(`/members/${id}`)
      toast.success('ลบสมาชิกสำเร็จ')
      fetchMembers()
    } catch (err) {
      toast.error('ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">จัดการสมาชิก</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); reset() }}
          className="btn-primary"
        >
          + เพิ่มสมาชิก
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="ค้นหาจากชื่อ, เลขบ้าน, อีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">{editingId ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">เลขบ้าน</label>
              <input
                {...register('house_no', { required: 'จำเป็นต้องกรอก' })}
                className="input"
                placeholder="369/001"
              />
              {errors.house_no && <p className="text-red-500 text-xs mt-1">{errors.house_no.message}</p>}
            </div>

            <div>
              <label className="label">ชื่อ</label>
              <input
                {...register('name', { required: 'จำเป็นต้องกรอก' })}
                className="input"
                placeholder="ชื่อเจ้าของบ้าน"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">เบอร์โทร</label>
                <input {...register('phone')} className="input" placeholder="08x-xxxx-xxxx" />
              </div>
              <div>
                <label className="label">อีเมล</label>
                <input {...register('email')} className="input" type="email" placeholder="email@example.com" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">บันทึก</button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); reset() }}
                className="btn-secondary flex-1"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Table */}
      {loading ? (
        <div className="text-center py-10">กำลังโหลด...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">เลขบ้าน</th>
                <th className="table-header">ชื่อ</th>
                <th className="table-header text-right">ยอดค้างชำระ</th>
                <th className="table-header text-center">ระดับ</th>
                <th className="table-header text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const { label, className } = getDebtLevel(member.outstanding_balance)
                return (
                  <tr key={member.id} className="table-row">
                    <td className="table-cell font-medium">{member.house_no}</td>
                    <td className="table-cell">{member.name}</td>
                    <td className="table-cell text-right">฿{formatCurrency(member.outstanding_balance)}</td>
                    <td className="table-cell text-center"><span className={`badge-success ${className}`}>{label}</span></td>
                    <td className="table-cell text-center space-x-2">
                      <button
                        onClick={() => { setShowForm(true); setEditingId(member.id) }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
