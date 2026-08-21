import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import NotificationBell from './NotificationBell'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/notifications', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllRead: vi.fn(),
  subscribeNotifications: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ default: { removeChannel: vi.fn() } }))

import { useAuth } from '../context/AuthContext'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  subscribeNotifications,
} from '../lib/notifications'
import supabase from '../lib/supabase'

const USER = { id: 'user-1' }

const FOLLOW_NOTIF = {
  id: 'n1',
  type: 'follow',
  message: 'alice started following you',
  read: false,
  actor_id: 'actor-1',
  actor_username: 'alice',
  club_id: null,
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
}

const CLUB_NOTIF_READ = {
  id: 'n2',
  type: 'club_discussion',
  message: 'bob posted in Sci-Fi Club: Dune chapter 3',
  read: true,
  actor_id: 'actor-2',
  actor_username: 'bob',
  club_id: 'club-9',
  created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // ~1d ago
}

function renderBell(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <NotificationBell />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.mockReturnValue({ user: USER })
  getNotifications.mockResolvedValue([FOLLOW_NOTIF, CLUB_NOTIF_READ])
  getUnreadCount.mockResolvedValue(1)
  subscribeNotifications.mockReturnValue({ unsubscribe: vi.fn() })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('NotificationBell — rendering', () => {
  it('renders the bell button with an accessible label', async () => {
    renderBell()
    const bell = await screen.findByRole('button', { name: /notifications/i })
    expect(bell).toBeInTheDocument()
  })

  it('shows the unread badge with the count', async () => {
    renderBell()
    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('hides the badge when there are no unread notifications', async () => {
    getUnreadCount.mockResolvedValue(0)
    renderBell()
    await waitFor(() =>
      expect(screen.queryByText(/^99?\+?$/)).not.toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /^notifications$/i })).toBeInTheDocument()
  })

  it('caps the badge at 99+', async () => {
    getUnreadCount.mockResolvedValue(142)
    renderBell()
    expect(await screen.findByText('99+')).toBeInTheDocument()
  })
})

describe('NotificationBell — dropdown', () => {
  it('opens on click and lists notifications with time ago', async () => {
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))

    const region = screen.getByRole('region', { name: /notifications list/i })
    expect(within(region).getByText('alice started following you')).toBeInTheDocument()
    expect(within(region).getByText('bob posted in Sci-Fi Club: Dune chapter 3')).toBeInTheDocument()
    expect(within(region).getByText('5m ago')).toBeInTheDocument()
    expect(within(region).getByText('1d ago')).toBeInTheDocument()
  })

  it('shows empty state when there are no notifications', async () => {
    getNotifications.mockResolvedValue([])
    getUnreadCount.mockResolvedValue(0)
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))
    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument()
  })

  it('closes when clicking outside', async () => {
    renderBell()
    const bell = await screen.findByRole('button', { name: /notifications/i })
    await userEvent.click(bell)
    expect(screen.getByRole('region', { name: /notifications list/i })).toBeInTheDocument()

    await userEvent.click(document.body)
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /notifications list/i })).not.toBeInTheDocument()
    )
  })

  it('toggles closed when the bell is clicked again', async () => {
    renderBell()
    const bell = await screen.findByRole('button', { name: /notifications/i })
    await userEvent.click(bell)
    expect(screen.getByRole('region', { name: /notifications list/i })).toBeInTheDocument()
    await userEvent.click(bell)
    expect(screen.queryByRole('region', { name: /notifications list/i })).not.toBeInTheDocument()
  })

  it('shows error state with retry when loading fails', async () => {
    getNotifications.mockRejectedValue(new Error('boom'))
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))

    expect(await screen.findByText(/couldn't load notifications/i)).toBeInTheDocument()

    getNotifications.mockResolvedValue([FOLLOW_NOTIF])
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByText('alice started following you')).toBeInTheDocument()
  })
})

describe('NotificationBell — interactions', () => {
  it('marks a notification read and navigates to the actor profile', async () => {
    markAsRead.mockResolvedValue(undefined)
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))

    await userEvent.click(screen.getByRole('button', { name: /alice started following you/ }))

    expect(markAsRead).toHaveBeenCalledWith('n1')
    // dropdown closes after navigation
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /notifications list/i })).not.toBeInTheDocument()
    )
  })

  it('does not call markAsRead for already-read notifications but still navigates', async () => {
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))

    await userEvent.click(screen.getByRole('button', { name: /bob posted in Sci-Fi Club/ }))

    expect(markAsRead).not.toHaveBeenCalled()
  })

  it('mark all read clears the badge and updates every row', async () => {
    markAllRead.mockResolvedValue(undefined)
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))

    await userEvent.click(screen.getByRole('button', { name: /mark all read/i }))

    expect(markAllRead).toHaveBeenCalledWith('user-1')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^notifications$/i })).toBeInTheDocument()
    )
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument()
  })

  it('hides "Mark all read" when nothing is unread', async () => {
    getNotifications.mockResolvedValue([CLUB_NOTIF_READ])
    getUnreadCount.mockResolvedValue(0)
    renderBell()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))
    expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument()
  })
})

describe('NotificationBell — realtime', () => {
  it('subscribes on mount for this user and unsubscribes on unmount', async () => {
    const channel = { unsubscribe: vi.fn() }
    subscribeNotifications.mockReturnValue(channel)

    const { unmount } = renderBell()
    await screen.findByRole('button', { name: /notifications/i })

    expect(subscribeNotifications).toHaveBeenCalledWith(USER.id, expect.any(Function))
    unmount()
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel)
  })

  it('refreshes count and list when a realtime INSERT arrives', async () => {
    let realtimeCallback
    subscribeNotifications.mockImplementation((_userId, cb) => {
      realtimeCallback = cb
      return { unsubscribe: vi.fn() }
    })

    renderBell()
    await screen.findByRole('button', { name: /notifications/i })
    expect(getUnreadCount).toHaveBeenCalledTimes(1)

    // A new notification lands while mounted.
    getUnreadCount.mockResolvedValue(2)
    getNotifications.mockResolvedValue([
      { ...FOLLOW_NOTIF, id: 'n3', message: 'carol started following you' },
      FOLLOW_NOTIF,
      CLUB_NOTIF_READ,
    ])
    realtimeCallback({ id: 'n3', message: 'carol started following you' })

    await waitFor(() => expect(getUnreadCount).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('2')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(await screen.findByText('carol started following you')).toBeInTheDocument()
  })
})
