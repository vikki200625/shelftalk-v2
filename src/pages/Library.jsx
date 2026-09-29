import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import {
  getShelfBooks,
  removeFromShelf,
  getBookShelf,
  addToShelf,
} from '../lib/library'
import { fetchWork } from '../lib/openlibrary'
import ShelfSection from '../components/ShelfSection'
import ReadingGoal from '../components/ReadingGoal'

const SHELVES = [
  { id: 'reading', label: 'Currently Reading', icon: '📖' },
  { id: 'want_to_read', label: 'Want to Read', icon: '📚' },
  { id: 'finished', label: 'Finished', icon: '✅' },
]

export default function Library() {
  const { user } = useAuth()
  const [shelves, setShelves] = useState({
    reading: [],
    want_to_read: [],
    finished: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!user) return
    loadLibrary()
  }, [user])

  async function loadLibrary() {
    setLoading(true)
    setLoadError(null)
    try {
      const results = {}
      for (const s of SHELVES) {
        const { data, error } = await getShelfBooks(user.id, s.id)
        if (error) throw new Error(error.message)
        // Enrich with book details from Open Library
        const enriched = await Promise.all(
          (data || []).map(async (entry) => {
            const book = await fetchWork(entry.book_key)
            return { ...entry, ...book }
          })
        )
        results[s.id] = enriched
      }
      setShelves(results)
    } catch {
      setLoadError("Couldn't load your shelves.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(bookKey) {
    await removeFromShelf(user.id, bookKey)
    loadLibrary()
  }

  if (!user) {
    return (
      <div className="library-page">
        <h1 className="library-title">My Library</h1>
        <div className="library-signin">
          <p>Sign in to start tracking your reading.</p>
          <Link className="library-signin-btn" to="/signin">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const totalBooks = Object.values(shelves).reduce((sum, s) => sum + s.length, 0)

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="library-title">My Library</h1>
        <span className="library-total">{totalBooks} books</span>
      </div>

      <ReadingGoal userId={user.id} />

      {loading ? (
        <p className="library-loading">Loading your shelves...</p>
      ) : loadError ? (
        <div className="library-error" role="alert">
          <p className="library-error-text">{loadError}</p>
          <button className="retry-btn" onClick={loadLibrary} type="button">
            Try again
          </button>
        </div>
      ) : totalBooks === 0 ? (
        <div className="library-empty">
          <span className="library-empty-icon" aria-hidden="true">📚</span>
          <h2 className="library-empty-title">Your shelves are empty</h2>
          <p className="library-empty-text">
            Start building your library by browsing books and adding them to your shelves.
          </p>
          <Link className="library-empty-btn" to="/browse">
            Browse Books
          </Link>
        </div>
      ) : (
        SHELVES.map((s) => (
          <ShelfSection
            books={shelves[s.id]}
            icon={s.icon}
            key={s.id}
            onRemove={handleRemove}
            shelf={s.id}
            title={s.label}
          />
        ))
      )}
    </div>
  )
}
