import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import FadeIn from '../components/FadeIn'
import BookCard from '../components/BookCard'
import Trending from '../components/Trending'
import GenreBento from '../components/GenreBento'
import { searchBooksPage } from '../lib/openlibrary'
import { useAuth } from '../context/AuthContext'

const CHIPS = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Fantasy', 'Romance']
const PAGE_SIZE = 24
const DEBOUNCE_MS = 300

/**
 * Browse — the dedicated discovery page. A big search sits at the top;
 * once a query is active it swaps the shelf sections for a search-results
 * grid (with "load more"). With no query it shows Trending, the genre
 * bento, and the "shelves are bare" empty state.
 */
export default function Browse() {
  const { user, profile } = useAuth()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [books, setBooks] = useState([])
  const [numFound, setNumFound] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const latestQueryRef = useRef('')

  // Debounce: only search after the user pauses typing.
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  // Keep the newest active query around so a stale "load more" response
  // can't append results into a newer search.
  useEffect(() => {
    latestQueryRef.current = debouncedQuery
  }, [debouncedQuery])

  // Fetch the first page whenever the active query changes (or retry).
  useEffect(() => {
    if (!debouncedQuery) {
      setStatus('idle')
      setBooks([])
      setNumFound(null)
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    setLoadMoreError(false)
    searchBooksPage(debouncedQuery, { signal: controller.signal, limit: PAGE_SIZE, offset: 0 })
      .then(({ books: page, numFound: total }) => {
        if (controller.signal.aborted) return
        setBooks(page)
        setNumFound(total)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [debouncedQuery, attempt])

  async function loadMore() {
    if (loadingMore || !debouncedQuery) return
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const { books: page } = await searchBooksPage(debouncedQuery, {
        limit: PAGE_SIZE,
        offset: books.length,
      })
      if (latestQueryRef.current !== debouncedQuery) return // superseded
      setBooks((prev) => [...prev, ...page])
    } catch {
      setLoadMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const searching = Boolean(debouncedQuery)
  const hasMore = numFound == null ? false : books.length < numFound
  const ownProfileHref = `/profile/${profile?.username}`

  return (
    <div className="browse">
      {/* Hero search */}
      <section className="browse-hero">
        <span className="browse-eyebrow">Discover your favorites</span>
        <h1 className="browse-title">
          Find your next <em>favorite book</em>
        </h1>
        <div className="browse-search-wrap">
          <span className="material-symbols-outlined browse-search-icon" aria-hidden="true">
            search
          </span>
          <input
            className="browse-search-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for books, authors, or topics…"
            aria-label="Search books"
          />
        </div>
        <div className="browse-chips">
          {CHIPS.map((chip) => {
            const active = query.trim().toLowerCase() === chip.toLowerCase()
            return (
              <button
                key={chip}
                className={`browse-chip${active ? ' browse-chip--active' : ''}`}
                type="button"
                onClick={() => setQuery(chip)}
                aria-pressed={active}
              >
                {chip}
              </button>
            )
          })}
        </div>
      </section>

      {searching ? (
        /* Search results state */
        <section className="browse-results" aria-live="polite">
          <div className="browse-results-head">
            <span className="browse-results-eyebrow">Search results for</span>
            <h2 className="browse-results-title">“{debouncedQuery}”</h2>
          </div>

          {status === 'loading' && <p className="section-status">Searching…</p>}
          {status === 'error' && (
            <div className="section-status">
              <p>Something went wrong. Try again?</p>
              <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </button>
            </div>
          )}
          {status === 'ready' && books.length === 0 && (
            <p className="section-status">No books found for “{debouncedQuery}”.</p>
          )}
          {status === 'ready' && books.length > 0 && (
            <>
              <div className="browse-results-grid">
                {books.map((book, index) => (
                  <BookCard key={book.key ?? `browse-${index}`} book={book} />
                ))}
              </div>
              {hasMore && (
                <div className="browse-results-more">
                  <button
                    className="browse-load-more"
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more results'}
                  </button>
                  {loadMoreError && (
                    <p className="section-status">Couldn&apos;t load more. Try again?</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <Trending />
          <GenreBento onSelect={setQuery} />

          {/* Recommended empty state — personalized recs land here later */}
          <FadeIn className="browse-empty section">
            <div className="browse-empty-card">
              <div className="browse-empty-icon-wrap">
                <span className="material-symbols-outlined browse-empty-icon" aria-hidden="true">
                  collections_bookmark
                </span>
              </div>
              <h3 className="browse-empty-title">Your Shelves Are Bare</h3>
              <p className="browse-empty-sub">
                We need a little more information about your tastes to provide personalized
                recommendations.
              </p>
              <Link
                className="btn-cta-primary browse-empty-cta"
                to={user ? ownProfileHref : '/signup'}
              >
                Start shelving
              </Link>
            </div>
          </FadeIn>
        </>
      )}
    </div>
  )
}
