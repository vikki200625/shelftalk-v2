import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock library lib
vi.mock('../lib/library', () => ({
  getReadingGoal: vi.fn().mockResolvedValue({ data: { target: 24 }, error: null }),
  setReadingGoal: vi.fn().mockResolvedValue({ data: { target: 24 }, error: null }),
  getBooksFinishedCount: vi.fn().mockResolvedValue({ count: 10, error: null }),
}))

// Mock supabase
vi.mock('../lib/supabase', () => {
  const chain = () => chain
  chain.select = () => chain
  chain.eq = () => chain
  chain.neq = () => chain
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
  chain.single = () => chain
  chain.insert = () => chain
  chain.update = () => chain
  chain.delete = () => chain
  chain.order = () => chain
  chain.limit = () => chain
  chain.is = () => chain
  chain.gte = () => chain
  chain.lte = () => chain
  chain.ilike = () => chain
  chain.upsert = () => chain
  chain.head = () => chain
  chain.subscribe = () => ({ unsubscribe: vi.fn() })
  chain.on = () => chain
  chain.channel = () => chain
  return {
    default: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: () => chain,
      channel: () => chain,
    },
  }
})

import ReadingGoal from './ReadingGoal'
import { getReadingGoal, setReadingGoal, getBooksFinishedCount } from '../lib/library'

beforeEach(() => {
  vi.clearAllMocks()
  getReadingGoal.mockResolvedValue({ data: { target: 24 }, error: null })
  setReadingGoal.mockResolvedValue({ data: { target: 24 }, error: null })
  getBooksFinishedCount.mockResolvedValue({ count: 10, error: null })
})

describe('ReadingGoal', () => {
  it('shows nothing while loading', () => {
    const { container } = render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    // Returns null while loading
    expect(container.innerHTML).toBe('')
  })

  it('renders the goal progress after loading', async () => {
    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/Reading Goal/)).toBeInTheDocument()
    })
    // Should show 10 of 24
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('shows motivational message based on progress', async () => {
    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/down/)).toBeInTheDocument()
    })
  })

  it('shows "Set goal" button when no goal exists', async () => {
    getReadingGoal.mockResolvedValue({ data: null, error: null })
    getBooksFinishedCount.mockResolvedValue({ count: 0, error: null })

    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Set goal')).toBeInTheDocument()
    })
  })

  it('shows "Edit" button when goal exists', async () => {
    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  it('opens edit form when Edit is clicked', async () => {
    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('saves the goal when Save is clicked', async () => {
    render(
      <MemoryRouter>
        <ReadingGoal userId="user-1" />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Save'))
    expect(setReadingGoal).toHaveBeenCalled()
  })
})
