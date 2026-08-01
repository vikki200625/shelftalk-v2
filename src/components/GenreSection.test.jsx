import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import GenreSection from './GenreSection'
import { GENRES } from '../lib/genres'

// BookCard wraps cards in react-router Links — needs Router context.
const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

function worksFor(slug, title) {
  return [{ key: `/works/${slug}`, title, author_name: ['Some Author'] }]
}

describe('GenreSection', () => {
  it('renders a heading for every genre', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ works: [] }) }))

    renderWithRouter(<GenreSection />)
    for (const genre of GENRES) {
      expect(screen.getByRole('heading', { name: genre.label })).toBeInTheDocument()
    }
  })

  it('renders books for each genre from its own subject slug', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      const slug = url.match(/subjects\/([a-z_]+)\.json/)?.[1] ?? 'unknown'
      return Promise.resolve({
        ok: true,
        json: async () => ({ works: worksFor(slug, `Book in ${slug}`) }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<GenreSection />)
    // A book title renders twice per card (cover art + caption), so use
    // findAllByText and just require at least one match per genre.
    expect((await screen.findAllByText('Book in science_fiction')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Book in fantasy').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Book in young_adult').length).toBeGreaterThan(0)
  })

  it('keeps other rows working when one genre fails', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('subjects/romance.json')) {
        return Promise.reject(new Error('romance down'))
      }
      return Promise.resolve({ ok: true, json: async () => ({ works: worksFor('ok', 'Working book') }) })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<GenreSection />)
    expect((await screen.findAllByText('Working book')).length).toBeGreaterThan(0)
    await waitFor(() =>
      expect(screen.getByText(/couldn.t load romance books/i)).toBeInTheDocument(),
    )
  })

  it('retries a failed row when the retry button is clicked', async () => {
    const user = userEvent.setup()
    let failures = 1
    const fetchMock = vi.fn((url) => {
      if (url.includes('subjects/fantasy.json') && failures > 0) {
        failures -= 1
        return Promise.reject(new Error('down'))
      }
      return Promise.resolve({ ok: true, json: async () => ({ works: worksFor('ok', 'Retried book') }) })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<GenreSection />)
    const retryButtons = await screen.findAllByRole('button', { name: /try again/i })
    expect(retryButtons.length).toBe(1)

    await user.click(retryButtons[0])
    expect((await screen.findAllByText('Retried book')).length).toBeGreaterThan(0)
  })
})
