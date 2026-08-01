import { useEffect, useRef, useState } from 'react'

const SUGGESTIONS = [
  { title: 'Dune', author: 'Frank Herbert', spine: 'primary' },
  { title: 'The Alchemist', author: 'Paulo Coelho', spine: 'accent' },
  { title: 'Atomic Habits', author: 'James Clear', spine: 'slate' },
]

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

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
        className="search-input"
        id="hero-search"
        type="text"
        placeholder="Search by title, author, or ISBN…"
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="search-dropdown">
          <ul>
            {SUGGESTIONS.map((book) => (
              <li key={book.title} className="search-result">
                <div className={`book-spine book-spine--${book.spine}`} />
                <div>
                  <p className="search-result-title">{book.title}</p>
                  <p className="search-result-author">{book.author}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
