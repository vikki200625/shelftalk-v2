import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

const LINKS = [
  { label: 'Browse', href: '#trending' },
  { label: 'Library', href: '#features' },
  { label: 'Book Clubs', href: '#testimonials' },
  { label: 'Community', href: '#community' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
  }

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
        {user ? (
          <>
            <span className="nav-user-email">
              {user.email}
            </span>
            <button
              className="nav-signout"
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link className="nav-signin" to="/signin">
              Sign in
            </Link>
            <Link className="btn-get-started" to="/signup">
              Get Started
            </Link>
          </>
        )}
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
          {user ? (
            <>
              <span className="nav-menu-mobile-link nav-menu-mobile-email">
                {user.email}
              </span>
              <button
                className="nav-menu-mobile-link nav-menu-mobile-signout"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              className="nav-menu-mobile-link"
              to="/signin"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
