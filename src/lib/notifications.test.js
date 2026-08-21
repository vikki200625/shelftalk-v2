import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  subscribeNotifications,
} from './notifications'

// Thin wrapper over the supabase client — mock the client and assert
// the query shape + returned data for each function.
const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: supabaseMock }))

function chain(final) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    order: vi.fn(() => c),
    limit: vi.fn(async () => final),
    update: vi.fn(() => c),
    // head-count queries resolve when awaited directly
    then: (resolve) => Promise.resolve(final).then(resolve),
  }
  return c
}

const USER_ID = 'user-1'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createNotification', () => {
  it('inserts a notification row with all fields', async () => {
    const c = chain({ error: null })
    c.insert = vi.fn(async () => ({ error: null }))
    supabaseMock.from.mockReturnValue(c)

    await createNotification({
      userId: USER_ID,
      type: 'follow',
      actorId: 'actor-1',
      message: 'alice started following you',
    })

    expect(supabaseMock.from).toHaveBeenCalledWith('notifications')
    expect(c.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      type: 'follow',
      actor_id: 'actor-1',
      club_id: null,
      message: 'alice started following you',
    })
  })

  it('surfaces insert errors', async () => {
    const c = chain({})
    c.insert = vi.fn(async () => ({ error: new Error('fk violation') }))
    supabaseMock.from.mockReturnValue(c)

    await expect(
      createNotification({ userId: USER_ID, type: 'follow', message: 'x' })
    ).rejects.toThrow('fk violation')
  })
})

describe('getNotifications', () => {
  it('selects own rows newest first with actor username join', async () => {
    const rows = [
      { id: 'n2', message: 'alice started following you', profiles: { username: 'alice' }, created_at: '2026-08-02' },
      { id: 'n1', message: 'bob posted in Sci-Fi Club: Dune', profiles: { username: 'bob' }, created_at: '2026-08-01' },
    ]
    const c = chain({ data: rows, error: null })
    supabaseMock.from.mockReturnValue(c)

    const result = await getNotifications(USER_ID)

    expect(supabaseMock.from).toHaveBeenCalledWith('notifications')
    expect(c.select).toHaveBeenCalledWith('*, profiles!notifications_actor_id_fkey(username)')
    expect(c.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(c.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(c.limit).toHaveBeenCalledWith(20)
    expect(result[0].actor_username).toBe('alice')
    expect(result[1].actor_username).toBe('bob')
    expect(result[0].profiles).toBeUndefined()
  })

  it('honors a custom limit', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: [], error: null }))
    await getNotifications(USER_ID, 5)
    const c = supabaseMock.from.mock.results[0].value
    expect(c.limit).toHaveBeenCalledWith(5)
  })

  it('falls back to null actor_username for deleted actors', async () => {
    supabaseMock.from.mockReturnValue(chain({
      data: [{ id: 'n1', message: 'x', profiles: null, created_at: '2026-08-01' }],
      error: null,
    }))
    const result = await getNotifications(USER_ID)
    expect(result[0].actor_username).toBeNull()
  })

  it('returns [] on null data', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: null, error: null }))
    expect(await getNotifications(USER_ID)).toEqual([])
  })

  it('surfaces query errors', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: null, error: new Error('rls') }))
    await expect(getNotifications(USER_ID)).rejects.toThrow('rls')
  })
})

describe('getUnreadCount', () => {
  it('head-counts unread rows for the user', async () => {
    const c = chain({ count: 7, error: null })
    supabaseMock.from.mockReturnValue(c)

    const result = await getUnreadCount(USER_ID)

    expect(c.select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(c.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(c.eq).toHaveBeenCalledWith('read', false)
    expect(result).toBe(7)
  })

  it('returns 0 when count is null', async () => {
    supabaseMock.from.mockReturnValue(chain({ count: null, error: null }))
    expect(await getUnreadCount(USER_ID)).toBe(0)
  })
})

describe('markAsRead', () => {
  it('updates read=true scoped to the notification id', async () => {
    const c = chain({ error: null })
    supabaseMock.from.mockReturnValue(c)

    await markAsRead('notif-9')

    expect(c.update).toHaveBeenCalledWith({ read: true })
    expect(c.eq).toHaveBeenCalledWith('id', 'notif-9')
  })

  it('surfaces query errors', async () => {
    supabaseMock.from.mockReturnValue(chain({ error: new Error('nope') }))
    await expect(markAsRead('notif-9')).rejects.toThrow('nope')
  })
})

describe('markAllRead', () => {
  it('updates every unread row for the user', async () => {
    const c = chain({ error: null })
    supabaseMock.from.mockReturnValue(c)

    await markAllRead(USER_ID)

    expect(c.update).toHaveBeenCalledWith({ read: true })
    expect(c.eq).toHaveBeenCalledWith('user_id', USER_ID)
    expect(c.eq).toHaveBeenCalledWith('read', false)
  })
})

describe('subscribeNotifications', () => {
  function fakeChannel() {
    const handlers = {}
    const channel = {
      on: vi.fn((...args) => {
        handlers[args[0]] = args[1]
        return channel
      }),
      subscribe: vi.fn(() => channel),
      __handlers: handlers,
    }
    return channel
  }

  it('subscribes to INSERTs filtered to the user and forwards new rows', () => {
    const channel = fakeChannel()
    supabaseMock.channel.mockReturnValue(channel)

    const callback = vi.fn()
    const returned = subscribeNotifications(USER_ID, callback)

    // Channel name is unique per subscription (random suffix) but always
    // namespaced with the user id — supabase-js dedupes by name, and two
    // mounted bells (desktop + mobile) each need their own channel.
    const [name] = supabaseMock.channel.mock.calls[0]
    expect(name).toMatch(new RegExp(`^notifications:${USER_ID}:`))
    expect(returned).toBe(channel)

    // .on('postgres_changes', config, handler) — verify filter + fire handler
    const [, config, handler] = channel.on.mock.calls[0]
    expect(config.event).toBe('INSERT')
    expect(config.schema).toBe('public')
    expect(config.table).toBe('notifications')
    expect(config.filter).toBe(`user_id=eq.${USER_ID}`)

    handler({ new: { id: 'n10', message: 'fresh' } })
    expect(callback).toHaveBeenCalledWith({ id: 'n10', message: 'fresh' })
  })

  it('generates a distinct channel name per subscription', () => {
    supabaseMock.channel.mockImplementation(() => fakeChannel())

    subscribeNotifications(USER_ID, vi.fn())
    subscribeNotifications(USER_ID, vi.fn())

    const names = supabaseMock.channel.mock.calls.map(([n]) => n)
    expect(new Set(names).size).toBe(2)
  })
})
