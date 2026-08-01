import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import App from './App'

// App uses react-router (BrowserRouter in main.jsx) — tests render it
// inside a MemoryRouter so navigation works without a real URL bar.
function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  )
}

describe('landing page', () => {
  it('renders the navbar with brand and CTA', () => {
    renderApp()
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByText('ShellTalk')).toBeInTheDocument()
    expect(within(nav).getByText('Get Started')).toBeInTheDocument()
    expect(within(nav).getByText('Browse')).toBeInTheDocument()
  })

  it('renders the hero headline and subtitle', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /find your next favorite book/i })).toBeInTheDocument()
    expect(screen.getByText(/join thousands of readers/i)).toBeInTheDocument()
  })

  it('shows trending titles and stats', () => {
    renderApp()
    expect(screen.getByText('Trending:')).toBeInTheDocument()
    expect(screen.getByText('12k+')).toBeInTheDocument()
    expect(screen.getByText('1.4k+')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
  })

  it('opens the search dropdown on focus', async () => {
    const user = userEvent.setup()
    const { container } = renderApp()
    const input = screen.getByPlaceholderText(/search by title/i)
    const dropdown = () => container.querySelector('.search-dropdown')
    expect(dropdown()).not.toBeInTheDocument()

    await user.click(input)
    expect(dropdown()).toBeInTheDocument()
    expect(within(dropdown()).getByText(/type to search/i)).toBeInTheDocument()
  })

  it('shows live search results after typing', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [{ key: '/works/OL1W', title: 'The Alchemist', author_name: ['Paulo Coelho'] }],
        }),
      }),
    )

    const { container } = renderApp()
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.type(input, 'alchem')

    await waitFor(() => {
      const dropdown = container.querySelector('.search-dropdown')
      expect(dropdown).toBeInTheDocument()
      expect(within(dropdown).getByText('The Alchemist')).toBeInTheDocument()
    })
  })

  it('hero quick links trigger a real search', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [{ key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'] }],
        }),
      }),
    )

    const { container } = renderApp()
    const duneLink = screen.getByRole('button', { name: 'Dune' })
    await user.click(duneLink)

    // The search input should now hold the quick-link title.
    expect(screen.getByPlaceholderText(/search by title/i)).toHaveValue('Dune')
    await waitFor(() => {
      const dropdown = container.querySelector('.search-dropdown')
      expect(dropdown).toBeInTheDocument()
      expect(within(dropdown).getByText('Frank Herbert')).toBeInTheDocument()
    })
  })

  it('closes the search dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    const { container } = renderApp()
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.click(input)
    expect(container.querySelector('.search-dropdown')).toBeInTheDocument()

    await user.click(screen.getByText('Trending:'))
    expect(container.querySelector('.search-dropdown')).not.toBeInTheDocument()
  })

  it('renders all landing page sections', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /trending with readers/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /browse by genre/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /everything your shelf needs/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /readers are talking/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /your next favorite book is waiting/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('© 2026 ShellTalk')).toBeInTheDocument()
  })

  it('has no blue-ish slate colors anywhere in the styles', () => {
    const { readFileSync } = require('node:fs')
    const { join } = require('node:path')
    const css = [
      readFileSync(join(__dirname, 'styles/tokens.css'), 'utf8'),
      readFileSync(join(__dirname, 'styles/globals.css'), 'utf8'),
    ].join('\n')
    // The palette is cream/green/gold — no Tailwind slate grays, no navy.
    expect(css.includes('#334155')).toBe(false)
    expect(css.includes('#0f172a')).toBe(false)
    expect(css.includes('#475569')).toBe(false)
    // Word-boundary match: "slate-" classes or hex names. Plain includes()
    // would false-positive on "translateY", which contains "slate".
    expect(/\bslate\b|slate-/.test(css)).toBe(false)
  })
})
