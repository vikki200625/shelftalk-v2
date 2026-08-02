import supabase from './supabase'

/**
 * Library data layer — manages user's book shelves and reading goals.
 * All queries go through RLS (owner-only access).
 */

// Add a book to a shelf (or move it between shelves).
export async function addToShelf(userId, bookKey, shelf) {
  const { data, error } = await supabase
    .from('user_library')
    .upsert(
      { user_id: userId, book_key: bookKey, shelf },
      { onConflict: 'user_id,book_key' }
    )
    .select()
    .single()
  return { data, error }
}

// Remove a book from the library.
export async function removeFromShelf(userId, bookKey) {
  const { error } = await supabase
    .from('user_library')
    .delete()
    .eq('user_id', userId)
    .eq('book_key', bookKey)
  return { error }
}

// Get all books on a specific shelf.
export async function getShelfBooks(userId, shelf) {
  const { data, error } = await supabase
    .from('user_library')
    .select('book_key, shelf, progress_pages, added_at')
    .eq('user_id', userId)
    .eq('shelf', shelf)
    .order('added_at', { ascending: false })
  return { data, error }
}

// Get all books in the user's library (all shelves).
export async function getLibraryBooks(userId) {
  const { data, error } = await supabase
    .from('user_library')
    .select('book_key, shelf, progress_pages, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
  return { data, error }
}

// Check if a book is in the user's library and which shelf.
export async function getBookShelf(userId, bookKey) {
  const { data, error } = await supabase
    .from('user_library')
    .select('shelf')
    .eq('user_id', userId)
    .eq('book_key', bookKey)
    .maybeSingle()
  return { data, error }
}

// Update reading progress (pages read).
export async function updateProgress(userId, bookKey, pages) {
  const { data, error } = await supabase
    .from('user_library')
    .update({ progress_pages: pages })
    .eq('user_id', userId)
    .eq('book_key', bookKey)
    .select()
    .single()
  return { data, error }
}

// Get reading goal for a year.
export async function getReadingGoal(userId, year) {
  const { data, error } = await supabase
    .from('reading_goals')
    .select('target')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle()
  return { data, error }
}

// Set or update reading goal.
export async function setReadingGoal(userId, year, target) {
  const { data, error } = await supabase
    .from('reading_goals')
    .upsert(
      { user_id: userId, year, target },
      { onConflict: 'user_id,year' }
    )
    .select()
    .single()
  return { data, error }
}

// Count books finished in a year (for goal progress).
export async function getBooksFinishedCount(userId, year) {
  const startOfYear = `${year}-01-01T00:00:00`
  const endOfYear = `${year}-12-31T23:59:59`
  const { count, error } = await supabase
    .from('user_library')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('shelf', 'finished')
    .gte('added_at', startOfYear)
    .lte('added_at', endOfYear)
  return { count, error }
}
