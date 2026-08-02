import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import BookCard from './BookCard'

export default function ShelfSection({ title, shelf, books, onRemove, icon }) {
  const [expanded, setExpanded] = useState(false)
  const displayBooks = expanded ? books : books.slice(0, 5)

  if (books.length === 0) return null

  return (
    <section className="shelf-section">
      <div className="shelf-header">
        <div className="shelf-title-row">
          <span className="shelf-icon" aria-hidden="true">{icon}</span>
          <h2 className="shelf-title">{title}</h2>
          <span className="shelf-count">{books.length}</span>
        </div>
      </div>
      <div className="shelf-books">
        {displayBooks.map((book) => (
          <div className="shelf-book-item" key={book.book_key}>
            <BookCard book={book} />
            {onRemove && (
              <button
                className="shelf-remove-btn"
                onClick={() => onRemove(book.book_key)}
                title="Remove from shelf"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {books.length > 5 && (
        <button
          className="shelf-expand-btn"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? 'Show less' : `See all ${books.length} books`}
        </button>
      )}
    </section>
  )
}
