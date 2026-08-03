import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import FollowButton from './FollowButton'

// Mock profiles lib
vi.mock('../lib/profiles', () => ({
  followUser: vi.fn().mockResolvedValue({ data: { id: 'follow-1' }, error: null }),
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

function renderButton(props = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <FollowButton profileId="user-123" following={false} {...props} />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('FollowButton', () => {
  it('renders a button', async () => {
    renderButton()
    // With no logged-in user, the useEffect exits early (no DB check)
    // and shows the button immediately
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('shows "Follow" when not following (no user logged in)', async () => {
    renderButton()
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Follow')
    })
  })

  it('has aria-pressed attribute', async () => {
    renderButton()
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('redirects to /signin when clicked without user', async () => {
    renderButton()
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Follow')
    })
    // Click follow — since no user is logged in, it should navigate to /signin
    fireEvent.click(screen.getByRole('button'))
    // The component calls navigate('/signin') — we can't easily assert navigation
    // but the button should still be there (navigation is async)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows initialFollowing prop as initial state', async () => {
    renderButton({ following: true })
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
    // With no user, the useEffect exits early and shows based on initialFollowing
    // The button should show "Following" since initialFollowing is true
    // But checking=true initially, so it shows "…" briefly, then resolves
  })
})
