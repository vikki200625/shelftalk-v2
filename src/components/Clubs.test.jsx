import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Clubs from '../pages/Clubs'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    profile: { username: 'reader1' },
  }),
}))

vi.mock('../lib/clubs', () => ({
  getClubs: vi.fn().mockResolvedValue([
    {
      id: 'club-1',
      name: 'Midnight Mystery Readers',
      description: 'We read mystery novels and discuss them late at night.',
      genre: 'Mystery',
      member_count: 12,
      created_at: '2026-01-15T00:00:00Z',
      creator_username: 'bookworm42',
    },
    {
      id: 'club-2',
      name: 'Fantasy Circle',
      description: 'Epic fantasy, swords and sorcery, and all things magical.',
      genre: 'Fantasy',
      member_count: 8,
      created_at: '2026-02-20T00:00:00Z',
      creator_username: 'wiz_reader',
    },
  ]),
  getClub: vi.fn(),
  joinClub: vi.fn(),
  leaveClub: vi.fn(),
  createClub: vi.fn(),
  getClubDiscussions: vi.fn(),
  createDiscussion: vi.fn(),
}))

describe('Clubs page', () => {
  it('renders page title', () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    expect(screen.getByText('Book Clubs')).toBeInTheDocument()
  })

  it('shows subtitle', () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    expect(screen.getByText('Find your reading community')).toBeInTheDocument()
  })

  it('shows search input', () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('Search clubs by name…')).toBeInTheDocument()
  })

  it('shows create club button for logged-in users', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('+ Create Club')).toBeInTheDocument()
    })
  })

  it('shows club cards after loading', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Midnight Mystery Readers')).toBeInTheDocument()
      expect(screen.getByText('Fantasy Circle')).toBeInTheDocument()
    })
  })

  it('shows club descriptions', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/We read mystery novels/)).toBeInTheDocument()
      expect(screen.getByText(/Epic fantasy/)).toBeInTheDocument()
    })
  })

  it('shows member counts', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('12 members')).toBeInTheDocument()
      expect(screen.getByText('8 members')).toBeInTheDocument()
    })
  })

  it('links each club to its detail page', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      const clubCards = screen.getAllByRole('link')
      const clubLink = clubCards.find(el => el.getAttribute('href') === '/clubs/club-1')
      expect(clubLink).toBeInTheDocument()
    })
  })

  it('links create button to /clubs/new', async () => {
    render(
      <MemoryRouter>
        <Clubs />
      </MemoryRouter>
    )
    await waitFor(() => {
      const link = screen.getByText('+ Create Club')
      expect(link).toHaveAttribute('href', '/clubs/new')
    })
  })
})
