import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../lib/validate'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)

    const { error: authError } = await resetPassword(password)

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
          <h1 className="auth-title">Password updated</h1>
          <p className="auth-subtitle">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link className="auth-btn" to="/signin">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong new password for your account.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            New password
            <input
              className="auth-input"
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, 1 number, 1 special"
              required
              type="password"
              value={password}
            />
          </label>

          <label className="auth-label">
            Confirm new password
            <input
              className="auth-input"
              minLength={8}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          <button
            className="auth-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="auth-switch">
          <Link className="auth-link" to="/signin">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
