import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import UserCard from './UserCard'

// Mock profiles lib
vi.mock('../lib/profiles', () => ({
  followUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
  unfollowUser: vi.fn().mockResolvedValue({ error: null }),
  fetchFollowStatus: vi.fn().mockResolvedValue({ following: false }),
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

import { AuthProvider } from '../context/AuthContext'

const mockUser = {
  id: 'user-1',
  username: 'alice',
  display_name: 'Alice Wonder',
  avatar_url: null,
  bio: 'I love reading fantasy novels and sci-fi.',
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserCard user={mockUser} currentUserId="user-2" {...props} />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('UserCard', () => {
  it('renders the display name', async () => {
    renderCard()
    await waitFor(() => {
      expect(screen.getByText('Alice Wonder')).toBeInTheDocument()
    })
  })

  it('renders the username with @ prefix', async () => {
    renderCard()
    await waitFor(() => {
      expect(screen.getByText('@alice')).toBeInTheDocument()
    })
  })

  it('renders the bio', async () => {
    renderCard()
    await waitFor(() => {
      expect(screen.getByText(/I love reading fantasy/)).toBeInTheDocument()
    })
  })

  it('truncates long bio to 80 chars', async () => {
    const longBioUser = {
      ...mockUser,
      bio: 'This is a very long bio that should be truncated because it exceeds eighty characters in total length.',
    }
    renderCard({ user: longBioUser })
    await waitFor(() => {
      const bio = screen.getByText(/\.\.\.$/)
      expect(bio.textContent.length).toBeLessThanOrEqual(83) // 80 + "..."
    })
  })

  it('links to the profile page', async () => {
    renderCard()
    await waitFor(() => {
      expect(screen.getByText('Alice Wonder')).toBeInTheDocument()
    })
    const link = screen.getByText('Alice Wonder').closest('a')
    expect(link).toHaveAttribute('href', '/profile/alice')
  })

  it('does not show bio when user has no bio', async () => {
    const noBioUser = { ...mockUser, bio: null }
    renderCard({ user: noBioUser })
    await waitFor(() => {
      expect(screen.getByText('Alice Wonder')).toBeInTheDocument()
    })
    expect(screen.queryByText(/I love reading/)).toBeNull()
  })
})
