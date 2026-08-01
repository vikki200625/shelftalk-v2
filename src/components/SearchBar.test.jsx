import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

// SearchBar uses useNavigate — it must render inside a Router.
function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function deferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const ALCHEMIST_DOC = {
  key: '/works/OL1W',
  title: 'The Alchemist',
  author_name: ['Paulo Coelho'],
  cover_i: 3,
  first_publish_year: 1988,
}

describe('SearchBar', () => {
  it('shows a hint when focused but empty', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SearchBar />)
    await user.click(screen.getByPlaceholderText(/search by title/i))
    expect(screen.getByText(/type to search/i)).toBeInTheDocument()
  })

  it('fetches real results only after the debounce delay', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [ALCHEMIST_DOC] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.type(input, 'alchem')

    // The debounce hasn't elapsed yet — no request fired mid-typing.
    expect(fetchMock).not.toHaveBeenCalled()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText('The Alchemist')).toBeInTheDocument()
    expect(screen.getByText('Paulo Coelho')).toBeInTheDocument()
  })

  it('does not fetch for an empty query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.click(input)
    await user.type(input, '   ')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/type to search/i)).toBeInTheDocument()
  })

  it('shows an error state and retries on demand', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ docs: [ALCHEMIST_DOC] }) })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search by title/i), 'alchem')
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(screen.getByText('The Alchemist')).toBeInTheDocument())
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }))

    renderWithRouter(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search by title/i), 'zzz')
    await waitFor(() => expect(screen.getByText(/no books found/i)).toBeInTheDocument())
  })

  it('closes the dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SearchBar />)
    await user.click(screen.getByPlaceholderText(/search by title/i))
    expect(screen.getByText(/type to search/i)).toBeInTheDocument()

    await user.click(document.body)
    expect(screen.queryByText(/type to search/i)).not.toBeInTheDocument()
  })

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.click(input)
    expect(screen.getByText(/type to search/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText(/type to search/i)).not.toBeInTheDocument()
  })

  it('ignores a stale response when a newer query supersedes it', async () => {
    const user = userEvent.setup()
    const first = deferred()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [{ key: '/works/OL2W', title: 'Second Result', author_name: ['B'] }],
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.type(input, 'al')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1)) // first request pending
    await user.type(input, 'alchem')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2)) // second supersedes

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)

    // The first (now stale) request resolves late with different data.
    first.resolve({ ok: true, json: async () => ({ docs: [{ key: '/works/OL1W', title: 'STALE' }] }) })
    await waitFor(() => expect(screen.getByText('Second Result')).toBeInTheDocument())
    expect(screen.queryByText('STALE')).not.toBeInTheDocument()
  })

  it('supports ArrowDown/ArrowUp keyboard navigation through results', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            { key: '/works/OL1W', title: 'First Book', author_name: ['A'] },
            { key: '/works/OL2W', title: 'Second Book', author_name: ['B'] },
            { key: '/works/OL3W', title: 'Third Book', author_name: ['C'] },
          ],
        }),
      }),
    )

    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by title/i)
    await user.type(input, 'books')
    await waitFor(() => expect(screen.getByText('First Book')).toBeInTheDocument())

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-0')
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-1')
    await user.keyboard('{ArrowUp}')
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-0')
    await user.keyboard('{End}')
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-2')
  })

  it('exposes controlled query + onQueryChange for external wiring', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ docs: [ALCHEMIST_DOC] }),
      }),
    )

    let query = ''
    const onQueryChange = vi.fn((value) => {
      query = value
    })
    const { rerender } = renderWithRouter(
      <SearchBar query={query} onQueryChange={onQueryChange} />,
    )

    await user.type(screen.getByPlaceholderText(/search by title/i), 'alchem')
    expect(onQueryChange).toHaveBeenCalled()

    // Simulate the parent re-rendering with the new query value.
    rerender(
      <MemoryRouter>
        <SearchBar query="alchem" onQueryChange={onQueryChange} />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('The Alchemist')).toBeInTheDocument())
  })

  it('navigates to the detail page when a result is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [ALCHEMIST_DOC] }) }),
    )

    render(
      <MemoryRouter>
        <SearchBar />
        <Routes>
          <Route path="/book/:key" element={<div>DETAIL PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(screen.getByPlaceholderText(/search by title/i), 'alchem')
    await waitFor(() => expect(screen.getByText('The Alchemist')).toBeInTheDocument())

    await user.click(screen.getByText('The Alchemist'))
    expect(screen.getByText('DETAIL PAGE')).toBeInTheDocument()
  })

  it('navigates with Enter on the highlighted result', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            { key: '/works/OL1W', title: 'First Book', author_name: ['A'] },
            { key: '/works/OL2W', title: 'Second Book', author_name: ['B'] },
          ],
        }),
      }),
    )

    render(
      <MemoryRouter>
        <SearchBar />
        <Routes>
          <Route path="/book/:key" element={<div>DETAIL PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(screen.getByPlaceholderText(/search by title/i), 'books')
    await waitFor(() => expect(screen.getByText('First Book')).toBeInTheDocument())

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(screen.getByText('DETAIL PAGE')).toBeInTheDocument()
  })
})
