import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import GlobalChat from '../pages/GlobalChat'
import PrivateChat from '../pages/PrivateChat'
import {
  getGlobalMessages,
  getUserChannels,
  sendPrivateMessage,
} from '../lib/chat'

// Mock auth context — stable user ref so effects keyed on `user`
// don't re-fire on every render (matches the real AuthContext).
const { testUser } = vi.hoisted(() => ({
  testUser: { id: 'user-1', email: 'test@example.com' },
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: testUser }),
}))

// Mock chat API
vi.mock('../lib/chat', () => ({
  sendGlobalMessage: vi.fn().mockResolvedValue({ data: { id: 'msg-1', message: 'Hello', user_id: 'user-1', created_at: new Date().toISOString() }, error: null }),
  getGlobalMessages: vi.fn().mockResolvedValue({ data: [], error: null }),
  subscribeGlobalMessages: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  getUserChannels: vi.fn().mockResolvedValue({ channels: [], error: null }),
  getChannelMessages: vi.fn().mockResolvedValue({ data: [], error: null }),
  sendPrivateMessage: vi.fn().mockResolvedValue({ data: {}, error: null }),
  markAsRead: vi.fn().mockResolvedValue({ error: null }),
  subscribePrivateMessages: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  subscribeReadReceipts: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  getOrCreateChannel: vi.fn().mockResolvedValue({ channelId: 'ch-1', error: null }),
}))

describe('GlobalChat page', () => {
  it('renders page title', () => {
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )
    expect(screen.getByText('Global Chat')).toBeInTheDocument()
  })

  it('shows empty state when no messages', async () => {
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
    })
  })

  it('renders message input for signed-in users', () => {
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('can send a message', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/type a message/i)
    await user.type(input, 'Hello world')
    await user.click(screen.getByText('Send'))

    expect(input).toHaveValue('')
  })
})

describe('GlobalChat error states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getGlobalMessages.mockResolvedValue({ data: [], error: null })
  })

  it('shows a load error with retry instead of a lying empty state', async () => {
    const user = userEvent.setup()
    getGlobalMessages.mockResolvedValueOnce({ data: [], error: { message: 'boom' } })
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn't load messages/i)
    expect(screen.queryByText(/no messages yet/i)).toBeNull()

    getGlobalMessages.mockResolvedValueOnce({ data: [], error: null })
    await user.click(screen.getByText('Try again'))
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
    })
  })

  it("renders the sender's real username instead of a generic label", async () => {
    getGlobalMessages.mockResolvedValueOnce({
      data: [
        {
          id: 'm1',
          user_id: 'someone-else',
          message: 'hello there',
          created_at: new Date().toISOString(),
          profiles: { username: 'king' },
        },
      ],
      error: null,
    })
    render(
      <MemoryRouter>
        <GlobalChat />
      </MemoryRouter>
    )

    expect(await screen.findByText('king')).toBeInTheDocument()
    expect(screen.getByText('hello there')).toBeInTheDocument()
    expect(screen.queryByText('User')).toBeNull()
  })
})

describe('PrivateChat error states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserChannels.mockResolvedValue({ channels: [], error: null })
    sendPrivateMessage.mockResolvedValue({ data: { id: 'x' }, error: null })
  })

  function renderList() {
    return render(
      <MemoryRouter initialEntries={['/messages']}>
        <Routes>
          <Route path="/messages" element={<PrivateChat />} />
        </Routes>
      </MemoryRouter>
    )
  }

  function renderThread() {
    return render(
      <MemoryRouter initialEntries={['/messages/ch-1']}>
        <Routes>
          <Route path="/messages/:channelId" element={<PrivateChat />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('surfaces conversation-list load failures with a retry', async () => {
    const user = userEvent.setup()
    getUserChannels.mockResolvedValueOnce({ channels: null, error: { message: 'boom' } })
    renderList()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn't load conversations/i)

    getUserChannels.mockResolvedValueOnce({ channels: [], error: null })
    await user.click(screen.getByText('Try again'))
    await waitFor(() => {
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument()
    })
  })

  it('shows an alert and keeps the typed text when a DM send fails', async () => {
    const user = userEvent.setup()
    sendPrivateMessage.mockResolvedValueOnce({ data: null, error: { message: 'rls denied' } })
    renderThread()

    const input = await screen.findByPlaceholderText(/type a message/i)
    await user.type(input, 'do not lose this')
    await user.click(screen.getByText('Send'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn't send your message/i)
    expect(input).toHaveValue('do not lose this')
  })
})
