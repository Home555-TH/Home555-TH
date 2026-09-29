import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface OrgSettings {
  org_name: string
  org_address: string
  org_tax_id: string
  org_phone: string
  promptpay_phone: string
}

export default function Settings() {
  const [tab, setTab] = useState<'org' | 'users' | 'backup'>('org')
  const { register, handleSubmit, watch } = useForm<OrgSettings>({
    defaultValues: {
      org_name: 'นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์',
      org_address: '369/664 หมู่ 1 ต.ดาสิทธิ์ อ.ปลวกแดง จ.ระยอง 21140',
      org_tax_id: '099-4-00275034-7',
      promptpay_phone: '0655755867',
    }
  })

  const onSubmit = async (data: OrgSettings) => {
    try {
      // Save settings to backend later
      toast.success('บันทึกการตั้งค่าสำเร็จ')
    } catch (err) {
      toast.error('บันทึกไม่สำเร็จ')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ตั้งค่า</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'org' as const, label: '📋 ข้อมูลองค์กร' },
          { key: 'users' as const, label: '👥 จัดการผู้ใช้' },
          { key: 'backup' as const, label: '💾 Backup' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Organization Settings */}
      {tab === 'org' && (
        <div className="card max-w-2xl">
          <h3 className="font-semibold mb-6">ข้อมูลองค์กร</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">ชื่อองค์กร</label>
              <input {...register('org_name')} className="input" />
            </div>

            <div>
              <label className="label">ที่อยู่</label>
              <textarea {...register('org_address')} className="input" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">เลขประจำตัวภาษี</label>
                <input {...register('org_tax_id')} className="input" />
              </div>
              <div>
                <label className="label">เบอร์โทรศัพท์</label>
                <input {...register('org_phone')} className="input" />
              </div>
            </div>

            <div>
              <label className="label">PromptPay Phone</label>
              <input {...register('promptpay_phone')} className="input" />
            </div>

            <button type="submit" className="btn-primary">บันทึกการตั้งค่า</button>
          </form>
        </div>
      )}

      {/* User Management */}
      {tab === 'users' && (
        <div className="card max-w-2xl">
          <h3 className="font-semibold mb-6">จัดการผู้ใช้ (Coming Soon)</h3>
          <p className="text-gray-600">ฟีเจอร์นี้กำลังพัฒนา...</p>
        </div>
      )}

      {/* Backup */}
      {tab === 'backup' && (
        <div className="card max-w-2xl">
          <h3 className="font-semibold mb-6">Backup & Export</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full justify-center">📥 สำรองข้อมูลตอนนี้</button>
            <button className="btn-secondary w-full justify-center">📤 ส่งออก Excel</button>
          </div>
          <p className="text-xs text-gray-500 mt-4">ฟีเจอร์นี้กำลังพัฒนา...</p>
        </div>
      )}
    </div>
  )
}
