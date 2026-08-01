const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Browse', href: '#trending' },
      { label: 'My Library', href: '#features' },
      { label: 'Book Clubs', href: '#testimonials' },
      { label: 'Achievements', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'API', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-brand-name">ShellTalk</p>
            <p className="footer-brand-tag">A cozy digital corner for people who love books.</p>
          </div>

          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.heading}>
              <p className="footer-heading">{col.heading}</p>
              <ul className="footer-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a className="footer-link" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-col">
            <p className="footer-heading">Bookish updates, monthly.</p>
            <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
              <input
                aria-label="Email address"
                className="newsletter-input"
                placeholder="you@example.com"
                type="email"
              />
              <button className="newsletter-btn" type="submit">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2026 ShellTalk</p>
          <div className="footer-social">
            <a aria-label="X (Twitter)" className="footer-social-link" href="#">
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </a>
            <a aria-label="Instagram" className="footer-social-link" href="#">
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect height="18" rx="5" width="18" x="3" y="3" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" fill="currentColor" r="0.5" />
              </svg>
            </a>
            <a aria-label="Discord" className="footer-social-link" href="#">
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
