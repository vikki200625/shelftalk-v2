import { useEffect, useState } from 'react'
import FadeIn from './FadeIn'
import { fetchSubjectCount } from '../lib/openlibrary'

// The three featured genres shown in the bento on the browse page.
// `icon` is a Material Symbol name; `tone` picks an accent color variant.
const BENTO_GENRES = [
  { label: 'Literary Fiction', icon: 'auto_stories', tone: 'bento--forest' },
  { label: 'Historical & Bio', icon: 'history_edu', tone: 'bento--brass' },
  { label: 'Science & Nature', icon: 'science', tone: 'bento--sage' },
]

/**
 * GenreBento — "Explore by Genre" grid from the browse design. Each card
 * shows a genre with its real OpenLibrary book count; clicking one hands
 * the label to the parent (which turns it into a search).
 */
export default function GenreBento({ onSelect }) {
  const [counts, setCounts] = useState({})
  const [failed, setFailed] = useState({})

  // Fetch one count per genre, in parallel. Each card degrades to just
  // the label if its count request fails.
  useEffect(() => {
    const controllers = BENTO_GENRES.map(({ label }) => {
      const controller = new AbortController()
      fetchSubjectCount(label, { signal: controller.signal })
        .then((count) => setCounts((prev) => ({ ...prev, [label]: count })))
        .catch((error) => {
          if (error.name === 'AbortError') return
          setFailed((prev) => ({ ...prev, [label]: true }))
        })
      return controller
    })
    return () => controllers.forEach((controller) => controller.abort())
  }, [])

  return (
    <FadeIn className="bento section" id="browse-genres">
      <h2 className="section-title">Explore by Genre</h2>
      <div className="bento-grid">
        {BENTO_GENRES.map((genre) => {
          const count = counts[genre.label]
          const hasFailed = failed[genre.label]
          return (
            <button
              key={genre.label}
              className={`bento-card ${genre.tone}`}
              type="button"
              onClick={() => onSelect(genre.label)}
            >
              <span className="bento-accent" aria-hidden="true" />
              <span className="bento-body">
                <span className="bento-head">
                  <span className="bento-label">{genre.label}</span>
                  <span className="material-symbols-outlined bento-icon" aria-hidden="true">
                    {genre.icon}
                  </span>
                </span>
                <span className="bento-count">
                  {count != null ? `${count.toLocaleString()} Books` : hasFailed ? '—' : '…'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </FadeIn>
  )
}
