import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const LINKS = [
  { label: 'Browse', to: '/browse' },
  { label: 'Library', to: '/library' },
  { label: 'Book Clubs', href: '#testimonials' },
  { label: 'Find Friends', to: '/find-friends' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const profileRef = useRef(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    setProfileOpen(false)
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
            link.to ? (
              <Link key={link.label} className="nav-link" to={link.to}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} className="nav-link" href={link.href}>
                {link.label}
              </a>
            )
          ))}
        </div>
      </div>
      <div className="nav-right">
        {user ? (
          <div className="nav-profile" ref={profileRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setProfileOpen((open) => !open)}
              type="button"
              aria-expanded={profileOpen}
              aria-label="Profile menu"
            >
              <Avatar
                username={profile?.username || 'reader'}
                size={36}
              />
            </button>
            {profileOpen && (
              <div className="nav-profile-dropdown">
                <Link
                  className="nav-profile-link"
                  to={`/profile/${profile?.username}`}
                  onClick={() => setProfileOpen(false)}
                >
                  View profile
                </Link>
                <button
                  className="nav-profile-signout"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
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
            link.to ? (
              <Link
                key={link.label}
                className="nav-menu-mobile-link"
                to={link.to}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                className="nav-menu-mobile-link"
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          ))}
          {user ? (
            <>
              <Link
                className="nav-menu-mobile-link"
                onClick={() => setMenuOpen(false)}
                to={`/profile/${profile?.username}`}
              >
                Profile
              </Link>
              <Link
                className="nav-menu-mobile-link"
                onClick={() => setMenuOpen(false)}
                to="/settings"
              >
                Settings
              </Link>
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
