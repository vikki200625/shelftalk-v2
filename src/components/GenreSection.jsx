import { useEffect, useRef, useState } from 'react'
import FadeIn from './FadeIn'
import BookCard from './BookCard'
import { GENRES } from '../lib/genres'
import { fetchGenreBooks } from '../lib/openlibrary'

/**
 * GenreRow — one horizontally-scrolling shelf of books for a single
 * genre. Fetches lazily: the request only fires once the row is near
 * the viewport, so the page doesn't hammer OpenLibrary with six
 * requests on load. Each row has its own loading/error state so one
 * failing genre never blocks the others.
 */
function GenreRow({ genre }) {
  const [status, setStatus] = useState('idle') // idle | loading | error | ready
  const [books, setBooks] = useState([])
  const [attempt, setAttempt] = useState(0)
  const [seen, setSeen] = useState(false)
  const rowRef = useRef(null)

  // Lazy trigger: mark the row as "seen" the first time it enters the
  // viewport (with a little lookahead so the shelf is ready by the time
  // the user gets there). Falls back to fetching immediately if
  // IntersectionObserver is unavailable (jsdom, old browsers).
  useEffect(() => {
    const node = rowRef.current
    if (!node) return

    if (typeof IntersectionObserver !== 'function') {
      setSeen(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Fetch once the row has been seen (or retry is pressed).
  useEffect(() => {
    if (!seen) return
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
  }, [seen, genre.slug, genre.color, attempt])

  return (
    <div className="genre-row" ref={rowRef}>
      <div className="genre-row-head">
        <h3 className="genre-row-label">{genre.label}</h3>
      </div>

      {status === 'idle' && <p className="section-status">…</p>}
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
      </div>
      {GENRES.map((genre) => (
        <GenreRow key={genre.slug} genre={genre} />
      ))}
    </FadeIn>
  )
}
