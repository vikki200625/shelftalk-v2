import { Fragment } from 'react'
import FadeIn from './FadeIn'
import SearchBar from './SearchBar'
import FloatingBooks from './FloatingBooks'

const TRENDING = ['Dune', 'The Alchemist', 'Atomic Habits']

const STATS = [
  { value: '12k+', label: 'Readers' },
  { value: '58k+', label: 'Books' },
  { value: '1.4k+', label: 'Clubs' },
]

export default function Hero() {
  return (
    <FadeIn className="hero">
      {/* Left: copy, search, trending, stats */}
      <div className="hero-copy">
        <span className="eyebrow">A community for people who love books</span>
        <h1 className="hero-title">
          Find your next <br />
          <em className="hero-title-accent">favorite book.</em>
        </h1>
        <p className="hero-sub">
          Join thousands of readers tracking their reading, discovering hidden gems, and discussing
          literature in a cozy digital corner.
        </p>

        <SearchBar />

        <div className="trending">
          <span className="trending-label">Trending:</span>
          {TRENDING.map((title, index) => (
            <Fragment key={title}>
              {index > 0 && <span> · </span>}
              <a className="trending-link" href="#">
                {title}
              </a>
            </Fragment>
          ))}
        </div>

        <div className="stats">
          {STATS.map((stat, index) => (
            <Fragment key={stat.label}>
              {index > 0 && <div className="stat-divider" />}
              <div>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Right: floating book covers */}
      <FloatingBooks />
    </FadeIn>
  )
}
