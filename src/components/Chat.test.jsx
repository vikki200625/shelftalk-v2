import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import GlobalChat from '../pages/GlobalChat'

// Mock auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
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
