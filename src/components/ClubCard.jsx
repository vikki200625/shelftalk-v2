import { Link } from 'react-router'

const GENRE_COLORS = {
  fiction: 'var(--cover-sage-deep)',
  nonfiction: 'var(--cover-terracotta)',
  mystery: 'var(--cover-umber)',
  fantasy: 'var(--cover-olive)',
  romance: 'var(--cover-terracotta)',
  scifi: 'var(--brand-primary)',
  default: 'var(--brand-accent-deep)',
}

function getGenreColor(genre) {
  if (!genre) return GENRE_COLORS.default
  const key = genre.toLowerCase().replace(/\s+/g, '')
  return GENRE_COLORS[key] || GENRE_COLORS.default
}

export default function ClubCard({ club }) {
  const accentColor = getGenreColor(club.genre)

  return (
    <Link
      className="club-card"
      to={`/clubs/${club.id}`}
      style={{ '--club-accent': accentColor }}
    >
      <div className="club-card-accent" />
      <div className="club-card-body">
        <h3 className="club-card-name">{club.name}</h3>
        {club.genre && (
          <span className="club-card-genre">{club.genre}</span>
        )}
        <p className="club-card-desc">{club.description}</p>
        <div className="club-card-meta">
          <span className="club-card-members">
            {club.member_count} {club.member_count === 1 ? 'member' : 'members'}
          </span>
          <span className="club-card-creator">by {club.creator_username}</span>
        </div>
      </div>
    </Link>
  )
}
