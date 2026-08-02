import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  searchProfiles,
  fetchSuggestedProfiles,
  fetchFollowers,
  fetchFollowing,
} from '../lib/profiles'
import UserCard from '../components/UserCard'

export default function FindFriends() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggested, setSuggested] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Load initial data
  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      const [sugRes, folRes, ingRes] = await Promise.all([
        fetchSuggestedProfiles(user.id, 10),
        fetchFollowers(user.id, 50),
        fetchFollowing(user.id, 50),
      ])
      setSuggested(sugRes.data || [])
      setFollowers(folRes.data || [])
      setFollowing(ingRes.data || [])
      setLoading(false)
    }
    load()
  }, [user])

  // Search users
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const { data } = await searchProfiles(query, 20)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleFollowChange = () => {
    // Refresh lists after follow/unfollow
    if (!user) return
    fetchFollowers(user.id, 50).then(({ data }) => setFollowers(data || []))
    fetchFollowing(user.id, 50).then(({ data }) => setFollowing(data || []))
  }

  if (!user) return null

  return (
    <div className="find-friends-page">
      <h1 className="find-friends-title">Find Friends</h1>
      <p className="find-friends-subtitle">
        Discover readers who share your taste
      </p>

      {/* Search */}
      <div className="find-friends-search">
        <input
          className="find-friends-search-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          type="text"
          value={query}
        />
      </div>

      {/* Search Results */}
      {query.trim() && (
        <section className="find-friends-section">
          <h2 className="find-friends-section-title">
            {searching ? 'Searching...' : `Results for "${query}"`}
          </h2>
          {searchResults.length > 0 && (
            <div className="find-friends-list">
              {searchResults.map((u) => (
                <UserCard
                  currentUserId={user.id}
                  key={u.id}
                  onFollowChange={handleFollowChange}
                  user={u}
                />
              ))}
            </div>
          )}
          {!searching && searchResults.length === 0 && (
            <p className="find-friends-empty">No users found</p>
          )}
        </section>
      )}

      {/* Suggested Friends */}
      {!query.trim() && (
        <>
          {suggested.length > 0 && (
            <section className="find-friends-section">
              <h2 className="find-friends-section-title">Suggested for You</h2>
              <div className="find-friends-list">
                {suggested.map((u) => (
                  <UserCard
                    currentUserId={user.id}
                    key={u.id}
                    onFollowChange={handleFollowChange}
                    user={u}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Followers */}
          <section className="find-friends-section">
            <h2 className="find-friends-section-title">
              Your Followers ({followers.length})
            </h2>
            {followers.length > 0 ? (
              <div className="find-friends-list">
                {followers.map((u) => (
                  <UserCard
                    currentUserId={user.id}
                    key={u.id}
                    onFollowChange={handleFollowChange}
                    user={u}
                  />
                ))}
              </div>
            ) : (
              <p className="find-friends-empty">
                No followers yet. Share your profile to get started!
              </p>
            )}
          </section>

          {/* Following */}
          <section className="find-friends-section">
            <h2 className="find-friends-section-title">
              You're Following ({following.length})
            </h2>
            {following.length > 0 ? (
              <div className="find-friends-list">
                {following.map((u) => (
                  <UserCard
                    currentUserId={user.id}
                    key={u.id}
                    onFollowChange={handleFollowChange}
                    user={u}
                  />
                ))}
              </div>
            ) : (
              <p className="find-friends-empty">
                You're not following anyone yet. Explore suggested readers above!
              </p>
            )}
          </section>
        </>
      )}

      {loading && <p className="find-friends-loading">Loading...</p>}
    </div>
  )
}
