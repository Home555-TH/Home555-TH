import React from 'react'

interface Phase {
  number: number
  name: string
  status: 'completed' | 'current' | 'planned'
  features: string[]
}

const PHASES: Phase[] = [
  {
    number: 1,
    name: 'Foundation',
    status: 'completed',
    features: ['Auth', 'Members', 'Settings']
  },
  {
    number: 2,
    name: 'Accounting',
    status: 'completed',
    features: ['Payment Vouchers', 'Receivables', 'Bank', 'Reports']
  },
  {
    number: 3,
    name: 'Operations',
    status: 'planned',
    features: ['Utilities', 'Documents', 'Import']
  },
  {
    number: 4,
    name: 'Reports',
    status: 'planned',
    features: ['Analytics', 'Exports', 'Audit Logs']
  }
]

export default function PhaseIndicator() {
  return (
    <div className="card mt-8">
      <h3 className="font-semibold text-gray-900 mb-4">📈 Development Roadmap</h3>

      <div className="space-y-3">
        {PHASES.map((phase, index) => (
          <div key={phase.number}>
            <div className="flex items-center gap-3">
              {/* Status Circle */}
              <div className="flex-shrink-0">
                {phase.status === 'completed' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold">✓</span>
                  </div>
                ) : phase.status === 'current' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-bold">●</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600">{phase.number}</span>
                  </div>
                )}
              </div>

              {/* Phase Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Phase {phase.number}: {phase.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                    phase.status === 'current' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {phase.status === 'completed' ? '✅ Done' : phase.status === 'current' ? '⏳ In Progress' : '📅 Planned'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {phase.features.join(' • ')}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < PHASES.length - 1 && (
              <div className="ml-4 h-2 border-l-2 border-gray-300 my-2"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
        📊 Current Status: <span className="font-semibold">Phase 1 Complete (40 files, 1,900+ lines of code)</span>
      </div>
    </div>
  )
}
