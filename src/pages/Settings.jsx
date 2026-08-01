import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { fetchProfileById, updateProfile } from '../lib/profiles'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

export default function Settings() {
  const { user } = useAuth()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const { data, error } = await fetchProfileById(user.id)
      if (cancelled) return
      if (!error && data) {
        setUsername(data.username ?? '')
        setDisplayName(data.display_name ?? '')
        setAvatarUrl(data.avatar_url ?? '')
        setBio(data.bio ?? '')
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (!USERNAME_PATTERN.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }
    if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
      setError('Avatar URL must start with http:// or https://')
      return
    }

    setSaving(true)

    const { error: saveError } = await updateProfile(user.id, {
      username,
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim() || null,
    })

    if (saveError) {
      if (saveError.message.includes('duplicate')) {
        setError('That username is already taken')
      } else {
        setError(saveError.message)
      }
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Sign in required</h1>
          <p className="auth-subtitle">
            You need an account to edit a profile.
          </p>
          <Link className="auth-btn auth-btn--secondary" to="/signin">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-line profile-line--title" />
          <div className="profile-line profile-line--bio" />
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-banner" />

      <div className="profile-card settings-card">
        <h1 className="settings-title">Edit your profile</h1>
        <p className="settings-sub">This is how other readers see you.</p>

        {/* Live avatar preview — the small stuff matters. */}
        <div className="settings-preview">
          <Avatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            size={80}
            username={username || 'reader'}
          />
          <div className="settings-preview-meta">
            <span className="settings-preview-name">{displayName || username || 'reader'}</span>
            <span className="settings-preview-username">@{username || 'reader'}</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {saved && (
          <div className="auth-success">
            Profile saved — it&apos;s live now.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Username
            <input
              className="auth-input"
              minLength={3}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your unique username"
              required
              type="text"
              value={username}
            />
          </label>

          <label className="auth-label">
            Display name
            <input
              className="auth-input"
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              type="text"
              value={displayName}
            />
          </label>

          <label className="auth-label">
            Avatar URL
            <input
              className="auth-input"
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://… (optional)"
              type="text"
              value={avatarUrl}
            />
          </label>

          <label className="auth-label">
            Bio
            <textarea
              className="auth-input auth-textarea"
              maxLength={280}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself (max 280 chars)"
              rows={4}
              value={bio}
            />
            <span className="auth-char-count">{bio.length}/280</span>
          </label>

          <button
            className="auth-btn"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <p className="auth-switch">
          <Link className="auth-link" to={`/profile/${username}`}>
            View your public profile
          </Link>
        </p>
      </div>
    </div>
  )
}
