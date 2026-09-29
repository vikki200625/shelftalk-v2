import { Link } from 'react-router'

// Every footer link must lead to a real route — no dead anchors
// (design review 2026-09-29, finding 4B).
const PRODUCT_LINKS = [
  { label: 'Browse', to: '/browse' },
  { label: 'My Library', to: '/library' },
  { label: 'Book Clubs', to: '/clubs' },
  { label: 'Find Friends', to: '/find-friends' },
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

          <div className="footer-col">
            <p className="footer-heading">Product</p>
            <ul className="footer-links">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link className="footer-link" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2026 ShellTalk</p>
        </div>
      </div>
    </footer>
  )
}
