import { useEffect, useState } from 'react'
import FadeIn from './FadeIn'
import BookCard from './BookCard'
import { fetchTrending } from '../lib/openlibrary'

/**
 * Trending — the "Trending with readers right now" section. Fetches
 * OpenLibrary's trending feed and renders it with the shared BookCard.
 */
export default function Trending() {
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [books, setBooks] = useState([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetchTrending({ signal: controller.signal })
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
  }, [attempt])

  return (
    <FadeIn className="section section--trending" id="trending">
      <div className="section-head">
        <h2 className="section-title">Trending with readers right now</h2>
        <a className="section-link" href="#trending">
          See all →
        </a>
      </div>

      {status === 'loading' && <p className="section-status">Loading trending books…</p>}
      {status === 'error' && (
        <div className="section-status">
          <p>Couldn&apos;t load trending books.</p>
          <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && books.length === 0 && (
        <p className="section-status">No trending books right now.</p>
      )}
      {status === 'ready' && books.length > 0 && (
        <div className="trending-row">
          {books.map((book, index) => (
            <BookCard key={book.key ?? `trend-${index}`} book={book} />
          ))}
        </div>
      )}
    </FadeIn>
  )
}
