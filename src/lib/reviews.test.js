import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  rateBook,
  getBookRating,
  getUserRating,
  getBookRatings,
  deleteRating,
} from './reviews'

// reviews.js is a thin wrapper over the supabase client — mock the client
// and assert the query shape + returned data for each function.
const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: supabaseMock }))

function chain(final) {
  // Builder that returns itself for every query method and resolves
  // to `final` when awaited (or when a terminal like .single() is hit).
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    order: vi.fn(() => c),
    upsert: vi.fn(() => c),
    delete: vi.fn(() => c),
    maybeSingle: vi.fn(async () => final),
    single: vi.fn(async () => final),
    then: (resolve) => Promise.resolve(final).then(resolve),
  }
  return c
}

const USER = { id: 'user-1' }

beforeEach(() => {
  vi.clearAllMocks()
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: USER } })
})

describe('rateBook', () => {
  it('upserts the rating keyed on (user_id, book_key)', async () => {
    const saved = { id: 'r1', rating: 4 }
    const c = chain({ data: saved, error: null })
    supabaseMock.from.mockReturnValue(c)

    const result = await rateBook('OL45804W', 4)

    expect(supabaseMock.from).toHaveBeenCalledWith('book_ratings')
    expect(c.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', book_key: 'OL45804W', rating: 4, review_text: null },
      { onConflict: 'user_id,book_key' }
    )
    expect(result).toEqual(saved)
  })

  it('saves review text when provided', async () => {
    const c = chain({ data: {}, error: null })
    supabaseMock.from.mockReturnValue(c)

    await rateBook('OL45804W', 5, 'Loved it')

    expect(c.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', book_key: 'OL45804W', rating: 5, review_text: 'Loved it' },
      { onConflict: 'user_id,book_key' }
    )
  })

  it('rejects ratings outside 1-5', async () => {
    await expect(rateBook('OL45804W', 0)).rejects.toThrow('between 1 and 5')
    await expect(rateBook('OL45804W', 6)).rejects.toThrow('between 1 and 5')
    await expect(rateBook('OL45804W', 3.5)).rejects.toThrow('between 1 and 5')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('rejects reviews over 500 chars', async () => {
    await expect(rateBook('OL45804W', 3, 'x'.repeat(501))).rejects.toThrow('500')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('throws when not signed in', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
    await expect(rateBook('OL45804W', 4)).rejects.toThrow('signed in')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('surfaces query errors', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: null, error: new Error('rls blocked') }))
    await expect(rateBook('OL45804W', 4)).rejects.toThrow('rls blocked')
  })
})

describe('getBookRating', () => {
  it('returns average and count', async () => {
    const c = chain({ data: [{ rating: 5 }, { rating: 4 }, { rating: 3 }], error: null })
    supabaseMock.from.mockReturnValue(c)

    const result = await getBookRating('OL45804W')

    expect(c.select).toHaveBeenCalledWith('rating')
    expect(c.eq).toHaveBeenCalledWith('book_key', 'OL45804W')
    expect(result).toEqual({ average: 4, count: 3 })
  })

  it('returns zero average and count for an unrated book', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: [], error: null }))
    expect(await getBookRating('OL00000W')).toEqual({ average: 0, count: 0 })
  })

  it('handles null data (no rows)', async () => {
    supabaseMock.from.mockReturnValue(chain({ data: null, error: null }))
    expect(await getBookRating('OL00000W')).toEqual({ average: 0, count: 0 })
  })
})

describe('getUserRating', () => {
  it('returns the user row via maybeSingle', async () => {
    const row = { id: 'r1', rating: 5, review_text: 'great' }
    const c = chain({ data: row, error: null })
    supabaseMock.from.mockReturnValue(c)

    const result = await getUserRating('OL45804W')

    expect(c.eq).toHaveBeenCalledWith('book_key', 'OL45804W')
    expect(c.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(c.maybeSingle).toHaveBeenCalled()
    expect(result).toEqual(row)
  })

  it('returns null without hitting the DB when signed out', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
    expect(await getUserRating('OL45804W')).toBeNull()
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })
})

describe('getBookRatings', () => {
  it('joins profiles for username and orders newest first', async () => {
    const c = chain({
      data: [
        { id: 'r2', rating: 4, review_text: 'good', profiles: { username: 'alice' }, created_at: '2026-08-02' },
        { id: 'r1', rating: 5, review_text: null, profiles: { username: 'bob' }, created_at: '2026-08-01' },
      ],
      error: null,
    })
    supabaseMock.from.mockReturnValue(c)

    const result = await getBookRatings('OL45804W')

    expect(c.select).toHaveBeenCalledWith('*, profiles!book_ratings_user_id_fkey(username)')
    expect(c.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result[0].username).toBe('alice')
    expect(result[1].username).toBe('bob')
    // the raw join payload is stripped from the returned rows
    expect(result[0].profiles).toBeUndefined()
  })

  it('falls back to unknown when the profile is missing', async () => {
    supabaseMock.from.mockReturnValue(chain({
      data: [{ id: 'r1', rating: 3, profiles: null, created_at: '2026-08-01' }],
      error: null,
    }))
    const result = await getBookRatings('OL45804W')
    expect(result[0].username).toBe('unknown')
  })
})

describe('deleteRating', () => {
  it('deletes only the current user row for the book', async () => {
    const c = chain({ error: null })
    supabaseMock.from.mockReturnValue(c)

    await deleteRating('OL45804W')

    expect(c.delete).toHaveBeenCalled()
    expect(c.eq).toHaveBeenCalledWith('book_key', 'OL45804W')
    expect(c.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('throws when not signed in', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
    await expect(deleteRating('OL45804W')).rejects.toThrow('signed in')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('surfaces query errors', async () => {
    supabaseMock.from.mockReturnValue(chain({ error: new Error('nope') }))
    await expect(deleteRating('OL45804W')).rejects.toThrow('nope')
  })
})
