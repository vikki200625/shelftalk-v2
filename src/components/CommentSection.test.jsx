import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../context/AuthContext'
import CommentSection from './CommentSection'

// CommentSection + AuthProvider both talk to the supabase module. Mock it
// here so tests never hit the network — the mock's `from()` chain closes
// over a mutable comments array so the post-then-refetch flow can be
// asserted against updated data.
const supabaseMock = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
  from: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ default: supabaseMock }))

function stubSupabase({
  session = null,
  initialComments = [],
  selectError = null,
} = {}) {
  const comments = [...initialComments]
  let failInsert = false
  let fromCalls = 0

  supabaseMock.auth.getSession.mockResolvedValue({ data: { session } })
  supabaseMock.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }))

  supabaseMock.from.mockImplementation((table) => {
    fromCalls += 1
    // Mirrors the real supabase chain: from().select().eq().order() returns
    // a thenable builder (the promise resolves when awaited).
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      insert: vi.fn(async ({ body, user_id, book_key }) => {
        if (failInsert) return { data: null, error: { message: 'Insert failed' } }
        comments.unshift({
          id: `c${comments.length + 1}`,
          body,
          user_id,
          book_key,
          created_at: '2026-08-01T00:00:00Z',
          profiles: { username: 'me' },
        })
        return { data: null, error: null }
      }),
      then: (onFulfilled, onRejected) => {
        const result =
          fromCalls === 1 && selectError
            ? { data: null, error: selectError }
            : { data: comments, error: null }
        return Promise.resolve(result).then(onFulfilled, onRejected)
      },
    }
    return chain
  })

  return { setFailInsert: (v) => (failInsert = v) }
}

function renderComments() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CommentSection bookKey="OL45804W" />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const VISITOR_SESSION = null
const USER_SESSION = { user: { id: 'u1', email: 'reader@example.com' } }

describe('CommentSection', () => {
  it('renders existing comments with the author username', async () => {
    stubSupabase({
      session: VISITOR_SESSION,
      initialComments: [
        {
          id: '1',
          body: 'A modern classic.',
          created_at: '2026-07-31T12:00:00Z',
          user_id: 'u1',
          profiles: { username: 'reader1' },
        },
      ],
    })

    renderComments()
    expect(await screen.findByText('A modern classic.')).toBeInTheDocument()
    expect(screen.getByText('reader1')).toBeInTheDocument()
  })

  it('shows an empty state when there are no comments', async () => {
    stubSupabase({ session: VISITOR_SESSION, initialComments: [] })

    renderComments()
    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument()
  })

  it('shows an error state and recovers on retry', async () => {
    stubSupabase({
      session: VISITOR_SESSION,
      initialComments: [{ id: '1', body: 'Back online', created_at: 'x', user_id: 'u1', profiles: { username: 'a' } }],
      selectError: { message: 'down' },
    })

    renderComments()
    await waitFor(() => expect(screen.getByText(/couldn.t load the comments/i)).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Back online')).toBeInTheDocument()
  })

  it('shows a sign-in prompt and no form to visitors', async () => {
    stubSupabase({ session: VISITOR_SESSION, initialComments: [] })

    renderComments()
    // "Sign in" is its own Link, so the sentence is split across elements —
    // assert the link role and the sentence fragment separately.
    expect(await screen.findByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/to join the discussion/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/share your thoughts/i)).not.toBeInTheDocument()
  })

  it('lets a signed-in user post a comment and see it appear', async () => {
    stubSupabase({ session: USER_SESSION, initialComments: [] })

    renderComments()
    await screen.findByText(/no comments yet/i)

    const textarea = screen.getByLabelText(/share your thoughts/i)
    await userEvent.type(textarea, 'Loved it!')
    await userEvent.click(screen.getByRole('button', { name: /post comment/i }))

    expect(await screen.findByText('Loved it!')).toBeInTheDocument()
    // The textarea is cleared after a successful post.
    await waitFor(() => expect(textarea).toHaveValue(''))
  })

  it('shows an error when posting fails', async () => {
    const { setFailInsert } = stubSupabase({ session: USER_SESSION, initialComments: [] })
    setFailInsert(true)

    renderComments()
    await screen.findByText(/no comments yet/i)

    await userEvent.type(screen.getByLabelText(/share your thoughts/i), 'This will fail')
    await userEvent.click(screen.getByRole('button', { name: /post comment/i }))

    expect(await screen.findByText('Insert failed')).toBeInTheDocument()
  })
})
