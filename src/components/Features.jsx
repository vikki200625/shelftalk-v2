import FadeIn from './FadeIn'

const FEATURES = [
  {
    title: 'Discover',
    body: 'Search millions of books and get recommendations that actually match your taste.',
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M8 11h6M11 8v6" />
      </svg>
    ),
    mockup: (
      <div className="feature-mockup">
        <div className="mockup-search">
          <span className="material-symbols-outlined mockup-search-icon">search</span>
          <span className="mockup-search-text">Search books…</span>
        </div>
        <div className="mockup-spines">
          <div className="book-spine book-spine--primary" />
          <div className="book-spine book-spine--accent" />
          <div className="book-spine book-spine--sage" />
          <div className="book-spine book-spine--terracotta" />
        </div>
      </div>
    ),
  },
  {
    title: 'Track',
    body: "Log what you're reading, set goals, and watch your progress stack up.",
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 8h8" />
        <path d="M8 12h6" />
        <path d="M8 16h3" />
      </svg>
    ),
    mockup: (
      <div className="feature-mockup">
        {[
          { label: 'Dune', pct: 47, cls: 'progress-fill' },
          { label: 'Atomic Habits', pct: 82, cls: 'progress-fill progress-fill--gold' },
          { label: '1984', pct: 12, cls: 'progress-fill progress-fill--sage' },
        ].map((row) => (
          <div className="mockup-progress" key={row.label}>
            <div className="mockup-progress-head">
              <span className="mockup-progress-label">{row.label}</span>
              <span className="mockup-progress-pct">{row.pct}%</span>
            </div>
            <div className="progress-track">
              <div className={row.cls} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Connect',
    body: 'Join clubs, share notes, and argue about endings with fellow readers.',
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    mockup: (
      <div className="feature-mockup">
        <div className="mockup-bubble mockup-bubble--out">Just finished Dune. Wow.</div>
        <div className="mockup-bubble mockup-bubble--in">
          Join the Dune club, we're doing a reread!
        </div>
        <div className="mockup-bubble mockup-bubble--out">Say less, I'm in 🐛</div>
      </div>
    ),
  },
]

export default function Features() {
  return (
    <FadeIn className="section" id="features">
      <h2 className="section-title section-title--center">Everything your shelf needs</h2>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <div className="feature-card" key={feature.title}>
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-body">{feature.body}</p>
            {feature.mockup}
          </div>
        ))}
      </div>
    </FadeIn>
  )
}
