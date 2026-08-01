import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import BookDetail from './BookDetail'

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
      <Routes>
        <Route path="/book/:key" element={<BookDetail />} />
      </Routes>
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
})
