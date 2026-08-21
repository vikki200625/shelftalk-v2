import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import {
  rateBook,
  getUserRating,
  getBookRating,
  getBookRatings,
  deleteRating,
} from '../lib/reviews'

const MAX_CHARS = 500

/**
 * StarRating — interactive rating + optional review on the book detail
 * page, rendered below the comment section.
 *
 * Signed-in users: click a star to rate (re-click to change), type an
 * optional review (500 chars max), save or remove their rating. Their
 * existing rating is pre-filled on load.
 * Visitors: read-only — average rating, reviews, and a sign-in prompt.
 *
 * bookKey is the short OpenLibrary work key from the URL (e.g. 'OL45804W').
 */
export default function StarRating({ bookKey }) {
  const { user } = useAuth()

  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [myRating, setMyRating] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [attempt, setAttempt] = useState(0)

  async function refreshStats() {
    const [{ average: avg, count: n }, rows] = await Promise.all([
      getBookRating(bookKey),
      getBookRatings(bookKey),
    ])
    setAverage(avg)
    setCount(n)
    setReviews(rows)
  }

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    Promise.all([refreshStats(), user ? getUserRating(bookKey) : Promise.resolve(null)])
      .then(([, mine]) => {
        if (cancelled) return
        setMyRating(mine?.rating ?? null)
        setReviewText(mine?.review_text ?? '')
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // user?.id (not user) keeps this stable across renders, but re-runs
    // once AuthContext finishes restoring the session after a hard refresh.
  }, [bookKey, attempt, user?.id])

  async function handleRate(value) {
    if (!user || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await rateBook(bookKey, value, reviewText.trim() || null)
      await refreshStats()
      setMyRating(value)
      flashSaved()
    } catch (err) {
      setSubmitError(err.message || "Couldn't save your rating.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveReview(event) {
    event.preventDefault()
    if (!user || !myRating || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await rateBook(bookKey, myRating, reviewText.trim() || null)
      await refreshStats()
      flashSaved()
    } catch (err) {
      setSubmitError(err.message || "Couldn't save your review.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!user || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await deleteRating(bookKey)
      await refreshStats()
      setMyRating(null)
      setReviewText('')
      flashSaved()
    } catch (err) {
      setSubmitError(err.message || "Couldn't remove your rating.")
    } finally {
      setSubmitting(false)
    }
  }

  function flashSaved() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <section className="ratings" aria-label="Ratings and reviews">
      <h2 className="comments-title">Ratings &amp; Reviews</h2>

      <div className="ratings-summary">
        <span className="ratings-average" aria-hidden="true">
          {average > 0 ? average.toFixed(1) : '–'}
        </span>
        <div>
          <div
            className="ratings-stars ratings-stars-static"
            role="img"
            aria-label={`Average rating ${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'rating' : 'ratings'}`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= Math.round(average) ? 'star star-filled' : 'star'}>
                ★
              </span>
            ))}
          </div>
          <p className="ratings-count">
            {count === 0 ? 'No ratings yet' : `${count} ${count === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>
      </div>

      {status === 'loading' && <p className="section-status">Loading ratings…</p>}
      {status === 'error' && (
        <div className="section-status">
          <p>Couldn&apos;t load ratings.</p>
          <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && user && (
        <form className="ratings-form" onSubmit={handleSaveReview}>
          <p className="comments-label">Your rating</p>
          <div className="ratings-stars ratings-stars-input" role="radiogroup" aria-label="Rate this book">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={myRating === star}
                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                className={star <= myRating ? 'star star-btn star-filled' : 'star star-btn'}
                disabled={submitting}
                onClick={() => handleRate(star)}
              >
                ★
              </button>
            ))}
          </div>

          <label className="comments-label" htmlFor="review-text">
            Your review <span className="ratings-optional">(optional)</span>
          </label>
          <textarea
            id="review-text"
            className="comments-textarea"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="What did you think of this book?"
            maxLength={MAX_CHARS}
          />
          <p className="ratings-char-count">{reviewText.length}/{MAX_CHARS}</p>

          {submitError && <p className="comments-error" role="alert">{submitError}</p>}
          {savedFlash && <p className="ratings-saved">Saved!</p>}

          <div className="comments-actions">
            <button
              className="retry-btn comments-submit"
              type="submit"
              disabled={!myRating || submitting}
            >
              Save review
            </button>
            {myRating != null && (
              <button
                className="ratings-delete"
                type="button"
                disabled={submitting}
                onClick={handleDelete}
              >
                Remove my rating
              </button>
            )}
          </div>
        </form>
      )}

      {status === 'ready' && !user && (
        <p className="comments-signin">
          <Link className="comments-signin-link" to="/signin">Sign in</Link> to rate and review
          this book.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="comments-list ratings-list">
          {reviews.map((review) => (
            <li className="comments-item" key={review.id}>
              <div className="comments-meta">
                <span className="comments-author">{review.username}</span>
                <span className="ratings-list-stars" aria-label={`Rated ${review.rating} out of 5`}>
                  {'★'.repeat(review.rating)}
                  <span className="ratings-list-empty">{'★'.repeat(5 - review.rating)}</span>
                </span>
                <span className="comments-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.review_text && <p className="comments-body">{review.review_text}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
