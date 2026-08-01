const LINKS = [
  { label: 'Browse', active: true },
  { label: 'Library', active: false },
  { label: 'Book Clubs', active: false },
  { label: 'Community', active: false },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <a className="nav-logo" href="#">
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
        </a>
        <div className="nav-links">
          {LINKS.map((link) => (
            <a
              key={link.label}
              className={`nav-link${link.active ? ' nav-link--active' : ''}`}
              href="#"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <a className="nav-signin" href="#">
          Sign in
        </a>
        <a className="btn-get-started" href="#">
          Get Started
        </a>
      </div>
    </nav>
  )
}
