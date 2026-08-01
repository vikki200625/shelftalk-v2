import { Link } from 'react-router'
import BookCover from './BookCover'

/**
 * BookCard — the shared book card used by the trending section and the
 * genre shelves: cover art (real image or CSS gradient fallback) with
 * title, author, and a meta line (rating when the API has one, else year).
 * The whole card links to the book's detail page when it has a key.
 */
export default function BookCard({ book }) {
  const card = (
    <div className="trend-card">
      <BookCover book={book} variant="card" />
      <p className="trend-title">{book.title}</p>
      <p className="trend-author">{book.authorName}</p>
      {book.rating != null ? (
        <p className="trend-rating">★ {book.rating}</p>
      ) : (
        book.year != null && <p className="trend-rating">{book.year}</p>
      )}
    </div>
  )

  if (!book.key) return card

  return (
    <Link
      className="trend-card-link"
      to={`/book/${book.key.split('/').pop()}`}
      state={{ book }}
    >
      {card}
    </Link>
  )
}
