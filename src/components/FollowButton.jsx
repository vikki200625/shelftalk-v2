import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { followUser, unfollowUser, fetchFollowStatus } from '../lib/profiles'

/**
 * FollowButton — follow/unfollow a profile.
 * Waits for DB response before updating UI (no optimistic updates).
 * Redirects to /signin when a visitor tries to follow.
 */
export default function FollowButton({ profileId, following: initialFollowing, onFollowChange }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Verify follow status from DB on mount
  useEffect(() => {
    if (!user || !profileId) {
      setChecking(false)
      return
    }
    fetchFollowStatus(user.id, profileId).then(({ following: dbFollowing }) => {
      setFollowing(dbFollowing)
      setChecking(false)
    })
  }, [user, profileId])

  const handleClick = async () => {
    if (!user) {
      navigate('/signin')
      return
    }
    setLoading(true)

    if (following) {
      const { error } = await unfollowUser(user.id, profileId)
      if (!error) {
        setFollowing(false)
        onFollowChange?.()
      }
    } else {
      const { data, error } = await followUser(user.id, profileId)
      if (!error && data) {
        setFollowing(true)
        onFollowChange?.()
      } else {
        console.error('Follow failed:', error)
      }
    }
    setLoading(false)
  }

  // Don't show button while checking
  if (checking) {
    return (
      <button className="follow-btn" disabled type="button">
        …
      </button>
    )
  }

  return (
    <button
      aria-pressed={following}
      className={`follow-btn${following ? ' follow-btn--active' : ''}`}
      disabled={loading}
      onClick={handleClick}
      type="button"
    >
      {loading
        ? '…'
        : following
          ? 'Following'
          : 'Follow'}
    </button>
  )
}
