import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Browse from './Browse'

// Mock auth context — no signed-in user, so the empty-state CTA points
// at /signup (the signed-in branch links to the profile instead).
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null }),
}))

const TRENDING_WORK = {
  key: '/works/OL1W',
  title: 'Dune',
  author_name: ['Frank Herbert'],
  cover_i: 5,
  first_publish_year: 1965,
}

const SEARCH_DOCS = [
  {
    key: '/works/OL10W',
    title: 'Dune',
    author_name: ['Frank Herbert'],
    cover_i: 5,
    first_publish_year: 1965,
    ratings_average: 4.3,
  },
  {
    key: '/works/OL11W',
    title: '1984',
    author_name: ['George Orwell'],
    cover_i: 7,
    first_publish_year: 1949,
    ratings_average: 4.1,
  },
]

const MORE_DOCS = [
  {
    key: '/works/OL12W',
    title: 'Fahrenheit 451',
    author_name: ['Ray Bradbury'],
    cover_i: 9,
    first_publish_year: 1953,
  },
]

// Stub global fetch to answer each URL the browse page touches:
// trending feed, subject-count lookups, and paged searches.
function mockFetchByUrl(routes) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url) => {
      const match = routes.find(([needle]) => String(url).includes(needle))
      return match
        ? Promise.resolve({ ok: true, json: async () => match[1] })
        : Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }),
  )
}

const renderBrowse = () =>
  render(
    <MemoryRouter>
      <Browse />
    </MemoryRouter>,
  )

describe('Browse page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the hero, chips, trending, bento, and empty state by default', async () => {
    mockFetchByUrl([
      ['trending/now.json', { works: [TRENDING_WORK] }],
      // All three bento genre counts hit this needle.
      ['fields=key&limit=1', { numFound: 1234 }],
    ])

    renderBrowse()

    expect(screen.getByText('Discover your favorites')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search for books/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fiction' })).toBeInTheDocument()

    // Default sections: trending shelf, bento genres, empty state.
    expect(await screen.findByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('Literary Fiction')).toBeInTheDocument()
    expect(await screen.findByText('Your Shelves Are Bare')).toBeInTheDocument()

    // Signed-out empty state points at signup.
    expect(screen.getByRole('link', { name: /start shelving/i })).toHaveAttribute('href', '/signup')
  })

  it('shows search results when typing, hiding the default sections', async () => {
    mockFetchByUrl([
      ['trending/now.json', { works: [TRENDING_WORK] }],
      ['fields=key&limit=1', { numFound: 1234 }],
      ['q=Dune&limit=24&offset=0', { docs: SEARCH_DOCS, numFound: 2 }],
    ])

    renderBrowse()

    const input = screen.getByPlaceholderText(/search for books/i)
    await userEvent.type(input, 'Dune')

    expect(await screen.findByText('Search results for')).toBeInTheDocument()
    expect(screen.getByText('“Dune”')).toBeInTheDocument()
    expect(await screen.findByText('1984')).toBeInTheDocument()

    // Default sections are replaced by results.
    expect(screen.queryByText('Trending with readers right now')).not.toBeInTheDocument()
    expect(screen.queryByText('Your Shelves Are Bare')).not.toBeInTheDocument()
  }, 5000)

  it('searches when a genre chip is clicked', async () => {
    mockFetchByUrl([
      ['trending/now.json', { works: [TRENDING_WORK] }],
      ['fields=key&limit=1', { numFound: 1234 }],
      ['q=Fiction&limit=24&offset=0', { docs: SEARCH_DOCS, numFound: 2 }],
    ])

    renderBrowse()

    await userEvent.click(screen.getByRole('button', { name: 'Fiction' }))

    expect(await screen.findByText('“Fiction”')).toBeInTheDocument()
    expect(await screen.findByText('Dune')).toBeInTheDocument()
  }, 5000)

  it('loads more results when the button is clicked', async () => {
    mockFetchByUrl([
      ['trending/now.json', { works: [TRENDING_WORK] }],
      ['fields=key&limit=1', { numFound: 1234 }],
      // First page: 2 of 26 results, so "load more" is available.
      ['q=Dune&limit=24&offset=0', { docs: SEARCH_DOCS, numFound: 26 }],
      // Load more: offset = current book count (2).
      ['limit=24&offset=2', { docs: MORE_DOCS, numFound: 26 }],
    ])

    renderBrowse()

    const input = screen.getByPlaceholderText(/search for books/i)
    await userEvent.type(input, 'Dune')

    const loadMore = await screen.findByRole('button', { name: /load more results/i })
    await userEvent.click(loadMore)

    expect(await screen.findByText('Fahrenheit 451')).toBeInTheDocument()
  }, 5000)
})
