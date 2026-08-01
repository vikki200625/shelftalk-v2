import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  coverUrl,
  fallbackCover,
  mapSearchDoc,
  mapSubjectWork,
  mapTrendingWork,
  searchBooks,
  fetchTrending,
  fetchGenreBooks,
  mapWorkDetail,
  fetchWork,
} from './openlibrary'

describe('coverUrl', () => {
  it('builds a cover URL for a given size', () => {
    expect(coverUrl(123, 'M')).toBe('https://covers.openlibrary.org/b/id/123-M.jpg')
    expect(coverUrl(123, 'L')).toBe('https://covers.openlibrary.org/b/id/123-L.jpg')
  })

  it('returns null when there is no cover id', () => {
    expect(coverUrl(null)).toBeNull()
    expect(coverUrl(undefined)).toBeNull()
  })
})

describe('fallbackCover', () => {
  it('cycles through the six color variants', () => {
    expect(fallbackCover(0)).toBe('cover--forest')
    expect(fallbackCover(5)).toBe('cover--umber')
    expect(fallbackCover(6)).toBe('cover--forest')
  })

  it('prefers an explicit base color (used by genre rows)', () => {
    expect(fallbackCover(2, 'cover--gold')).toBe('cover--gold')
  })
})

describe('mapSearchDoc', () => {
  it('maps a full search doc to the shared book shape', () => {
    const book = mapSearchDoc(
      {
        key: '/works/OL1W',
        title: 'Dune',
        author_name: ['Frank Herbert'],
        cover_i: 5,
        first_publish_year: 1965,
        ratings_average: 4.75,
      },
      0,
    )
    expect(book).toEqual({
      key: '/works/OL1W',
      title: 'Dune',
      authorName: 'Frank Herbert',
      year: 1965,
      coverUrl: 'https://covers.openlibrary.org/b/id/5-M.jpg',
      fallbackCover: 'cover--forest',
      rating: 4.8,
    })
  })

  it('handles missing cover, author, year, and rating', () => {
    const book = mapSearchDoc({}, 1)
    expect(book.authorName).toBe('Unknown author')
    expect(book.year).toBeNull()
    expect(book.coverUrl).toBeNull()
    expect(book.rating).toBeNull()
    expect(book.title).toBe('Untitled')
  })
})

describe('mapSubjectWork', () => {
  it('maps authors array-of-objects and cover_id, keeping the base color', () => {
    const book = mapSubjectWork(
      {
        key: '/works/OL2W',
        title: 'Frankenstein',
        authors: [{ key: '/authors/OL1A', name: 'Mary Shelley' }],
        cover_id: 9,
        first_publish_year: 1818,
      },
      3,
      'cover--gold',
    )
    expect(book).toEqual({
      key: '/works/OL2W',
      title: 'Frankenstein',
      authorName: 'Mary Shelley',
      year: 1818,
      coverUrl: 'https://covers.openlibrary.org/b/id/9-L.jpg',
      fallbackCover: 'cover--gold',
      rating: null,
    })
  })
})

describe('mapTrendingWork', () => {
  it('maps author_name array and cover_i, with no rating', () => {
    const book = mapTrendingWork(
      { key: '/works/OL3W', title: '1984', author_name: ['George Orwell'], cover_i: 7 },
      0,
    )
    expect(book.rating).toBeNull()
    expect(book.authorName).toBe('George Orwell')
    expect(book.coverUrl).toBe('https://covers.openlibrary.org/b/id/7-L.jpg')
  })
})

describe('mapWorkDetail', () => {
  it('maps a full work record', () => {
    const detail = mapWorkDetail({
      title: 'Dune',
      description: 'A sci-fi epic.',
      subjects: ['Fiction', 'Science', 'Junk'],
      covers: [-1, 5, 6],
      first_publish_date: '1965-08-01',
    })
    expect(detail).toEqual({
      title: 'Dune',
      description: 'A sci-fi epic.',
      subjects: ['Fiction', 'Science', 'Junk'],
      largeCoverUrl: 'https://covers.openlibrary.org/b/id/5-L.jpg',
      firstPublishYear: 1965,
    })
  })

  it('normalizes the description object form and skips -1 covers', () => {
    const detail = mapWorkDetail({
      title: 'T',
      description: { type: '/type/text', value: 'Object form.' },
      covers: [-1],
    })
    expect(detail.description).toBe('Object form.')
    expect(detail.largeCoverUrl).toBeNull()
  })

  it('caps subjects at six and tolerates a missing year', () => {
    const many = Array.from({ length: 10 }, (_, i) => `Subject ${i}`)
    const detail = mapWorkDetail({ title: 'T', subjects: many })
    expect(detail.subjects).toHaveLength(6)
    expect(detail.firstPublishYear).toBeNull()
  })
})

describe('fetchWork', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('normalizes a /works/ prefix and fetches the work JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ title: 'Dune', subjects: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    const detail = await fetchWork('/works/OL45804W')
    expect(detail.title).toBe('Dune')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openlibrary.org/works/OL45804W.json',
      expect.objectContaining({ signal: undefined }),
    )
  })

  it('follows a redirect record to the target work', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: { key: '/type/redirect' }, location: '/works/OL45804W' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ title: 'Dune', subjects: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    const detail = await fetchWork('OLOLDW')
    expect(detail.title).toBe('Dune')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws when the redirect target is also a redirect', async () => {
    const redirect = () => ({
      ok: true,
      json: async () => ({ type: { key: '/type/redirect' }, location: '/works/OLOTHERW' }),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(redirect()).mockResolvedValueOnce(redirect()))

    await expect(fetchWork('OLOLDW')).rejects.toThrow(/redirect/i)
  })
})

describe('API fetchers', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('searchBooks hits search.json and maps docs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ key: '/works/OL1W', title: 'The Alchemist', author_name: ['Paulo Coelho'] }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const books = await searchBooks('the alchemist', { limit: 5 })
    expect(books[0].title).toBe('The Alchemist')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openlibrary.org/search.json?q=the%20alchemist&limit=5',
      expect.objectContaining({ signal: undefined }),
    )
  })

  it('searchBooks throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))
    await expect(searchBooks('dune')).rejects.toThrow(/500/)
  })

  it('normalizes a missing docs array to empty results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
    await expect(searchBooks('dune')).resolves.toEqual([])
  })

  it('fetchTrending maps works', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ works: [{ key: '/works/OL3W', title: '1984', author_name: ['George Orwell'] }] }),
      }),
    )
    const books = await fetchTrending()
    expect(books[0].title).toBe('1984')
  })

  it('fetchGenreBooks passes the base color into the mapper', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ works: [{ key: '/works/OL9W', title: 'Mystery Book', cover_id: 11 }] }),
      }),
    )
    const books = await fetchGenreBooks('mystery', { base: 'cover--sage' })
    expect(books[0].fallbackCover).toBe('cover--sage')
    expect(books[0].coverUrl).toBe('https://covers.openlibrary.org/b/id/11-L.jpg')
  })
})
