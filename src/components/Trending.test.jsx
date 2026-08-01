import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Trending from './Trending'

const WORKS = [
  { key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'], cover_i: 5, first_publish_year: 1965 },
  { key: '/works/OL2W', title: '1984', author_name: ['George Orwell'], cover_i: 7, first_publish_year: 1949 },
]

describe('Trending', () => {
  it('renders real trending books as cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ works: WORKS }) }))

    render(<Trending />)
    expect(await screen.findByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    expect(screen.getByText('1984')).toBeInTheDocument()
    // Trending books carry no rating, so the meta line shows the year.
    expect(screen.getByText('1965')).toBeInTheDocument()
  })

  it('shows an empty state when the feed has no books', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ works: [] }) }))

    render(<Trending />)
    expect(await screen.findByText(/no trending books/i)).toBeInTheDocument()
  })

  it('shows an error state and retries', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ works: WORKS }) })
    vi.stubGlobal('fetch', fetchMock)

    render(<Trending />)
    await waitFor(() => expect(screen.getByText(/couldn.t load trending/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Dune')).toBeInTheDocument()
  })
})
