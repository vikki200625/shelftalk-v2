import { useEffect, useState } from 'react'
import FadeIn from './FadeIn'
import BookCard from './BookCard'
import { GENRES } from '../lib/genres'
import { fetchGenreBooks } from '../lib/openlibrary'

/**
 * GenreRow — one horizontally-scrolling shelf of books for a single
 * genre. Fetches on mount with its own loading/error state so one
 * failing genre never blocks the others.
 */
function GenreRow({ genre }) {
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [books, setBooks] = useState([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetchGenreBooks(genre.slug, { signal: controller.signal, base: genre.color })
      .then((results) => {
        if (controller.signal.aborted) return
        setBooks(results)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [genre.slug, genre.color, attempt])

  return (
    <div className="genre-row">
      <div className="genre-row-head">
        <h3 className="genre-row-label">{genre.label}</h3>
      </div>

      {status === 'loading' && (
        <p className="section-status">Loading {genre.label.toLowerCase()} books…</p>
      )}
      {status === 'error' && (
        <div className="section-status">
          <p>Couldn&apos;t load {genre.label.toLowerCase()} books.</p>
          <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && books.length === 0 && (
        <p className="section-status">No books in this genre right now.</p>
      )}
      {status === 'ready' && books.length > 0 && (
        <div className="trending-row">
          {books.map((book, index) => (
            <BookCard key={book.key ?? `${genre.slug}-${index}`} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * GenreSection — "Browse by genre": one row per curated genre, each
 * pulling the newest books from OpenLibrary's subjects endpoint.
 */
export default function GenreSection() {
  return (
    <FadeIn className="section" id="genres">
      <div className="section-head">
        <h2 className="section-title">Browse by genre</h2>
        <a className="section-link" href="#genres">
          See all →
        </a>
      </div>
      {GENRES.map((genre) => (
        <GenreRow key={genre.slug} genre={genre} />
      ))}
    </FadeIn>
  )
}
