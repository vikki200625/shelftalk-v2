/* ------------------------------------------------------------------
   reviews.js — Book ratings & reviews data layer.
   Depends on migration 0010 (book_ratings).
   ------------------------------------------------------------------ */

import supabase from "./supabase";

/**
 * Create or update the current user's rating for a book.
 * rating: 1-5 (integer). reviewText: optional, max 500 chars.
 * Returns the saved row.
 */
export async function rateBook(bookKey, rating, reviewText = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in to rate a book')

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5')
  }
  if (reviewText && reviewText.length > 500) {
    throw new Error('Review must be 500 characters or fewer')
  }

  const { data, error } = await supabase
    .from('book_ratings')
    .upsert(
      { user_id: user.id, book_key: bookKey, rating, review_text: reviewText },
      { onConflict: 'user_id,book_key' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Aggregate stats for a book: average rating and count.
 * Returns: { average, count }
 */
export async function getBookRating(bookKey) {
  const { data, error } = await supabase
    .from('book_ratings')
    .select('rating')
    .eq('book_key', bookKey)

  if (error) throw error

  const ratings = (data || []).map(r => r.rating)
  const count = ratings.length
  const average = count === 0
    ? 0
    : ratings.reduce((sum, r) => sum + r, 0) / count

  return { average, count }
}

/**
 * The current user's rating for a book, or null if they haven't rated.
 */
export async function getUserRating(bookKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('book_ratings')
    .select('*')
    .eq('book_key', bookKey)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * All ratings with review text for a book, newest first.
 * Returns: [{ id, rating, review_text, user_id, username, created_at, updated_at }]
 */
export async function getBookRatings(bookKey) {
  const { data, error } = await supabase
    .from('book_ratings')
    .select('*, profiles!book_ratings_user_id_fkey(username)')
    .eq('book_key', bookKey)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(r => ({
    ...r,
    username: r.profiles?.username || 'unknown',
    profiles: undefined,
  }))
}

/**
 * Delete the current user's rating for a book.
 */
export async function deleteRating(bookKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in')

  const { error } = await supabase
    .from('book_ratings')
    .delete()
    .eq('book_key', bookKey)
    .eq('user_id', user.id)

  if (error) throw error
}
