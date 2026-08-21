import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import StarRating from './StarRating'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/reviews', () => ({
  rateBook: vi.fn(),
  getBookRating: vi.fn(),
  getUserRating: vi.fn(),
  getBookRatings: vi.fn(),
  deleteRating: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import {
  rateBook,
  getBookRating,
  getUserRating,
  getBookRatings,
  deleteRating,
} from '../lib/reviews'

const SIGNED_IN = { user: { id: 'user-1' } }
const SIGNED_OUT = { user: null }

function renderStars(bookKey = 'OL45804W') {
  return render(
    <MemoryRouter>
      <StarRating bookKey={bookKey} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getBookRating.mockResolvedValue({ average: 4.25, count: 2 })
  getBookRatings.mockResolvedValue([
    {
      id: 'r1',
      rating: 5,
      review_text: 'A modern classic.',
      username: 'alice',
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'r2',
      rating: 4,
      review_text: null,
      username: 'bob',
      created_at: '2026-08-02T00:00:00Z',
    },
  ])
})

describe('StarRating — visitor (signed out)', () => {
  it('shows average, count, and reviews read-only', async () => {
    useAuth.mockReturnValue(SIGNED_OUT)
    getUserRating.mockResolvedValue(null)
    renderStars()

    expect(await screen.findByText('4.3')).toBeInTheDocument() // 4.25 → toFixed(1)
    expect(screen.getByText('2 ratings')).toBeInTheDocument()
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByText('A modern classic.')).toBeInTheDocument()

    // no interactive controls for visitors
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.getByText(/to rate and review/i)).toBeInTheDocument()
  })

  it('shows empty state when no ratings exist', async () => {
    useAuth.mockReturnValue(SIGNED_OUT)
    getBookRating.mockResolvedValue({ average: 0, count: 0 })
    getBookRatings.mockResolvedValue([])
    renderStars()

    expect(await screen.findByText('No ratings yet')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows error state with retry when loading fails', async () => {
    useAuth.mockReturnValue(SIGNED_OUT)
    getBookRating.mockRejectedValue(new Error('boom'))
    renderStars()

    expect(await screen.findByText(/couldn't load ratings/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

    getBookRating.mockResolvedValue({ average: 4, count: 1 })
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('4.0')).toBeInTheDocument()
  })
})

describe('StarRating — signed in', () => {
  it('pre-fills the existing rating and review', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue({
      id: 'mine',
      rating: 4,
      review_text: 'Really enjoyed it',
    })
    renderStars()

    expect(await screen.findByRole('radiogroup')).toBeInTheDocument()
    const checked = screen.getByRole('radio', { checked: true })
    expect(checked).toHaveAttribute('aria-label', 'Rate 4 stars')
    expect(screen.getByLabelText(/your review/i)).toHaveValue('Really enjoyed it')
    expect(screen.getByRole('button', { name: /remove my rating/i })).toBeInTheDocument()
  })

  it('clicking a star saves the rating and refreshes stats', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue(null)
    rateBook.mockResolvedValue({ id: 'new', rating: 5 })
    getBookRating
      .mockResolvedValueOnce({ average: 0, count: 0 }) // initial load
      .mockResolvedValueOnce({ average: 5, count: 1 }) // after refresh

    renderStars()
    await screen.findByRole('radiogroup')

    await userEvent.click(screen.getByRole('radio', { name: 'Rate 5 stars' }))

    expect(rateBook).toHaveBeenCalledWith('OL45804W', 5, null)
    await waitFor(() => expect(screen.getByText('5.0')).toBeInTheDocument())
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('saves the review text via Save review button', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue({ id: 'mine', rating: 3, review_text: '' })
    rateBook.mockResolvedValue({ id: 'mine', rating: 3, review_text: 'Solid read' })

    renderStars()
    await screen.findByRole('radiogroup')

    const textarea = screen.getByLabelText(/your review/i)
    await userEvent.type(textarea, 'Solid read')
    await userEvent.click(screen.getByRole('button', { name: /save review/i }))

    await waitFor(() =>
      expect(rateBook).toHaveBeenCalledWith('OL45804W', 3, 'Solid read')
    )
  })

  it('caps review input at 500 chars', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue(null)
    renderStars()
    await screen.findByRole('radiogroup')

    const textarea = screen.getByLabelText(/your review/i)
    await userEvent.type(textarea, 'x'.repeat(505))
    expect(textarea).toHaveValue('x'.repeat(500))
  })

  it('Save review stays disabled until a star is chosen', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue(null)
    renderStars()
    await screen.findByRole('radiogroup')

    expect(screen.getByRole('button', { name: /save review/i })).toBeDisabled()
  })

  it('removes the rating and resets the form', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue({ id: 'mine', rating: 2, review_text: 'meh' })
    deleteRating.mockResolvedValue(undefined)

    renderStars()
    await screen.findByRole('radiogroup')

    await userEvent.click(screen.getByRole('button', { name: /remove my rating/i }))

    expect(deleteRating).toHaveBeenCalledWith('OL45804W')
    await waitFor(() =>
      expect(screen.getByLabelText(/your review/i)).toHaveValue('')
    )
    expect(screen.getByRole('button', { name: /save review/i })).toBeDisabled()
  })

  it('shows an alert on save failure', async () => {
    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue(null)
    rateBook.mockRejectedValue(new Error('rls blocked'))
    renderStars()
    await screen.findByRole('radiogroup')

    await userEvent.click(screen.getByRole('radio', { name: 'Rate 4 stars' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/rls blocked/)
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
  })

  it('pre-fills rating when the session restores after mount (hard refresh)', async () => {
    // Reproduces the auth hydration race: AuthContext starts with
    // user=null and restores the session asynchronously. The component
    // must re-fetch the user's rating once the session arrives.
    useAuth.mockReturnValue(SIGNED_OUT)
    const { rerender } = renderStars()
    await screen.findByText(/to rate and review/i)
    expect(getUserRating).not.toHaveBeenCalled()

    useAuth.mockReturnValue(SIGNED_IN)
    getUserRating.mockResolvedValue({
      id: 'mine',
      rating: 4,
      review_text: 'Restored review',
    })
    rerender(
      <MemoryRouter>
        <StarRating bookKey="OL45804W" />
      </MemoryRouter>
    )

    expect(await screen.findByRole('radio', { checked: true })).toHaveAttribute(
      'aria-label',
      'Rate 4 stars'
    )
    expect(screen.getByLabelText(/your review/i)).toHaveValue('Restored review')
  })
})
