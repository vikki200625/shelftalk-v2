import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await forgotPassword(username)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a password reset link to the email registered to{' '}
            <strong>{username}</strong>. Click the link to set a new password.
          </p>
          <Link className="auth-btn auth-btn--secondary" to="/signin">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">
          Enter your username and we&apos;ll send a reset link to your registered email.
        </p>

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

          <button
            className="auth-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password?{' '}
          <Link className="auth-link" to="/signin">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
