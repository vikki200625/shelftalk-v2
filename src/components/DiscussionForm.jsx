import { useState } from 'react'

export default function DiscussionForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setLoading(true)
    setError('')
    try {
      await onSubmit({ title: title.trim(), body: body.trim() })
      setTitle('')
      setBody('')
    } catch (err) {
      setError(err.message || 'Failed to post discussion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="discussion-form" onSubmit={handleSubmit}>
      <h3 className="discussion-form-heading">Start a Discussion</h3>
      {error && <p className="discussion-form-error">{error}</p>}
      <input
        className="discussion-form-input"
        placeholder="Discussion title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        required
      />
      <textarea
        className="discussion-form-textarea"
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        required
      />
      <button
        className="discussion-form-submit"
        type="submit"
        disabled={loading || !title.trim() || !body.trim()}
      >
        {loading ? 'Posting…' : 'Post Discussion'}
      </button>
    </form>
  )
}
