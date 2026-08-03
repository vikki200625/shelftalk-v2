import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BookCover from './BookCover'

const makeBook = (overrides = {}) => ({
  title: 'Dune',
  authorName: 'Frank Herbert',
  year: 1965,
  coverUrl: null,
  fallbackCover: 'cover--forest',
  ...overrides,
})

describe('BookCover', () => {
  describe('card variant (default)', () => {
    it('renders the cover image when coverUrl is provided', () => {
      const book = makeBook({ coverUrl: 'https://example.com/dune.jpg' })
      render(<BookCover book={book} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/dune.jpg')
      expect(img).toHaveAttribute('alt', 'Dune')
    })

    it('renders fallback with title and author when no cover', () => {
      const book = makeBook()
      render(<BookCover book={book} />)
      expect(screen.getByText('Dune')).toBeInTheDocument()
      expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    })

    it('shows year in fallback when available', () => {
      render(<BookCover book={makeBook({ year: 1965 })} />)
      expect(screen.getByText('1965')).toBeInTheDocument()
    })

    it('shows "Book" in fallback when year is null', () => {
      render(<BookCover book={makeBook({ year: null })} />)
      expect(screen.getByText('Book')).toBeInTheDocument()
    })

    it('falls back to gradient when image fails to load', () => {
      const book = makeBook({ coverUrl: 'https://example.com/broken.jpg' })
      const { container } = render(<BookCover book={book} />)
      const img = screen.getByRole('img')
      // Simulate image error wrapped in act()
      act(() => {
        img.dispatchEvent(new Event('error'))
      })
      // After error, should show fallback div
      expect(screen.getByText('Dune')).toBeInTheDocument()
    })
  })

  describe('spine variant', () => {
    it('renders the cover image when coverUrl is provided', () => {
      const book = makeBook({ coverUrl: 'https://example.com/dune.jpg' })
      render(<BookCover book={book} variant="spine" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/dune.jpg')
    })

    it('renders a spine div with correct class when no cover', () => {
      const { container } = render(<BookCover book={makeBook()} variant="spine" />)
      const spine = container.querySelector('.book-spine')
      expect(spine).toBeTruthy()
      expect(spine).toHaveClass('book-spine--primary') // cover--forest maps to this
    })

    it('maps cover colors to spine classes', () => {
      const { container } = render(
        <BookCover book={makeBook({ fallbackCover: 'cover--terracotta' })} variant="spine" />,
      )
      expect(container.querySelector('.book-spine--terracotta')).toBeTruthy()
    })
  })

  describe('large variant', () => {
    it('renders the cover image when coverUrl is provided', () => {
      const book = makeBook({ coverUrl: 'https://example.com/dune-lg.jpg' })
      render(<BookCover book={book} variant="large" />)
      const img = screen.getByRole('img')
      expect(img).toHaveClass('detail-cover-image')
    })

    it('renders fallback with title and fallback class when no cover', () => {
      const { container } = render(<BookCover book={makeBook()} variant="large" />)
      expect(screen.getByText('Dune')).toBeInTheDocument()
      expect(container.querySelector('.detail-cover-fallback')).toBeTruthy()
    })
  })
})
