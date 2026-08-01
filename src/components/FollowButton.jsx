import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { followUser, unfollowUser } from '../lib/profiles'

/**
 * FollowButton — follow/unfollow a profile.
 * Redirects to /signin when a visitor tries to follow.
 */
export default function FollowButton({ profileId, following: initialFollowing }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!user) {
      navigate('/signin')
      return
    }
    setLoading(true)
    if (following) {
      await unfollowUser(user.id, profileId)
      setFollowing(false)
    } else {
      await followUser(user.id, profileId)
      setFollowing(true)
    }
    setLoading(false)
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
