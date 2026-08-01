import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import supabase from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * CommentSection — the discussion section at the bottom of a book's
 * detail page. Anyone can read the comments; only signed-in users can
 * post (they always post as themselves via RLS). Visitors see a
 * sign-in prompt instead of the form.
 *
 * bookKey is the short OpenLibrary work key from the URL (e.g. 'OL45804W').
 */
export default function CommentSection({ bookKey }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    supabase
      .from('book_comments')
      .select('id, body, created_at, user_id, profiles(username)')
      .eq('book_key', bookKey)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setStatus('error')
          return
        }
        setComments(data ?? [])
        setStatus('ready')
      })

    return () => {
      cancelled = true
    }
  }, [bookKey, attempt])

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || !user) return

    setSubmitting(true)
    setSubmitError(null)

    const { error } = await supabase.from('book_comments').insert({
      book_key: bookKey,
      user_id: user.id,
      body: trimmed,
    })

    setSubmitting(false)

    if (error) {
      setSubmitError(error.message ?? 'Could not post your comment.')
      return
    }

    setBody('')
    setAttempt((n) => n + 1) // refetch so the new comment shows up
  }

  return (
    <section className="comments" aria-label={`Comments on ${bookKey}`}>
      <h2 className="comments-title">Comments</h2>

      {status === 'loading' && <p className="section-status">Loading comments…</p>}
      {status === 'error' && (
        <div className="section-status">
          <p>Couldn&apos;t load the comments.</p>
          <button className="retry-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && comments.length === 0 && (
        <p className="section-status">No comments yet — be the first to share your thoughts.</p>
      )}
      {status === 'ready' && comments.length > 0 && (
        <ul className="comments-list">
          {comments.map((comment) => (
            <li className="comments-item" key={comment.id}>
              <div className="comments-meta">
                <span className="comments-author">{comment.profiles?.username ?? 'Reader'}</span>
                <span className="comments-date">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="comments-body">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="comments-form" onSubmit={handleSubmit}>
          <label className="comments-label" htmlFor="comment-body">
            Share your thoughts
          </label>
          <textarea
            className="comments-textarea"
            id="comment-body"
            rows="3"
            maxLength="2000"
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What did you think of this book?"
          />
          {submitError && <p className="comments-error">{submitError}</p>}
          <div className="comments-actions">
            <button className="retry-btn comments-submit" type="submit" disabled={submitting || !body.trim()}>
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="comments-signin">
          <Link to="/signin" className="comments-signin-link">
            Sign in
          </Link>{' '}
          to join the discussion.
        </p>
      )}
    </section>
  )
}
