import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuthStore()
  const location = useLocation()
  if (!ready) return <p className="muted">Загрузка…</p>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}
