import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('landing page', () => {
  it('renders the navbar with brand and CTA', () => {
    render(<App />)
    expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Browse')).toBeInTheDocument()
  })

  it('renders the hero headline and subtitle', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /find your next favorite book/i })).toBeInTheDocument()
    expect(screen.getByText(/join thousands of readers/i)).toBeInTheDocument()
  })

  it('shows trending titles and stats', () => {
    render(<App />)
    expect(screen.getByText('Trending:')).toBeInTheDocument()
    expect(screen.getByText('12k+')).toBeInTheDocument()
    expect(screen.getByText('1.4k+')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
  })

  it('opens the search dropdown with suggestions on focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByPlaceholderText(/search by title/i)
    // "Paulo Coelho" only exists in the dropdown — the floating covers
    // already show "Frank Herbert", so that name can't prove it opened.
    expect(screen.queryByText('Paulo Coelho')).not.toBeInTheDocument()

    await user.click(input)
    expect(screen.getByText('Paulo Coelho')).toBeInTheDocument()
    expect(screen.getByText('James Clear')).toBeInTheDocument()
  })

  it('closes the search dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.click(input)
    expect(screen.getByText('Paulo Coelho')).toBeInTheDocument()

    await user.click(screen.getByText('Trending:'))
    expect(screen.queryByText('Paulo Coelho')).not.toBeInTheDocument()
  })
})
