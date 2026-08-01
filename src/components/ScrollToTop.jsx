import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * ScrollToTop — resets the scroll position to the top on every route
 * change. Uses behavior:'instant' because the page has CSS
 * scroll-behavior:smooth, which would otherwise animate every navigation.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
