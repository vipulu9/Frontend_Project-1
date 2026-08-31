import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../pages/auth.css'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-spinner-fullscreen" aria-label="Verifying session">
        <span className="auth-spinner" role="status" />
      </div>
    )
  }

  if (!user) {
    // Preserve the attempted URL so Login can redirect back after success
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
