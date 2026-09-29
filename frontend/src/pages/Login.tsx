import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import toast from 'react-hot-toast'

interface FormData {
  email: string
  password: string
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Wilairat ERP</h1>
          <p className="text-gray-500 text-sm mt-1">นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">อีเมล</label>
            <input
              type="email"
              className="input"
              placeholder="email@example.com"
              {...register('email', { required: 'กรุณากรอกอีเมล' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">© 2024 บ้านวิไลรัตน์ นิติบุคคลหมู่บ้านจัดสรร</p>
      </div>
    </div>
  )
}
