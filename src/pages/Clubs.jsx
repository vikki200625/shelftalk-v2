import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getClubs } from '../lib/clubs'
import ClubCard from '../components/ClubCard'

export default function Clubs() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getClubs(search)
      .then(data => { if (!cancelled) setClubs(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search])

  return (
    <div className="clubs-page">
      <header className="clubs-header">
        <div className="clubs-header-text">
          <h1 className="clubs-title">Book Clubs</h1>
          <p className="clubs-subtitle">Find your reading community</p>
        </div>
        {user && (
          <Link className="clubs-create-btn" to="/clubs/new">
            + Create Club
          </Link>
        )}
      </header>

      <div className="clubs-search">
        <input
          className="clubs-search-input"
          type="search"
          placeholder="Search clubs by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search book clubs"
        />
      </div>

      {error && <p className="clubs-error">{error}</p>}

      {loading ? (
        <div className="clubs-loading">Loading clubs…</div>
      ) : clubs.length === 0 ? (
        <div className="clubs-empty">
          <p className="clubs-empty-text">
            {search ? 'No clubs match your search.' : 'No book clubs yet.'}
          </p>
          {user && !search && (
            <Link className="clubs-empty-cta" to="/clubs/new">
              Create the first club
            </Link>
          )}
          {!user && (
            <Link className="clubs-empty-cta" to="/signup">
              Sign up to create a club
            </Link>
          )}
        </div>
      ) : (
        <div className="clubs-grid">
          {clubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  )
}
