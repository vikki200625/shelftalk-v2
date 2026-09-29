import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import Footer from './Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it('renders the brand name and tagline', () => {
    renderFooter()
    expect(screen.getByText('ShellTalk')).toBeInTheDocument()
    expect(screen.getByText('A cozy digital corner for people who love books.')).toBeInTheDocument()
  })

  it('renders one Product column heading', () => {
    renderFooter()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.queryByText('Company')).toBeNull()
    expect(screen.queryByText('Resources')).toBeNull()
  })

  it('renders the product links as real router links (no dead anchors)', () => {
    renderFooter()
    const hrefs = ['Browse', 'My Library', 'Book Clubs', 'Find Friends'].map(
      (label) => screen.getByText(label).getAttribute('href'),
    )
    expect(hrefs).toEqual(['/browse', '/library', '/clubs', '/find-friends'])
    for (const href of hrefs) {
      expect(href).not.toBe('#')
    }
  })

  it('renders copyright without a newsletter or social icons', () => {
    renderFooter()
    expect(screen.getByText('© 2026 ShellTalk')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('you@example.com')).toBeNull()
    expect(screen.queryByLabelText('X (Twitter)')).toBeNull()
    expect(screen.queryByLabelText('Instagram')).toBeNull()
    expect(screen.queryByLabelText('Discord')).toBeNull()
  })
})
