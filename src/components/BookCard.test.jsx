import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import BookCard from './BookCard'

const makeBook = (overrides = {}) => ({
  key: '/works/OL12345W',
  title: 'Dune',
  authorName: 'Frank Herbert',
  year: 1965,
  coverUrl: null,
  fallbackCover: 'cover--forest',
  rating: 4.5,
  ...overrides,
})

const renderCard = (book) =>
  render(
    <MemoryRouter>
      <BookCard book={book} />
    </MemoryRouter>,
  )

describe('BookCard', () => {
  it('renders the book title', () => {
    renderCard(makeBook())
    const titles = screen.getAllByText('Dune')
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the author name', () => {
    renderCard(makeBook())
    const authors = screen.getAllByText('Frank Herbert')
    expect(authors.length).toBeGreaterThanOrEqual(1)
  })

  it('shows rating when available', () => {
    renderCard(makeBook({ rating: 4.5 }))
    expect(screen.getByText('★ 4.5')).toBeInTheDocument()
  })

  it('shows year when rating is null', () => {
    renderCard(makeBook({ rating: null, year: 1965 }))
    const years = screen.getAllByText('1965')
    expect(years.length).toBeGreaterThanOrEqual(1)
  })

  it('does not show year or rating when both are null', () => {
    renderCard(makeBook({ rating: null, year: null }))
    const ratingEl = screen.queryByText('★')
    expect(ratingEl).toBeNull()
  })

  it('links to the book detail page when key is provided', () => {
    renderCard(makeBook())
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/book/OL12345W')
  })

  it('does not wrap in a link when key is missing', () => {
    renderCard(makeBook({ key: null }))
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders the book cover', () => {
    renderCard(makeBook())
    expect(document.querySelector('.trend-cover')).toBeTruthy()
  })
})
