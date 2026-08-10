import { Navigate, useLocation } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Restoring your session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Signed in but on the wrong portal — bounce to their own home.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] ?? '/'} replace />
  }

  return children
}
