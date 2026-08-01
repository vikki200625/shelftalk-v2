import { useEffect, useRef, useState } from 'react'

/**
 * FadeIn — reveals its children with a fade + slide-up once they
 * scroll into view (or immediately if already visible).
 * Will be reused on every future page section.
 */
export default function FadeIn({ children, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

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
    <section ref={ref} className={classes}>
      {children}
    </section>
  )
}
