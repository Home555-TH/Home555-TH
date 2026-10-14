import React, { useState, useEffect } from 'react'
import api from '../../api/client'
import { formatThaiDate } from '../../utils/format'

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  position: string
  status: string
  salary: number
  start_date: string
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/api/v1/hr/employee')
      setEmployees(data)
    } catch (err) {
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">👥 รายชื่อพนักงาน</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ➕ เพิ่มพนักงาน
        </button>
      </div>

      {/* Create Form */}
      {showForm && <EmployeeForm onSuccess={() => { fetchEmployees(); setShowForm(false) }} />}

      {/* Employees Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">รหัส</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">ชื่อ</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">ตำแหน่ง</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">เงินเดือน</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">วันเริ่มงาน</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{emp.employee_id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{emp.first_name} {emp.last_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{emp.position}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">฿{(emp.salary || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatThaiDate(new Date(emp.start_date))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    emp.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {emp.status === 'active' ? '✅ ทำงาน' : '❌ ไม่ทำงาน'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    position: 'staff',
    salary: 0,
    start_date: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    id_card_number: '',
    tax_id: '',
    bank_account: '',
    bank_name: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/v1/hr/employee', formData)
      alert('เพิ่มพนักงานสำเร็จ')
      onSuccess()
    } catch (err) {
      alert('เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-bold text-lg text-gray-900">เพิ่มพนักงานใหม่</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="ชื่อ"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="นามสกุล"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="staff">พนักงาน</option>
          <option value="manager">หัวหน้า</option>
          <option value="director">ผู้บริหาร</option>
          <option value="security">ยามรักษาการ</option>
          <option value="maintenance">ช่างซ่อม</option>
        </select>
        <input
          type="number"
          placeholder="เงินเดือน"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="email"
          placeholder="อีเมล"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="tel"
          placeholder="เบอร์โทร"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          placeholder="เลขประจำตัวประชาชน"
          value={formData.id_card_number}
          onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <div className="col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}
