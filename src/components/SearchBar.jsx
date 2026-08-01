import { useEffect, useRef, useState } from 'react'
import BookCover from './BookCover'
import { searchBooks } from '../lib/openlibrary'

const DEBOUNCE_MS = 300

/**
 * SearchBar — live book search. Typing is debounced, then OpenLibrary is
 * queried and the results appear in a dropdown. Selecting a result does
 * nothing yet (the book detail page is a future slice).
 *
 * Props (all optional):
 * - query / onQueryChange: controlled mode — lets the Hero wire quick
 *   links ("Dune") into the search box.
 */
export default function SearchBar({ query: externalQuery, onQueryChange, inputRef: externalInputRef }) {
  const [internalQuery, setInternalQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | results | empty | error
  const [books, setBooks] = useState([])
  const [open, setOpen] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [activeIndex, setActiveIndex] = useState(-1)
  const internalInputRef = useRef(null)
  const containerRef = useRef(null)

  const inputRef = externalInputRef ?? internalInputRef

  const query = externalQuery ?? internalQuery
  const setQuery = (value) => {
    if (onQueryChange) onQueryChange(value)
    else setInternalQuery(value)
  }

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
      setActiveIndex(-1)
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    setBooks([])
    setActiveIndex(-1)
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

  // Keyboard navigation for the results listbox.
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (status !== 'results' || books.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (i + 1) % books.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i <= 0 ? books.length - 1 : i - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      // Book detail page is a future slice — for now Enter just keeps the
      // highlight and leaves the dropdown open.
      event.preventDefault()
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(books.length - 1)
    }
  }

  const dropdownId = 'search-dropdown'

  return (
    <div className="search" ref={containerRef}>
      <span className="material-symbols-outlined search-icon">search</span>
      <input
        aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={dropdownId}
        aria-expanded={open}
        aria-label="Search by title, author, or ISBN"
        aria-haspopup="listbox"
        className="search-input"
        id="hero-search"
        ref={inputRef}
        role="combobox"
        type="text"
        placeholder="Search by title, author, or ISBN…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div className="search-dropdown" id={dropdownId} role="listbox">
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
                  id={`search-option-${index}`}
                  className={`search-result${index === activeIndex ? ' search-result--active' : ''}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
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
