import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await signIn(username, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Back to the page that bounced us here, or home if we came directly.
    navigate(location.state?.from || '/', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your ShellTalk account</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Username
            <input
              className="auth-input"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              type="text"
              value={username}
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              type="password"
              value={password}
            />
          </label>

          <div className="auth-row">
            <Link className="auth-link auth-link--small" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button
            className="auth-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link className="auth-link" to="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
