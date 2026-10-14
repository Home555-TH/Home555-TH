import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/client'
import { formatThaiDate } from '../../utils/format'

interface MemberCRM {
  member_id: number
  interactions_count: number
  open_requests_count: number
  communications: Array<{ preference: string; value: string }>
  documents_count: number
}

export default function MemberProfile() {
  const { memberId } = useParams()
  const [crm, setCRM] = useState<MemberCRM | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchMemberCRM()
  }, [memberId])

  const fetchMemberCRM = async () => {
    try {
      const { data } = await api.get(`/api/v1/crm/member/${memberId}/summary`)
      setCRM(data)
    } catch (err) {
      console.error('Error fetching member CRM:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10">กำลังโหลด...</div>
  if (!crm) return <div className="text-center py-10">ไม่สามารถโหลดข้อมูล</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          📊 ภาพรวม
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'interactions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          📞 การติดต่อ
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          🎫 ร้องขอ/ปัญหา
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'documents'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          📄 เอกสาร
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">การติดต่อทั้งหมด</p>
            <p className="text-3xl font-bold text-blue-900">{crm.interactions_count}</p>
          </div>
          <div className="card bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700">ร้องขอที่เปิด</p>
            <p className="text-3xl font-bold text-orange-900">{crm.open_requests_count}</p>
          </div>
          <div className="card bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">ช่องทางการติดต่อ</p>
            <p className="text-3xl font-bold text-green-900">{crm.communications.length}</p>
          </div>
          <div className="card bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-700">เอกสารทั้งหมด</p>
            <p className="text-3xl font-bold text-purple-900">{crm.documents_count}</p>
          </div>
        </div>
      )}

      {/* Communications */}
      {activeTab === 'overview' && crm.communications.length > 0 && (
        <div className="card space-y-4">
          <h4 className="font-bold text-gray-900 text-lg">📱 ช่องทางการติดต่อ</h4>
          <div className="space-y-2">
            {crm.communications.map((comm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{comm.preference}</span>
                <span className="font-mono text-sm text-gray-900">{comm.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions Tab Content */}
      {activeTab === 'interactions' && (
        <InteractionsTab memberId={Number(memberId)} />
      )}

      {/* Requests Tab Content */}
      {activeTab === 'requests' && (
        <RequestsTab memberId={Number(memberId)} />
      )}

      {/* Documents Tab Content */}
      {activeTab === 'documents' && (
        <DocumentsTab memberId={Number(memberId)} />
      )}
    </div>
  )
}

function InteractionsTab({ memberId }: { memberId: number }) {
  const [interactions, setInteractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const { data } = await api.get(`/api/v1/crm/member/${memberId}/interactions`)
        setInteractions(data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInteractions()
  }, [memberId])

  if (loading) return <div className="text-center py-5">กำลังโหลด...</div>

  return (
    <div className="space-y-4">
      {interactions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">ยังไม่มีการติดต่อ</div>
      ) : (
        interactions.map((interaction) => (
          <div key={interaction.id} className="card p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{interaction.subject}</p>
                <p className="text-sm text-gray-600 mt-1">{interaction.notes}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {interaction.interaction_type} • {formatThaiDate(new Date(interaction.created_at))}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function RequestsTab({ memberId }: { memberId: number }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data } = await api.get(`/api/v1/crm/member/${memberId}/requests`)
        setRequests(data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [memberId])

  if (loading) return <div className="text-center py-5">กำลังโหลด...</div>

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-10 text-gray-500">ยังไม่มีร้องขอ</div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="card p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-gray-900">{req.title}</p>
                <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{req.category}</span>
                </div>
              </div>
              <span className="text-sm font-mono text-gray-500">{req.request_no}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DocumentsTab({ memberId }: { memberId: number }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await api.get(`/api/v1/crm/member/${memberId}/documents`)
        setDocuments(data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [memberId])

  if (loading) return <div className="text-center py-5">กำลังโหลด...</div>

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="text-center py-10 text-gray-500">ยังไม่มีเอกสาร</div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="card p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">{doc.document_name}</p>
              <p className="text-sm text-gray-600">{doc.document_type}</p>
              <p className="text-xs text-gray-500 mt-1">ส่งเมื่อ: {formatThaiDate(new Date(doc.sent_at))}</p>
            </div>
            <div className="flex gap-2">
              {doc.acknowledged ? (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✅ ยืนยัน</span>
              ) : (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">⏳ รอยืนยัน</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
