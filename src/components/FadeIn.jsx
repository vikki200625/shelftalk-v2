import { useEffect, useRef, useState } from 'react'

/**
 * FadeIn — reveals its children with a fade + slide-up once they
 * scroll into view (or immediately if already visible).
 * Will be reused on every future page section.
 */
export default function FadeIn({ children, className = '', id = undefined }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respect users who prefer reduced motion: show content immediately.
    // Guard the call — jsdom and some embedded browsers lack matchMedia.
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const classes = `fade-in-section${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`

  return (
    <section ref={ref} id={id} className={classes}>
      {children}
    </section>
  )
}
