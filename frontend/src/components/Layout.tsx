import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import Breadcrumb from './Breadcrumb'
import clsx from 'clsx'

interface NavItem {
  to: string
  label: string
  roles: string[]
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'แดชบอร์ด', roles: ['admin', 'ap_import', 'accountant', 'super_admin'], icon: '📊' },
  { to: '/members', label: 'สมาชิก', roles: ['admin', 'accountant', 'super_admin'], icon: '👥' },
  { to: '/settings', label: 'ตั้งค่า', roles: ['admin', 'super_admin'], icon: '⚙️' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={clsx('flex flex-col bg-blue-900 text-white transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
        <div className="flex items-center justify-between p-3 border-b border-blue-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10">
                <Logo size="sm" showText={false} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Wilairat</div>
                <div className="text-blue-300 text-xs">ERP</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-blue-800 transition-colors ml-auto">
            <span className="text-lg">{collapsed ? '→' : '←'}</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx('flex items-center px-4 py-2.5 text-sm transition-colors', isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800')
              }
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          {!collapsed && (
            <div className="mb-2">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-blue-300 truncate">{user?.email}</div>
              <div className="text-xs text-blue-400 mt-0.5">{user?.role}</div>
            </div>
          )}
          <button onClick={handleLogout} className={clsx('w-full text-left px-2 py-1.5 text-xs text-blue-200 hover:text-white hover:bg-blue-800 rounded transition-colors', collapsed && 'text-center')}>
            {collapsed ? '🚪' : '🚪 ออกจากระบบ'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">บ้านวิไลรัตน์ - ระบบบริหารจัดการ</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  )
}
