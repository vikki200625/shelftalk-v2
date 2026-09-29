import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { addToShelf, removeFromShelf, getBookShelf } from '../lib/library'

const SHELVES = [
  { id: 'want_to_read', label: 'Want to Read' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'finished', label: 'Finished' },
]

/**
 * ShelfSelector — save-to-shelf controls on the book detail page.
 *
 * bookKey is the short OL work key from the URL (e.g. 'OL45804W');
 * user_library stores the long '/works/…' form (what fetchWork and the
 * Library page also handle), so the prefix is applied here and the
 * existing rows match exactly.
 *
 * Signed-in users get the three shelf buttons plus Remove; visitors get
 * a sign-in prompt. The current shelf is loaded with getBookShelf and
 * shown as the active button.
 */
export default function ShelfSelector({ bookKey }) {
  const { user } = useAuth()
  const storageKey = `/works/${bookKey}`

  const [current, setCurrent] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setCurrent(null)
      setStatus('ready')
      return
    }
    setStatus('loading')
    getBookShelf(user.id, storageKey).then(({ data }) => {
      if (cancelled) return
      setCurrent(data?.shelf ?? null)
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
    // user?.id (not user) keeps this stable across renders, but re-runs
    // once AuthContext restores the session after a hard refresh — same
    // pattern as StarRating.
  }, [user?.id, storageKey])

  function flashSaved() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  async function choose(shelf) {
    if (!user || saving || shelf === current) return
    setSaving(true)
    setError(null)
    const { error: saveError } = await addToShelf(user.id, storageKey, shelf)
    if (saveError) {
      setError("Couldn't save to your shelf.")
    } else {
      setCurrent(shelf)
      flashSaved()
    }
    setSaving(false)
  }

  async function handleRemove() {
    if (!user || saving) return
    setSaving(true)
    setError(null)
    const { error: removeError } = await removeFromShelf(user.id, storageKey)
    if (removeError) {
      setError("Couldn't remove this book from your shelf.")
    } else {
      setCurrent(null)
      flashSaved()
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="shelf-save">
        <p className="comments-signin">
          <Link to="/signin" className="comments-signin-link">
            Sign in
          </Link>{' '}
          to save this book to your library.
        </p>
      </div>
    )
  }

  return (
    <div className="shelf-save" aria-label="Save to your library">
      <p className="shelf-save-label" id="shelf-save-label">
        Save to library
      </p>

      {status === 'loading' ? (
        <p className="shelf-save-loading">Loading your shelf…</p>
      ) : (
        <div className="shelf-save-options" role="group" aria-labelledby="shelf-save-label">
          {SHELVES.map((shelf) => (
            <button
              key={shelf.id}
              type="button"
              className={
                current === shelf.id
                  ? 'shelf-save-btn shelf-save-btn--active'
                  : 'shelf-save-btn'
              }
              aria-pressed={current === shelf.id}
              disabled={saving}
              onClick={() => choose(shelf.id)}
            >
              {shelf.label}
            </button>
          ))}
          {current && (
            <button
              className="shelf-save-remove"
              type="button"
              disabled={saving}
              onClick={handleRemove}
            >
              Remove
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="comments-error" role="alert">
          {error}
        </p>
      )}
      {savedFlash && (
        <p className="ratings-saved" aria-live="polite">
          Saved!
        </p>
      )}
    </div>
  )
}
