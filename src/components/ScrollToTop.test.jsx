import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import ScrollToTop from './ScrollToTop'

describe('ScrollToTop', () => {
  it('calls scrollTo when route changes', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
      </MemoryRouter>,
    )
    // scrollTo is called once on mount for the initial route
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('renders nothing (null)', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>,
    )
    // ScrollToTop returns null, so the container should be empty
    expect(container.innerHTML).toBe('')
  })
})
