import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { createClub } from '../lib/clubs'

const GENRES = [
  'Fiction',
  'Nonfiction',
  'Mystery',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Literary Fiction',
  'Historical',
  'Horror',
  'Poetry',
  'Biography',
  'Self-Help',
]

export default function CreateClub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="clubs-page">
        <div className="clubs-empty">
          <p className="clubs-empty-text">Sign in to create a book club.</p>
          <Link className="clubs-empty-cta" to="/signin">Sign in</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')
    try {
      const club = await createClub({
        name: name.trim(),
        description: description.trim(),
        genre: genre || null,
      })
      navigate(`/clubs/${club.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clubs-page">
      <Link className="club-detail-back" to="/clubs">← All Clubs</Link>
      <h1 className="clubs-title">Create a Book Club</h1>

      <form className="create-club-form" onSubmit={handleSubmit}>
        {error && <p className="clubs-error">{error}</p>}

        <label className="create-club-label">
          Club Name
          <input
            className="create-club-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Midnight Mystery Readers"
            maxLength={100}
            required
          />
        </label>

        <label className="create-club-label">
          Description
          <textarea
            className="create-club-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your club about?"
            rows={3}
            maxLength={500}
          />
        </label>

        <label className="create-club-label">
          Genre (optional)
          <select
            className="create-club-select"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">Select a genre…</option>
            {GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <button
          className="create-club-submit"
          type="submit"
          disabled={loading || !name.trim()}
        >
          {loading ? 'Creating…' : 'Create Club'}
        </button>
      </form>
    </div>
  )
}
