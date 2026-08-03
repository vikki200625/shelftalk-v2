import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders an img when avatarUrl is provided', () => {
    render(<Avatar username="alice" avatarUrl="https://example.com/alice.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg')
    expect(img).toHaveAttribute('alt', "alice's avatar")
  })

  it('renders a fallback tile with initials when no avatarUrl', () => {
    render(<Avatar username="alice" />)
    const tile = screen.getByText('AL')
    expect(tile).toHaveClass('avatar--fallback')
  })

  it('uses displayName for alt text and initials when provided', () => {
    render(<Avatar username="alice" displayName="Alice Wonderland" />)
    const tile = screen.getByText('AW')
    expect(tile).toHaveAttribute('aria-label', "Alice Wonderland's avatar")
  })

  it('falls back to first 2 chars when displayName is one word', () => {
    render(<Avatar username="alice" displayName="Alice" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('renders img at the specified size', () => {
    render(<Avatar username="alice" avatarUrl="https://example.com/alice.jpg" size={48} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('width', '48')
    expect(img).toHaveAttribute('height', '48')
  })

  it('renders fallback tile at the specified size', () => {
    const { container } = render(<Avatar username="alice" size={48} />)
    const tile = container.querySelector('.avatar--fallback')
    expect(tile).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('same username always gets same color (deterministic)', () => {
    const { container: c1 } = render(<Avatar username="bob" />)
    const { container: c2 } = render(<Avatar username="bob" />)
    const bg1 = c1.querySelector('.avatar--fallback').style.background
    const bg2 = c2.querySelector('.avatar--fallback').style.background
    expect(bg1).toBe(bg2)
  })

  it('different usernames can get different colors', () => {
    const { container: c1 } = render(<Avatar username="alice" />)
    const { container: c2 } = render(<Avatar username="zzzzy" />)
    expect(c1.querySelector('.avatar--fallback')).toBeTruthy()
    expect(c2.querySelector('.avatar--fallback')).toBeTruthy()
  })
})
