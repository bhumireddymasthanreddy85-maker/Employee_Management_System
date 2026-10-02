import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../types'

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: AuthUser['role'][]
}) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'user' ? '/my-profile' : '/'} replace />
  }

  return children
}
