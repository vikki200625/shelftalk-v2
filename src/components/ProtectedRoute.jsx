import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/signin" />
  }

  return children
}
