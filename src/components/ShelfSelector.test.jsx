import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import ShelfSelector from './ShelfSelector'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/library', () => ({
  addToShelf: vi.fn(),
  removeFromShelf: vi.fn(),
  getBookShelf: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { addToShelf, removeFromShelf, getBookShelf } from '../lib/library'

const SIGNED_IN = { user: { id: 'user-1' } }
const SIGNED_OUT = { user: null }
const KEY = 'OL45804W'
const STORAGE_KEY = '/works/OL45804W'

function renderSelector(bookKey = KEY) {
  return render(
    <MemoryRouter>
      <ShelfSelector bookKey={bookKey} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getBookShelf.mockResolvedValue({ data: null, error: null })
  addToShelf.mockResolvedValue({ data: {}, error: null })
  removeFromShelf.mockResolvedValue({ error: null })
})

describe('ShelfSelector — visitor (signed out)', () => {
  beforeEach(() => {
    useAuth.mockReturnValue(SIGNED_OUT)
  })

  it('shows a sign-in prompt instead of shelf buttons', async () => {
    renderSelector()
    expect(
      await screen.findByText(/save this book to your library/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/signin'
    )
    expect(screen.queryByRole('button', { name: 'Want to Read' })).toBeNull()
    expect(getBookShelf).not.toHaveBeenCalled()
  })
})

describe('ShelfSelector — signed in, book not on a shelf', () => {
  beforeEach(() => {
    useAuth.mockReturnValue(SIGNED_IN)
  })

  it('renders all three shelf buttons with none active', async () => {
    renderSelector()
    await waitFor(() => expect(getBookShelf).toHaveBeenCalledWith('user-1', STORAGE_KEY))
    expect(await screen.findByRole('button', { name: 'Want to Read' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Currently Reading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finished' })).toBeInTheDocument()
    for (const btn of screen.getAllByRole('button')) {
      if (btn.textContent !== 'Remove') expect(btn).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })

  it('adds the book to a shelf on click and marks it active', async () => {
    const user = userEvent.setup()
    renderSelector()
    const readingBtn = await screen.findByRole('button', { name: 'Currently Reading' })

    await user.click(readingBtn)

    expect(addToShelf).toHaveBeenCalledWith('user-1', STORAGE_KEY, 'reading')
    await waitFor(() => expect(readingBtn).toHaveAttribute('aria-pressed', 'true'))
    expect(await screen.findByText('Saved!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('shows an alert and leaves state unchanged when the save fails', async () => {
    addToShelf.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const user = userEvent.setup()
    renderSelector()
    const readingBtn = await screen.findByRole('button', { name: 'Currently Reading' })

    await user.click(readingBtn)

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't save/i)
    expect(readingBtn).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ShelfSelector — signed in, book already on a shelf', () => {
  beforeEach(() => {
    useAuth.mockReturnValue(SIGNED_IN)
    getBookShelf.mockResolvedValue({ data: { shelf: 'finished' }, error: null })
  })

  it('pre-selects the current shelf from the library row', async () => {
    renderSelector()
    const finishedBtn = await screen.findByRole('button', { name: 'Finished' })
    await waitFor(() => expect(finishedBtn).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('moves the book when another shelf is clicked', async () => {
    const user = userEvent.setup()
    renderSelector()
    const wantBtn = await screen.findByRole('button', { name: 'Want to Read' })
    await user.click(wantBtn)

    expect(addToShelf).toHaveBeenCalledWith('user-1', STORAGE_KEY, 'want_to_read')
    await waitFor(() => expect(wantBtn).toHaveAttribute('aria-pressed', 'true'))
  })

  it('removes the book from the library on Remove', async () => {
    const user = userEvent.setup()
    renderSelector()
    const removeBtn = await screen.findByRole('button', { name: 'Remove' })

    await user.click(removeBtn)

    expect(removeFromShelf).toHaveBeenCalledWith('user-1', STORAGE_KEY)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull())
    const finishedBtn = screen.getByRole('button', { name: 'Finished' })
    expect(finishedBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an alert when removal fails', async () => {
    removeFromShelf.mockResolvedValue({ error: { message: 'boom' } })
    const user = userEvent.setup()
    renderSelector()
    const removeBtn = await screen.findByRole('button', { name: 'Remove' })

    await user.click(removeBtn)

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't remove/i)
    expect(removeBtn).toBeInTheDocument()
  })
})
