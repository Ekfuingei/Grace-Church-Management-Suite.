import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Members } from '@/pages/Members'
import { MediaPrompter } from '@/pages/MediaPrompter'
import { Tithe } from '@/pages/Tithe'
import { Attendance } from '@/pages/Attendance'
import { Rota } from '@/pages/Rota'
import { Announcements } from '@/pages/Announcements'
import { Evangelism } from '@/pages/Evangelism'
import { Counselling } from '@/pages/Counselling'
import { Settings } from '@/pages/Settings'

const MEDIA_ALLOWED_ROUTES = ['/media']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DashboardOrRedirect() {
  const { role } = useAuth()
  if (role === 'media') return <Navigate to="/media" replace />
  return <Dashboard />
}

function MediaRestrictedRoute({ children, path }: { children: React.ReactNode; path: string }) {
  const { role } = useAuth()
  if (role === 'media' && !MEDIA_ALLOWED_ROUTES.includes(path)) {
    return <Navigate to="/media" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOrRedirect />} />
        <Route path="members" element={<MediaRestrictedRoute path="/members"><Members /></MediaRestrictedRoute>} />
        <Route path="media" element={<MediaPrompter />} />
        <Route path="tithe" element={<MediaRestrictedRoute path="/tithe"><Tithe /></MediaRestrictedRoute>} />
        <Route path="attendance" element={<MediaRestrictedRoute path="/attendance"><Attendance /></MediaRestrictedRoute>} />
        <Route path="rota" element={<MediaRestrictedRoute path="/rota"><Rota /></MediaRestrictedRoute>} />
        <Route path="announcements" element={<MediaRestrictedRoute path="/announcements"><Announcements /></MediaRestrictedRoute>} />
        <Route path="evangelism" element={<MediaRestrictedRoute path="/evangelism"><Evangelism /></MediaRestrictedRoute>} />
        <Route path="counselling" element={<MediaRestrictedRoute path="/counselling"><Counselling /></MediaRestrictedRoute>} />
        <Route path="settings" element={<MediaRestrictedRoute path="/settings"><Settings /></MediaRestrictedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
