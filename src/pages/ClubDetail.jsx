import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getClub, joinClub, leaveClub, getClubDiscussions, createDiscussion } from '../lib/clubs'
import DiscussionCard from '../components/DiscussionCard'
import DiscussionForm from '../components/DiscussionForm'

export default function ClubDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getClub(id), getClubDiscussions(id)])
      .then(([clubData, discData]) => {
        if (!cancelled) {
          setClub(clubData)
          setDiscussions(discData)
        }
      })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      await joinClub(id)
      setClub(prev => ({
        ...prev,
        is_member: true,
        my_role: 'member',
        member_count: prev.member_count + 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    setActionLoading(true)
    try {
      await leaveClub(id)
      setClub(prev => ({
        ...prev,
        is_member: false,
        my_role: null,
        member_count: prev.member_count - 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePostDiscussion = async ({ title, body }) => {
    await createDiscussion(id, { title, body })
    const updated = await getClubDiscussions(id)
    setDiscussions(updated)
  }

  if (loading) return <div className="clubs-loading">Loading club…</div>
  if (error && !club) return <div className="clubs-error">{error}</div>
  if (!club) return <div className="clubs-error">Club not found</div>

  return (
    <div className="club-detail">
      <Link className="club-detail-back" to="/clubs">← All Clubs</Link>

      <header className="club-detail-header">
        <h1 className="club-detail-name">{club.name}</h1>
        {club.genre && (
          <span className="club-detail-genre">{club.genre}</span>
        )}
        <p className="club-detail-desc">{club.description}</p>
        <div className="club-detail-meta">
          <span>{club.member_count} {club.member_count === 1 ? 'member' : 'members'}</span>
          <span>Created by {club.creator_username}</span>
        </div>
      </header>

      {error && <p className="clubs-error">{error}</p>}

      {user && (
        <div className="club-detail-actions">
          {club.is_member ? (
            club.my_role !== 'owner' && (
              <button
                className="club-action-btn club-action-btn--leave"
                onClick={handleLeave}
                disabled={actionLoading}
              >
                {actionLoading ? 'Leaving…' : 'Leave Club'}
              </button>
            )
          ) : (
            <button
              className="club-action-btn club-action-btn--join"
              onClick={handleJoin}
              disabled={actionLoading}
            >
              {actionLoading ? 'Joining…' : 'Join Club'}
            </button>
          )}
        </div>
      )}

      {!user && (
        <p className="club-detail-signin">
          <Link to="/signin">Sign in</Link> to join this club and start discussions.
        </p>
      )}

      <section className="club-members">
        <h2 className="club-section-heading">Members</h2>
        <div className="club-members-list">
          {club.members.map(member => (
            <Link
              key={member.user_id}
              className="club-member"
              to={`/profile/${member.username}`}
            >
              <span className="club-member-name">{member.username}</span>
              {member.role !== 'member' && (
                <span className="club-member-role">{member.role}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="club-discussions">
        <h2 className="club-section-heading">Discussions</h2>
        {club.is_member && (
          <DiscussionForm onSubmit={handlePostDiscussion} />
        )}
        {discussions.length === 0 ? (
          <p className="club-discussions-empty">
            No discussions yet. {club.is_member ? 'Start the conversation!' : 'Join to start a discussion.'}
          </p>
        ) : (
          <div className="club-discussions-list">
            {discussions.map(d => (
              <DiscussionCard key={d.id} discussion={d} clubId={id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
