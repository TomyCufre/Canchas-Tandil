import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, rol }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (rol && profile?.rol !== rol) return <Navigate to="/" replace />

  return children
}
