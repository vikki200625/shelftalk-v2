import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fetchWork } from '../lib/openlibrary'
import BookCover from './BookCover'
import CommentSection from './CommentSection'
import StarRating from './StarRating'

/**
 * BookDetail — the /book/:key page. The header renders instantly from
 * the book object passed in router state (title, author, year, rating,
 * cover), then fetchWork() upgrades it with description and subject
 * tags. Deep links (no state) fall back to the fetched title.
 */
export default function BookDetail() {
  const { key } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const stateBook = location.state?.book

  const [status, setStatus] = useState('loading') // loading | error | ready
  const [detail, setDetail] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetchWork(key, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setDetail(result)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [key, attempt])

  const title = detail?.title ?? stateBook?.title
  const authorName = stateBook?.authorName
  const year = detail?.firstPublishYear ?? stateBook?.year
  const rating = stateBook?.rating ?? null
  const coverBook = {
    title,
    coverUrl: detail?.largeCoverUrl ?? stateBook?.coverUrl ?? null,
    fallbackCover: stateBook?.fallbackCover ?? 'cover--forest',
  }

  return (
    <article className="detail">
      <button className="detail-back" type="button" onClick={() => navigate(-1)}>
        ← Back to browsing
      </button>

      <div className="detail-header">
        <BookCover book={coverBook} variant="large" />
        <div className="detail-info">
          <h1 className="detail-title">{title ?? 'Book'}</h1>
          {authorName && <p className="detail-author">{authorName}</p>}
          <div className="detail-meta">
            {rating != null && <span className="trend-rating">★ {rating}</span>}
            {year != null && <span className="detail-meta-item">{year}</span>}
          </div>
          {detail?.subjects.length > 0 && (
            <div className="detail-tags">
              {detail.subjects.map((subject) => (
                <span className="detail-tag" key={subject}>
                  {subject}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {status === 'loading' && <p className="section-status">Loading details…</p>}
      {status === 'error' && (
        <div className="section-status">
          <p>Couldn&apos;t load the details for this book.</p>
          <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && detail?.description && (
        <p className="detail-description">{detail.description}</p>
      )}

      <CommentSection bookKey={key} />
      <StarRating bookKey={key} />
    </article>
  )
}
