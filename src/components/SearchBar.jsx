import { useEffect, useRef, useState } from 'react'
import BookCover from './BookCover'
import { searchBooks } from '../lib/openlibrary'

const DEBOUNCE_MS = 300

/**
 * SearchBar — live book search. Typing is debounced, then OpenLibrary is
 * queried and the results appear in a dropdown. Selecting a result does
 * nothing yet (the book detail page is a future slice).
 */
export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | results | empty | error
  const [books, setBooks] = useState([])
  const [open, setOpen] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const containerRef = useRef(null)

  // Debounce: only start searching after the user pauses typing.
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch whenever the debounced query changes (or retry is pressed).
  useEffect(() => {
    if (!debouncedQuery) {
      setStatus('idle')
      setBooks([])
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    setBooks([])
    searchBooks(debouncedQuery, { signal: controller.signal })
      .then((results) => {
        if (controller.signal.aborted) return // a newer query already started
        setBooks(results)
        setStatus(results.length > 0 ? 'results' : 'empty')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return // superseded, not a real failure
        setStatus('error')
      })
    return () => controller.abort()
  }, [debouncedQuery, attempt])

  // Close the dropdown when clicking anywhere outside the search box.
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="search" ref={containerRef}>
      <span className="material-symbols-outlined search-icon">search</span>
      <input
        aria-expanded={open}
        aria-label="Search by title, author, or ISBN"
        className="search-input"
        id="hero-search"
        type="text"
        placeholder="Search by title, author, or ISBN…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      />
      {open && (
        <div className="search-dropdown" role="listbox">
          {status === 'idle' && <p className="search-status">Type to search for books…</p>}
          {status === 'loading' && <p className="search-status">Searching…</p>}
          {status === 'error' && (
            <div className="search-status">
              <p>Something went wrong. Try again?</p>
              <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </button>
            </div>
          )}
          {status === 'empty' && (
            <p className="search-status">No books found for “{debouncedQuery}”.</p>
          )}
          {status === 'results' && (
            <ul>
              {books.map((book, index) => (
                <li
                  key={book.key ?? `${debouncedQuery}-${index}`}
                  className="search-result"
                  role="option"
                >
                  <BookCover book={book} variant="spine" />
                  <div>
                    <p className="search-result-title">{book.title}</p>
                    <p className="search-result-author">{book.authorName}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
