import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Library from '../pages/Library'

// Mock auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}))

// Mock library API
vi.mock('../lib/library', () => ({
  getShelfBooks: vi.fn().mockResolvedValue({ data: [], error: null }),
  removeFromShelf: vi.fn().mockResolvedValue({ error: null }),
  getBookShelf: vi.fn().mockResolvedValue({ data: null, error: null }),
  addToShelf: vi.fn().mockResolvedValue({ data: {}, error: null }),
  getReadingGoal: vi.fn().mockResolvedValue({ data: null, error: null }),
  setReadingGoal: vi.fn().mockResolvedValue({ data: {}, error: null }),
  getBooksFinishedCount: vi.fn().mockResolvedValue({ count: 0, error: null }),
}))

// Mock Open Library
vi.mock('../lib/openlibrary', () => ({
  fetchBook: vi.fn().mockResolvedValue({ title: 'Test Book', authors: ['Author'] }),
}))

describe('Library page', () => {
  it('renders page title', () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    )
    expect(screen.getByText('My Library')).toBeInTheDocument()
  })

  it('shows empty state when no books', async () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/your shelves are empty/i)).toBeInTheDocument()
    })
  })

  it('shows browse link in empty state', async () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Browse Books')).toBeInTheDocument()
    })
  })

  it('shows reading goal section', async () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/reading goal \d{4}/i)).toBeInTheDocument()
    })
  })

  it('shows set goal button when no goal exists', async () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Set goal')).toBeInTheDocument()
    })
  })
})
