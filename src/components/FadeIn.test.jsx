import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FadeIn from './FadeIn'

describe('FadeIn', () => {
  it('renders children', () => {
    render(
      <FadeIn>
        <p>Hello world</p>
      </FadeIn>,
    )
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('applies the fade-in-section class', () => {
    const { container } = render(
      <FadeIn>
        <p>Content</p>
      </FadeIn>,
    )
    expect(container.querySelector('.fade-in-section')).toBeTruthy()
  })

  it('adds is-visible class when IntersectionObserver fires', () => {
    const { container } = render(
      <FadeIn>
        <p>Content</p>
      </FadeIn>,
    )
    // The stub IntersectionObserver fires immediately with isIntersecting: true
    expect(container.querySelector('.fade-in-section.is-visible')).toBeTruthy()
  })

  it('passes through className and id', () => {
    const { container } = render(
      <FadeIn className="custom-class" id="my-section">
        <p>Content</p>
      </FadeIn>,
    )
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'my-section')
    expect(section.className).toContain('custom-class')
  })
})
