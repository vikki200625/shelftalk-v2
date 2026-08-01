import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

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

// jsdom also lacks matchMedia (FadeIn checks prefers-reduced-motion).
global.window.matchMedia = global.window.matchMedia || (() => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
}))

// jsdom doesn't implement window.scrollTo (ScrollToTop calls it on navigation).
global.window.scrollTo = global.window.scrollTo || (() => {})

// Components fetch on mount (search, trending, genre rows). Give every test
// a fetch stub that resolves to an empty response so nothing hits the real
// network. Tests that care about responses override the stub per-test with
// vi.stubGlobal('fetch', ...) — that's what unstubAllGlobals() restores.
function stubDefaultFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
}

stubDefaultFetch()

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  stubDefaultFetch()
})
