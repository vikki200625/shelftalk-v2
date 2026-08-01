export default function FloatingBooks() {
  return (
    <div className="books-visual">
      <div className="books-stack">
        {/* Back book */}
        <div className="book-cover book-cover--back">
          <div className="book-text">
            <span className="book-text-label">Non-Fiction</span>
            Atomic
            <br />
            Habits
          </div>
        </div>

        {/* Middle book */}
        <div className="book-cover book-cover--mid">
          <div className="book-text book-text--dark">
            <span className="book-text-label">Fiction</span>
            The
            <br />
            Alchemist
          </div>
        </div>

        {/* Front book */}
        <div className="book-cover book-cover--front">
          <div className="book-front">
            <span className="book-front-kicker">Sci-Fi Epic</span>
            <span className="book-front-title">DUNE</span>
            <div className="book-front-rule" />
            <span className="book-front-author">Frank Herbert</span>
          </div>
        </div>

        {/* Overlay: reading progress */}
        <div className="progress-card">
          <p className="progress-label">Currently reading — 47% done</p>
          <div className="progress-track">
            <div className="progress-fill" />
          </div>
        </div>

        {/* Overlay: friends chip */}
        <div className="friends-chip">
          <div className="avatar-stack">
            <span className="avatar avatar--green">A</span>
            <span className="avatar avatar--gold">R</span>
            <span className="avatar avatar--slate">M</span>
          </div>
          <p className="friends-text">4 friends finished this</p>
        </div>
      </div>
    </div>
  )
}
