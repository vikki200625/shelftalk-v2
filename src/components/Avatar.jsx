/**
 * Avatar — shows avatar_url image when present, otherwise a
 * deterministic initial-letter tile colored from the username
 * (same username always gets the same warm cover color).
 */

// Deterministic hash so the same username always maps to the same color.
function hashUsername(username) {
  let hash = 0
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Warm bookshop palette from the design tokens (no blue, ever).
const PALETTES = [
  { bg: 'var(--cover-sage-deep)', fg: 'var(--brand-surface)' },
  { bg: 'var(--cover-terracotta)', fg: 'var(--brand-surface)' },
  { bg: 'var(--cover-olive)', fg: 'var(--brand-surface)' },
  { bg: 'var(--cover-umber)', fg: 'var(--brand-surface)' },
  { bg: 'var(--brand-accent)', fg: 'var(--cover-gold-ink)' },
  { bg: 'var(--brand-primary)', fg: 'var(--brand-surface)' },
]

function initialsFor(username, displayName) {
  const source = displayName || username || '?'
  const words = source.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export default function Avatar({ username, displayName, avatarUrl, size = 96 }) {
  const palette = PALETTES[hashUsername(username || '?') % PALETTES.length]

  if (avatarUrl) {
    return (
      <img
        alt={`${displayName || username}'s avatar`}
        className="avatar"
        height={size}
        src={avatarUrl}
        style={{ width: size, height: size }}
        width={size}
      />
    )
  }

  return (
    <span
      aria-label={`${displayName || username}'s avatar`}
      className="avatar avatar--fallback"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.fg,
        fontSize: size * 0.36,
      }}
    >
      {initialsFor(username, displayName)}
    </span>
  )
}
