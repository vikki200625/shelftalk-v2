import supabase from './supabase'
import { createNotification } from './notifications'

/**
 * Profile data layer — reads/writes profiles + follows.
 * All queries go through RLS (read: public, write: owner-only).
 */

// Fetch a public profile by username (used by /profile/:username).
export async function fetchProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  return { data, error }
}

// Fetch a profile by auth user id (used by /settings).
export async function fetchProfileById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error }
}

// Update the caller's own profile. RLS enforces id = auth.uid().
export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Count how many people this user follows.
export async function fetchFollowingCount(userId) {
  const { count, error } = await supabase
    .from('user_follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', userId)
  return { count, error }
}

// Count how many people follow this user.
export async function fetchFollowersCount(userId) {
  const { count, error } = await supabase
    .from('user_follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', userId)
  return { count, error }
}

// Is the current user following this profile?
export async function fetchFollowStatus(followerId, followingId) {
  if (!followerId) return { following: false }
  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  return { following: Boolean(data), error }
}

// Follow a user (RLS: auth.uid() must equal follower_id).
// Also notifies the person being followed (never on self-follow).
export async function followUser(followerId, followingId) {
  const { data, error } = await supabase
    .from('user_follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()
  if (error) return { data, error }

  if (followerId !== followingId) {
    // Best-effort: notification failure should never fail the follow.
    try {
      const { data: actor } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', followerId)
        .maybeSingle()
      await createNotification({
        userId: followingId,
        type: 'follow',
        actorId: followerId,
        message: `${actor?.username || 'Someone'} started following you`,
      })
    } catch {
      // swallow — see comment above
    }
  }
  return { data, error: null }
}

// Unfollow a user (RLS: auth.uid() must equal follower_id).
export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  return { error }
}

// Shelf counts for a user's library (for the profile stats row).
export async function fetchShelfCounts(userId) {
  const { data, error } = await supabase
    .from('user_library')
    .select('shelf')
    .eq('user_id', userId)
  if (error) return { counts: {}, error }
  const counts = { want_to_read: 0, reading: 0, finished: 0 }
  for (const row of data) {
    if (counts[row.shelf] !== undefined) counts[row.shelf] += 1
  }
  return { counts, error: null }
}

// Search profiles by username (for Find Friends page).
export async function searchProfiles(query, limit = 20) {
  if (!query || !query.trim()) return { data: [], error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .ilike('username', `%${query.trim()}%`)
    .limit(limit)
  return { data, error }
}

// Fetch suggested profiles (random users, excluding current user).
export async function fetchSuggestedProfiles(currentUserId, limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .neq('id', currentUserId)
    .limit(limit)
  return { data, error }
}

// Fetch list of followers (with profile data).
export async function fetchFollowers(userId, limit = 50) {
  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id, profiles!user_follows_follower_id_fkey(id, username, display_name, avatar_url, bio)')
    .eq('following_id', userId)
    .limit(limit)
  if (error) return { data: [], error }
  const followers = data.map((row) => row.profiles).filter(Boolean)
  return { data: followers, error: null }
}

// Fetch list of users this person is following (with profile data).
export async function fetchFollowing(userId, limit = 50) {
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id, profiles!user_follows_following_id_fkey(id, username, display_name, avatar_url, bio)')
    .eq('follower_id', userId)
    .limit(limit)
  if (error) return { data: [], error }
  const following = data.map((row) => row.profiles).filter(Boolean)
  return { data: following, error: null }
}
