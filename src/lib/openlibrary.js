// OpenLibrary API — free, no key, CORS-open, browser-direct.
// Docs: https://openlibrary.org/developers/api
//
// Three endpoints, three slightly different response shapes, mapped into
// ONE shared `book` shape so components never care which source a book
// came from:
//   { key, title, authorName, year, coverUrl, fallbackCover, rating }

const BASE = 'https://openlibrary.org'

const FALLBACK_COVERS = [
  'cover--forest',
  'cover--gold',
  'cover--terracotta',
  'cover--sage',
  'cover--olive',
  'cover--umber',
]

export function coverUrl(coverId, size = 'M') {
  if (!coverId) return null
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

// Cycle through the cover color variants so stacked cards differ.
// A `base` color (e.g. the genre color) wins when provided.
export function fallbackCover(index, base) {
  if (base) return base
  return FALLBACK_COVERS[index % FALLBACK_COVERS.length]
}

function firstAuthorName(names) {
  return Array.isArray(names) && names.length > 0 ? names[0] : null
}

function roundRating(rating) {
  return rating == null ? null : Math.round(rating * 10) / 10
}

// search.json docs: title, author_name[], cover_i, first_publish_year, ratings_average
export function mapSearchDoc(doc, index) {
  return {
    key: doc.key ?? null,
    title: doc.title ?? 'Untitled',
    authorName: firstAuthorName(doc.author_name) ?? 'Unknown author',
    year: doc.first_publish_year ?? null,
    coverUrl: coverUrl(doc.cover_i, 'M'),
    fallbackCover: fallbackCover(index),
    rating: roundRating(doc.ratings_average),
  }
}

// subjects/{slug}.json works: title, authors[{key,name}], cover_id, first_publish_year
export function mapSubjectWork(work, index, base) {
  return {
    key: work.key ?? null,
    title: work.title ?? 'Untitled',
    authorName: work.authors?.[0]?.name ?? 'Unknown author',
    year: work.first_publish_year ?? null,
    coverUrl: coverUrl(work.cover_id, 'L'),
    fallbackCover: fallbackCover(index, base),
    rating: null,
  }
}

// trending/now.json works: title, author_name[], cover_i, first_publish_year (no rating)
export function mapTrendingWork(work, index) {
  return {
    key: work.key ?? null,
    title: work.title ?? 'Untitled',
    authorName: firstAuthorName(work.author_name) ?? 'Unknown author',
    year: work.first_publish_year ?? null,
    coverUrl: coverUrl(work.cover_i, 'L'),
    fallbackCover: fallbackCover(index),
    rating: null,
  }
}

async function getJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`OpenLibrary request failed: ${res.status}`)
  return res.json()
}

export function searchBooks(query, { signal, limit = 5 } = {}) {
  const q = encodeURIComponent(query.trim())
  return getJson(`${BASE}/search.json?q=${q}&limit=${limit}`, { signal }).then((data) =>
    (Array.isArray(data.docs) ? data.docs : []).map(mapSearchDoc),
  )
}

export function fetchTrending({ signal, limit = 12 } = {}) {
  return getJson(`${BASE}/trending/now.json?limit=${limit}`, { signal }).then((data) =>
    (Array.isArray(data.works) ? data.works : []).map(mapTrendingWork),
  )
}

export function fetchGenreBooks(slug, { signal, limit = 12, base } = {}) {
  return getJson(`${BASE}/subjects/${encodeURIComponent(slug)}.json?limit=${limit}&sort=new`, {
    signal,
  }).then((data) =>
    (Array.isArray(data.works) ? data.works : []).map((work, i) => mapSubjectWork(work, i, base)),
  )
}
