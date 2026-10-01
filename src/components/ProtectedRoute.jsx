import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">Loading…</div>
      </div>
    )
  }

  if (!user) {
    // Remember where the visitor wanted to go so SignIn can send them back.
    return <Navigate replace to="/signin" state={{ from: location.pathname + location.search }} />
  }

  return children ?? <Outlet />
}
