import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FloatingBooks from './FloatingBooks'

describe('FloatingBooks', () => {
  it('renders the book titles', () => {
    render(<FloatingBooks />)
    expect(screen.getByText('DUNE')).toBeInTheDocument()
    expect(screen.getByText(/Atomic/)).toBeInTheDocument()
    expect(screen.getByText(/The/)).toBeInTheDocument()
  })

  it('renders the progress card', () => {
    render(<FloatingBooks />)
    expect(screen.getByText('Currently reading — 47% done')).toBeInTheDocument()
  })

  it('renders the friends chip', () => {
    render(<FloatingBooks />)
    expect(screen.getByText('4 friends finished this')).toBeInTheDocument()
  })

  it('renders author names', () => {
    render(<FloatingBooks />)
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
  })
})
