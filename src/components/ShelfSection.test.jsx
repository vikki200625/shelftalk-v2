import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import ShelfSection from './ShelfSection'

const makeBooks = (n) =>
  Array.from({ length: n }, (_, i) => ({
    book_key: `key-${i}`,
    title: `Book ${i}`,
    authorName: `Author ${i}`,
    year: 2020,
    coverUrl: null,
    fallbackCover: 'cover--forest',
    rating: null,
  }))

const renderShelf = (overrides = {}) =>
  render(
    <MemoryRouter>
      <ShelfSection
        books={makeBooks(overrides.count ?? 3)}
        shelf="reading"
        title="Currently Reading"
        icon="📖"
        onRemove={overrides.onRemove}
        {...overrides}
      />
    </MemoryRouter>,
  )

describe('ShelfSection', () => {
  it('renders the title and icon', () => {
    renderShelf()
    expect(screen.getByText('Currently Reading')).toBeInTheDocument()
    expect(screen.getByText('📖')).toBeInTheDocument()
  })

  it('renders the book count', () => {
    renderShelf({ count: 5 })
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('returns null when books is empty', () => {
    const { container } = renderShelf({ count: 0 })
    expect(container.innerHTML).toBe('')
  })

  it('shows only 5 books by default when there are more than 5', () => {
    renderShelf({ count: 8 })
    // Book titles appear twice (cover + card title), so use getAllByText
    const book0s = screen.getAllByText('Book 0')
    expect(book0s.length).toBeGreaterThan(0)
    const book4s = screen.getAllByText('Book 4')
    expect(book4s.length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Book 5').length).toBe(0)
  })

  it('shows expand button when more than 5 books', () => {
    renderShelf({ count: 8 })
    expect(screen.getByText('See all 8 books')).toBeInTheDocument()
  })

  it('expands to show all books when expand button is clicked', () => {
    renderShelf({ count: 8 })
    fireEvent.click(screen.getByText('See all 8 books'))
    // Book 7 appears twice (cover + card), so use getAllByText
    const book7s = screen.getAllByText('Book 7')
    expect(book7s.length).toBeGreaterThan(0)
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('collapses back when "Show less" is clicked', () => {
    renderShelf({ count: 8 })
    fireEvent.click(screen.getByText('See all 8 books'))
    fireEvent.click(screen.getByText('Show less'))
    expect(screen.queryAllByText('Book 7').length).toBe(0)
  })

  it('shows remove button when onRemove is provided', () => {
    const onRemove = vi.fn()
    renderShelf({ onRemove })
    const removeButtons = screen.getAllByText('×')
    expect(removeButtons.length).toBe(3) // one per book
  })

  it('calls onRemove with the book key when remove is clicked', () => {
    const onRemove = vi.fn()
    renderShelf({ onRemove })
    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith('key-0')
  })

  it('does not show remove button when onRemove is not provided', () => {
    renderShelf()
    expect(screen.queryByText('×')).toBeNull()
  })
})
