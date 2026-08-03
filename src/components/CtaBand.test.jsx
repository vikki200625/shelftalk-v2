import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import CtaBand from './CtaBand'

describe('CtaBand', () => {
  it('renders the headline', () => {
    render(
      <MemoryRouter>
        <CtaBand />
      </MemoryRouter>,
    )
    expect(screen.getByText('Your next favorite book is waiting.')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(
      <MemoryRouter>
        <CtaBand />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Join the community/)).toBeInTheDocument()
  })

  it('has a link to signup', () => {
    render(
      <MemoryRouter>
        <CtaBand />
      </MemoryRouter>,
    )
    const link = screen.getByText('Join the Community')
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('has a browse books link', () => {
    render(
      <MemoryRouter>
        <CtaBand />
      </MemoryRouter>,
    )
    const link = screen.getByText('Browse Books')
    expect(link).toHaveAttribute('href', '#trending')
  })
})
