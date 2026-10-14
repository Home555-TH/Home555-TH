import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Settings from './pages/Settings'
import PVList from './pages/pv/PVList'
import PVCreate from './pages/pv/PVCreate'
import PVDetail from './pages/pv/PVDetail'
import ARAging from './pages/ar/ARAging'
import ARInvoiceList from './pages/ar/ARInvoiceList'
import ARCreate from './pages/ar/ARCreate'
import BankReconciliation from './pages/bank/BankReconciliation'
import BankCashFlow from './pages/bank/BankCashFlow'
import IncomeStatement from './pages/reports/IncomeStatement'
import TaxSummary from './pages/reports/TaxSummary'
import MemberProfile from './pages/crm/MemberProfile'
import EmployeeList from './pages/hr/EmployeeList'
import Payroll from './pages/hr/Payroll'

function RequireAuth({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/members"
        element={
          <RequireAuth roles={['admin', 'accountant', 'super_admin']}>
            <Layout>
              <Members />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth roles={['admin', 'super_admin']}>
            <Layout>
              <Settings />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/pv"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <PVList />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/pv/create"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <PVCreate />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/pv/:id"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <PVDetail />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/ar"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <ARInvoiceList />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/ar/create"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <ARCreate />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/ar/aging"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <ARAging />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/bank/reconciliation"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <BankReconciliation />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/bank/cash-flow"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <BankCashFlow />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/reports/income-statement"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <IncomeStatement />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/reports/tax-summary"
        element={
          <RequireAuth roles={['accountant', 'admin', 'super_admin']}>
            <Layout>
              <TaxSummary />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/member/:memberId/crm"
        element={
          <RequireAuth roles={['admin', 'accountant', 'super_admin']}>
            <Layout>
              <MemberProfile />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/hr/employees"
        element={
          <RequireAuth roles={['admin', 'super_admin']}>
            <Layout>
              <EmployeeList />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/hr/payroll"
        element={
          <RequireAuth roles={['admin', 'accountant', 'super_admin']}>
            <Layout>
              <Payroll />
            </Layout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <AppRoutes />
    </BrowserRouter>
  )
}
