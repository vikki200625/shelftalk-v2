import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import FindFriends from '../pages/FindFriends'

// Mock auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}))

// Mock profiles API
const mockSearchProfiles = vi.fn().mockResolvedValue({ data: [], error: null })
const mockFetchSuggestedProfiles = vi.fn().mockResolvedValue({
  data: [
    { id: 'user-2', username: 'alice', display_name: 'Alice', avatar_url: null, bio: 'Book lover' },
    { id: 'user-3', username: 'bob', display_name: null, avatar_url: null, bio: null },
  ],
  error: null,
})
const mockFetchFollowers = vi.fn().mockResolvedValue({ data: [], error: null })
const mockFetchFollowing = vi.fn().mockResolvedValue({ data: [], error: null })

vi.mock('../lib/profiles', () => ({
  searchProfiles: (...args) => mockSearchProfiles(...args),
  fetchSuggestedProfiles: (...args) => mockFetchSuggestedProfiles(...args),
  fetchFollowers: (...args) => mockFetchFollowers(...args),
  fetchFollowing: (...args) => mockFetchFollowing(...args),
  fetchFollowStatus: vi.fn().mockResolvedValue({ following: false, error: null }),
  followUser: vi.fn().mockResolvedValue({ data: { id: 'follow-1' }, error: null }),
  unfollowUser: vi.fn().mockResolvedValue({ error: null }),
}))

describe('FindFriends page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title and subtitle', async () => {
    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )
    expect(screen.getByText('Find Friends')).toBeInTheDocument()
    expect(screen.getByText(/discover readers who share your taste/i)).toBeInTheDocument()
  })

  it('renders search input', async () => {
    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText(/search by username/i)).toBeInTheDocument()
  })

  it('loads suggested profiles on mount', async () => {
    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.getByText('Book lover')).toBeInTheDocument()
  })

  it('shows follower and following sections', async () => {
    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/your followers/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/you're following/i)).toBeInTheDocument()
  })

  it('searches users when typing', async () => {
    const user = userEvent.setup()
    mockSearchProfiles.mockResolvedValue({
      data: [{ id: 'user-4', username: 'charlie', display_name: 'Charlie', avatar_url: null, bio: null }],
      error: null,
    })

    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/search by username/i)
    await user.type(input, 'char')

    await waitFor(() => {
      expect(mockSearchProfiles).toHaveBeenCalledWith('char', 20)
    })
  })

  it('hides sections when searching', async () => {
    const user = userEvent.setup()
    mockSearchProfiles.mockResolvedValue({ data: [], error: null })

    render(
      <MemoryRouter>
        <FindFriends />
      </MemoryRouter>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/search by username/i)
    await user.type(input, 'test')

    await waitFor(() => {
      expect(screen.queryByText('Suggested for You')).not.toBeInTheDocument()
    })
  })
})
