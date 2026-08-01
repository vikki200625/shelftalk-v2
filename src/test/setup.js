import '@testing-library/jest-dom'

// jsdom has no IntersectionObserver, which FadeIn uses for the
// scroll-reveal effect. Stub it so sections are "visible" in tests.
class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback
  }

  observe(target) {
    this.callback([{ isIntersecting: true, target }], this)
  }

  unobserve() {}

  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverStub
