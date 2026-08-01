import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import {
  fetchProfileByUsername,
  fetchFollowingCount,
  fetchFollowersCount,
  fetchFollowStatus,
  fetchShelfCounts,
} from '../lib/profiles'

const SHELF_LABELS = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
}

function formatMemberSince(iso) {
  if (!iso) return 'Member'
  const date = new Date(iso)
  return `Member since ${date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })}`
}

export default function Profile() {
  const { username } = useParams()
  const { user, loading: authLoading } = useAuth()

  const [profile, setProfile] = useState(null)
  const [counts, setCounts] = useState({ following: 0, followers: 0, shelves: 0 })
  const [shelfCounts, setShelfCounts] = useState({ want_to_read: 0, reading: 0, finished: 0 })
  const [following, setFollowing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const isOwnProfile = user && profile && user.id === profile.id

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)

      const { data: profileData, error } = await fetchProfileByUsername(username)
      if (cancelled) return

      if (error || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fire the three count/status queries in parallel.
      const [followingRes, followersRes, shelvesRes, statusRes] = await Promise.all([
        fetchFollowingCount(profileData.id),
        fetchFollowersCount(profileData.id),
        fetchShelfCounts(profileData.id),
        user ? fetchFollowStatus(user.id, profileData.id) : Promise.resolve({ following: false }),
      ])
      if (cancelled) return

      setCounts({
        following: followingRes.count ?? 0,
        followers: followersRes.count ?? 0,
        shelves: Object.values(shelvesRes.counts ?? {}).reduce((a, b) => a + b, 0),
      })
      setShelfCounts(shelvesRes.counts ?? { want_to_read: 0, reading: 0, finished: 0 })
      setFollowing(statusRes.following)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [username, user])

  if (loading || authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-banner" />
        <div className="profile-card">
          <div className="avatar avatar--skeleton" />
          <div className="profile-line profile-line--title" />
          <div className="profile-line profile-line--sub" />
          <div className="profile-line profile-line--bio" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--empty">
          <span className="profile-empty-book" aria-hidden="true">📖</span>
          <h1 className="profile-empty-title">No reader named “{username}”</h1>
          <p className="profile-empty-sub">
            This profile doesn&apos;t exist or the username was mistyped.
          </p>
          <Link className="auth-btn auth-btn--secondary" to="/">
            Back to browsing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-banner" />

      <div className="profile-card">
        <div className="profile-head">
          <Avatar
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            size={104}
            username={profile.username}
          />
          <div className="profile-identity">
            <h1 className="profile-name">
              {profile.display_name || profile.username}
            </h1>
            <p className="profile-username">@{profile.username}</p>
            {profile.bio ? (
              <p className="profile-bio">{profile.bio}</p>
            ) : (
              <p className="profile-bio profile-bio--empty">
                This reader hasn&apos;t written a bio yet.
              </p>
            )}
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <Link className="follow-btn" to="/settings">
                Edit profile
              </Link>
            ) : (
              <FollowButton following={following} profileId={profile.id} />
            )}
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-number">{counts.shelves}</span>
            <span className="profile-stat-label">Books shelved</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-number">{counts.following}</span>
            <span className="profile-stat-label">Following</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-number">{counts.followers}</span>
            <span className="profile-stat-label">Followers</span>
          </div>
        </div>

        <p className="profile-member-since">{formatMemberSince(profile.created_at)}</p>
      </div>

      {/* Shelf snapshot — links back to the library slice when it lands. */}
      <div className="profile-shelves">
        <h2 className="profile-shelves-title">Shelves</h2>
        {counts.shelves === 0 ? (
          <p className="profile-shelves-empty">
            {isOwnProfile
              ? 'You haven\u2019t shelved any books yet.'
              : `${profile.display_name || profile.username} hasn\u2019t shelved any books yet.`}
          </p>
        ) : (
          <div className="profile-shelves-grid">
            {Object.entries(SHELF_LABELS).map(([key, label]) => (
              <div className="profile-shelf" key={key}>
                <span className="profile-shelf-label">{label}</span>
                <span className="profile-shelf-count">
                  {shelfCounts[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
