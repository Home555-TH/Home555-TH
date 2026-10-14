import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface BreadcrumbItem {
  path: string
  label: string
  icon?: string
}

const BREADCRUMB_MAP: Record<string, BreadcrumbItem[]> = {
  '/': [{ path: '/', label: 'แดชบอร์ด', icon: '📊' }],
  '/members': [
    { path: '/', label: 'แดชบอร์ด', icon: '📊' },
    { path: '/members', label: 'สมาชิก', icon: '👥' }
  ],
  '/settings': [
    { path: '/', label: 'แดชบอร์ด', icon: '📊' },
    { path: '/settings', label: 'ตั้งค่า', icon: '⚙️' }
  ]
}

export default function Breadcrumb() {
  const location = useLocation()
  const items = BREADCRUMB_MAP[location.pathname] || [{ path: '/', label: 'หน้าแรก' }]

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-400">/</span>}
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            <Link to={item.path} className="text-blue-600 hover:underline">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
