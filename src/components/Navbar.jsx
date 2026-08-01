import { useState } from 'react'
import { Link } from 'react-router'

const LINKS = [
  { label: 'Browse', href: '#trending' },
  { label: 'Library', href: '#features' },
  { label: 'Book Clubs', href: '#testimonials' },
  { label: 'Community', href: '#community' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link className="nav-logo" to="/">
          <svg
            fill="none"
            height="28"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <span className="nav-logo-text">ShellTalk</span>
        </Link>
        <div className="nav-links">
          {LINKS.map((link) => (
            <a key={link.label} className="nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <a className="nav-signin" href="#">
          Sign in
        </a>
        <a className="btn-get-started" href="#community">
          Get Started
        </a>
        <button
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className={`nav-burger${menuOpen ? ' nav-burger--open' : ''}`}
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-menu-mobile">
          {LINKS.map((link) => (
            <a
              key={link.label}
              className="nav-menu-mobile-link"
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a className="nav-menu-mobile-link" href="#" onClick={() => setMenuOpen(false)}>
            Sign in
          </a>
        </div>
      )}
    </nav>
  )
}
