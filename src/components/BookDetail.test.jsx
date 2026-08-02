import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../context/AuthContext'
import BookDetail from './BookDetail'

// BookDetail renders CommentSection, which uses useAuth and calls
// supabase.from(...). Mock the supabase module so the auth provider is
// inert and comment queries never hit the network.
const supabaseMock = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
  from: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ default: supabaseMock }))

supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } })
supabaseMock.auth.onAuthStateChange.mockImplementation(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))
supabaseMock.from.mockImplementation((table) => {
  // AuthContext fetches profiles on login — return a fake profile row.
  if (table === 'profiles') {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  }
  // Mirrors the real supabase chain: from().select().eq().order() returns
  // a thenable builder (the promise resolves when awaited).
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
  }
  return chain
})

const WORK = {
  key: '/works/OL45804W',
  title: 'Dune',
  description: 'Great sci-fi.',
  subjects: ['Fiction', 'Science', 'A very long subject that should not appear'],
  covers: [-1, 5],
}

function renderDetail({ book, key = 'OL45804W' } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: `/book/${key}`, state: book ? { book } : undefined }]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/book/:key" element={<BookDetail />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('BookDetail', () => {
  it('renders the header instantly from router state, then fetched detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => WORK }))

    renderDetail({
      book: {
        key: '/works/OL45804W',
        title: 'Dune',
        authorName: 'Frank Herbert',
        year: 1965,
        coverUrl: null,
        rating: 4.8,
        fallbackCover: 'cover--forest',
      },
    })

    // Instant from state — no waiting.
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    expect(screen.getByText(/★ 4.8/)).toBeInTheDocument()

    // Fetched details arrive async.
    expect(await screen.findByText('Great sci-fi.')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
  })

  it('normalizes the description object form and skips -1 covers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...WORK, description: { type: '/type/text', value: 'Object form.' }, covers: [-1] }),
      }),
    )

    renderDetail({})
    expect(await screen.findByText('Object form.')).toBeInTheDocument()
  })

  it('shows an error state and retries', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ ok: true, json: async () => WORK })
    vi.stubGlobal('fetch', fetchMock)

    renderDetail({ book: { key: '/works/OL45804W', title: 'Dune' } })
    await waitFor(() => expect(screen.getByText(/couldn.t load the details/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Great sci-fi.')).toBeInTheDocument()
  })

  it('follows a redirect record to the target work', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: { key: '/type/redirect' }, location: '/works/OL45804W' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => WORK })
    vi.stubGlobal('fetch', fetchMock)

    renderDetail({ key: 'OLOLDW' })
    expect(await screen.findByText('Great sci-fi.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('renders a deep link without router state using the fetched title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => WORK }))

    renderDetail({})
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    // No state → no author line, no rating/year.
    expect(screen.queryByText('Frank Herbert')).not.toBeInTheDocument()
  })

  it('renders the comment section at the end of the page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => WORK }))

    renderDetail({ book: { key: '/works/OL45804W', title: 'Dune', authorName: 'Frank Herbert' } })
    expect(await screen.findByRole('heading', { name: /comments/i })).toBeInTheDocument()
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
  })
})
