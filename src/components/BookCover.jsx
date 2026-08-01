import { useState } from 'react'

/**
 * BookCover — renders a book's cover image, falling back to a CSS-drawn
 * book (gradient card or small spine) when the API has no cover or the
 * image fails to load. Shared by the search dropdown (variant="spine")
 * and the trending/genre cards (variant="card").
 */
export default function BookCover({ book, variant = 'card' }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(book.coverUrl) && !imgFailed

  if (variant === 'spine') {
    if (showImage) {
      return (
        <img
          className="search-cover"
          src={book.coverUrl}
          alt={book.title}
          onError={() => setImgFailed(true)}
        />
      )
    }
    return <div className="book-spine book-spine--primary" aria-hidden="true" />
  }

  return (
    <div className={`trend-cover ${showImage ? 'trend-cover--image ' : ''}${book.fallbackCover}`}>
      {showImage ? (
        <img
          className="trend-cover-image"
          src={book.coverUrl}
          alt={book.title}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <>
          <span className="trend-cover-kicker">{book.year ?? 'Book'}</span>
          <span className="trend-cover-title">{book.title}</span>
          <span className="trend-cover-author">{book.authorName}</span>
        </>
      )}
    </div>
  )
}
