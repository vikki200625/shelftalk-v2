import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../context/AuthContext'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import { validatePassword } from '../lib/validate'
import { fetchShelfCounts } from '../lib/profiles'

// Mock supabase so no component hits the network.
const supabaseMock = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
  from: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ default: supabaseMock }))

function stubAuth(session = null) {
  supabaseMock.auth.getSession.mockResolvedValue({ data: { session } })
  supabaseMock.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }))
}

// Build a thenable query-builder mock that resolves to the provided result.
function mockQuery(result) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

function stubFrom(tableResults) {
  supabaseMock.from.mockImplementation((table) => {
    const result = tableResults[table] || { data: null, error: { message: 'not found' } }
    return mockQuery(result)
  })
}

// ---- Avatar ----

describe('Avatar', () => {
  it('renders an image when avatarUrl is present', () => {
    render(<Avatar avatarUrl="https://example.com/a.jpg" username="reader" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg')
    expect(img).toHaveAttribute('alt', "reader's avatar")
  })

  it('renders initials fallback when no avatarUrl', () => {
    render(<Avatar username="bookworm" />)
    expect(screen.getByText('BO')).toBeInTheDocument()
  })

  it('uses display name for fallback initials when available', () => {
    render(<Avatar displayName="Jane Doe" username="janedoe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('is deterministic — same username always gets the same fallback', () => {
    const { container: first } = render(<Avatar username="bookworm" size={96} />)
    const { container: second } = render(<Avatar username="bookworm" size={96} />)
    const firstBg = first.querySelector('.avatar--fallback').style.background
    const secondBg = second.querySelector('.avatar--fallback').style.background
    expect(firstBg).toBe(secondBg)
  })
})

// ---- FollowButton ----

describe('FollowButton', () => {
  beforeEach(() => {
    stubAuth()
    // Mock fetchFollowStatus to return false by default
    supabaseMock.from.mockImplementation((table) => {
      if (table === 'user_follows') {
        return mockQuery({ data: null, error: null })
      }
      return mockQuery({ data: null, error: { message: 'not found' } })
    })
  })

  it('shows Follow when not following', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <FollowButton following={false} profileId="user-2" />
        </MemoryRouter>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('shows Following when already following', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <FollowButton following profileId="user-2" />
        </MemoryRouter>
      </AuthProvider>
    )
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Following' })
      expect(btn).toHaveAttribute('aria-pressed', 'true')
    })
  })
})

// ---- Profile page ----

describe('Profile page', () => {
  const profileRow = {
    id: 'user-1',
    username: 'bookworm',
    display_name: 'Book Worm',
    avatar_url: null,
    bio: 'I read a lot of fantasy.',
    created_at: '2026-01-15T10:00:00Z',
  }

  it('renders profile info from the username route param', async () => {
    stubAuth()
    stubFrom({
      profiles: { data: profileRow, error: null },
      user_follows: { data: [], error: null },
      user_library: { data: [], error: null },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/profile/bookworm']}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Book Worm')).toBeInTheDocument()
    })
    expect(screen.getByText('@bookworm')).toBeInTheDocument()
    expect(screen.getByText('I read a lot of fantasy.')).toBeInTheDocument()
    expect(screen.getByText(/member since/i)).toBeInTheDocument()
  })

  it('shows Edit profile button on own profile', async () => {
    const session = { user: { id: 'user-1', email: 'bookworm@test.com' } }
    stubAuth(session)
    stubFrom({
      profiles: { data: profileRow, error: null },
      user_follows: { data: [], error: null },
      user_library: { data: [], error: null },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/profile/bookworm']}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/settings" element={<div>settings-page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Edit profile')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument()
  })

  it('shows Follow button on someone else\'s profile', async () => {
    const session = { user: { id: 'me', email: 'me@test.com' } }
    stubAuth(session)
    supabaseMock.from.mockImplementation((table) => {
      if (table === 'profiles') return mockQuery({ data: profileRow, error: null })
      if (table === 'user_follows') return mockQuery({ data: null, error: null })
      if (table === 'user_library') return mockQuery({ data: [], error: null })
      return mockQuery({ data: null, error: { message: 'not found' } })
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/profile/bookworm']}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('shows not-found state for unknown username', async () => {
    stubAuth()
    stubFrom({
      profiles: { data: null, error: { message: 'no rows' } },
      user_follows: { data: [], error: null },
      user_library: { data: [], error: null },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/profile/ghost']}>
          <Routes>
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/No reader named/i)).toBeInTheDocument()
    })
  })
})

// ---- Settings page ----

describe('Settings page', () => {
  const profileRow = {
    id: 'user-1',
    username: 'bookworm',
    display_name: 'Book Worm',
    avatar_url: null,
    bio: 'I read a lot of fantasy.',
    created_at: '2026-01-15T10:00:00Z',
  }

  it('renders sign-in prompt when not authenticated', async () => {
    stubAuth()
    stubFrom({ profiles: { data: null, error: { message: 'no rows' } } })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Sign in required')).toBeInTheDocument()
    })
  })

  it('loads and displays current profile values', async () => {
    const session = { user: { id: 'user-1', email: 'bookworm@test.com' } }
    stubAuth(session)
    stubFrom({ profiles: { data: profileRow, error: null } })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toHaveValue('bookworm')
    })
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Book Worm')
    expect(screen.getByLabelText(/bio/i)).toHaveValue('I read a lot of fantasy.')
  })

  it('validates username length', async () => {
    const session = { user: { id: 'user-1', email: 'bookworm@test.com' } }
    stubAuth(session)
    stubFrom({ profiles: { data: profileRow, error: null } })
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })

    const usernameInput = screen.getByLabelText(/username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'ab')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
  })

  it('validates avatar URL format', async () => {
    const session = { user: { id: 'user-1', email: 'bookworm@test.com' } }
    stubAuth(session)
    stubFrom({ profiles: { data: profileRow, error: null } })
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/avatar url/i)).toBeInTheDocument()
    })

    const avatarInput = screen.getByLabelText(/avatar url/i)
    await user.type(avatarInput, 'not-a-url')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByText(/must start with http/i)).toBeInTheDocument()
  })
})

// ---- validatePassword stays green (shared with auth) ----

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('abc1!')).toBe('Password must be at least 8 characters')
  })
  it('accepts a valid password', () => {
    expect(validatePassword('myP@ss1word')).toBeNull()
  })
})

// ---- fetchShelfCounts aggregation ----

describe('fetchShelfCounts', () => {
  it('aggregates shelf rows into per-shelf counts', async () => {
    supabaseMock.from.mockImplementation((table) => {
      if (table === 'user_library') {
        return mockQuery({
          data: [
            { shelf: 'want_to_read' },
            { shelf: 'want_to_read' },
            { shelf: 'reading' },
            { shelf: 'finished' },
          ],
          error: null,
        })
      }
      return mockQuery({ data: null, error: { message: 'not found' } })
    })

    const { counts, error } = await fetchShelfCounts('user-1')
    expect(error).toBeNull()
    expect(counts).toEqual({ want_to_read: 2, reading: 1, finished: 1 })
  })

  it('returns zeros for empty library', async () => {
    supabaseMock.from.mockImplementation((table) => {
      if (table === 'user_library') {
        return mockQuery({ data: [], error: null })
      }
      return mockQuery({ data: null, error: { message: 'not found' } })
    })

    const { counts } = await fetchShelfCounts('user-1')
    expect(counts).toEqual({ want_to_read: 0, reading: 0, finished: 0 })
  })
})
