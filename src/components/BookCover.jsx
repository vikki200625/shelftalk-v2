import { useState } from 'react'

// Maps a cover--* fallback class to its matching book-spine--* class so
// the search dropdown spine fallback varies per book instead of being
// green for everything.
const SPINE_BY_COVER = {
  'cover--forest': 'book-spine--primary',
  'cover--gold': 'book-spine--accent',
  'cover--terracotta': 'book-spine--terracotta',
  'cover--sage': 'book-spine--sage',
  'cover--olive': 'book-spine--olive',
  'cover--umber': 'book-spine--umber',
}

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
    const spineClass = SPINE_BY_COVER[book.fallbackCover] ?? 'book-spine--primary'
    return <div className={`book-spine ${spineClass}`} aria-hidden="true" />
  }

  if (variant === 'large') {
    if (showImage) {
      return (
        <img
          className="detail-cover-image"
          src={book.coverUrl}
          alt={book.title}
          onError={() => setImgFailed(true)}
        />
      )
    }
    return (
      <div className={`detail-cover-fallback ${book.fallbackCover}`}>
        <span className="detail-cover-title">{book.title}</span>
      </div>
    )
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
