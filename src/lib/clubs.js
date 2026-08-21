/* ------------------------------------------------------------------
   clubs.js — Book clubs data layer.
   Depends on migration 0009 (book_clubs, club_members, club_discussions).
   ------------------------------------------------------------------ */

import supabase from "./supabase";
import { createNotification } from "./notifications";

/**
 * Get all clubs, optionally filtered by search term.
 * Returns: [{ id, name, description, genre, member_count, created_by, created_at, creator_username }]
 */
export async function getClubs(search = '') {
  let query = supabase
    .from('book_clubs')
    .select('*, creator:profiles!book_clubs_created_by_fkey(username), club_members(count)')
    .order('created_at', { ascending: false })

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map(club => ({
    ...club,
    member_count: club.club_members?.[0]?.count ?? 0,
    creator_username: club.creator?.username || 'unknown',
    club_members: undefined,
    creator: undefined,
  }))
}

/**
 * Get a single club by id.
 * Returns: full club object + is_member boolean + current user's role
 */
export async function getClub(clubId) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('book_clubs')
    .select(`
      *,
      creator:profiles!book_clubs_created_by_fkey(username),
      club_members(user_id, role, joined_at, profiles!club_members_user_id_fkey(username))
    `)
    .eq('id', clubId)
    .single()

  if (error) throw error

  const members = (data.club_members || []).map(m => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    username: m.profiles?.username || 'unknown',
  }))

  const membership = user
    ? members.find(m => m.user_id === user.id)
    : null

  return {
    ...data,
    creator_username: data.creator?.username || 'unknown',
    creator: undefined,
    members,
    member_count: members.length,
    is_member: !!membership,
    my_role: membership?.role || null,
  }
}

/**
 * Create a new club. Returns the created club.
 */
export async function createClub({ name, description, genre }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in to create a club')

  const { data, error } = await supabase
    .from('book_clubs')
    .insert({ name, description, genre, created_by: user.id })
    .select()
    .single()

  if (error) throw error

  // Auto-add creator as owner
  const { error: memberError } = await supabase
    .from('club_members')
    .insert({ club_id: data.id, user_id: user.id, role: 'owner' })

  if (memberError) throw memberError

  return data
}

/**
 * Join a club.
 */
export async function joinClub(clubId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in')

  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: clubId, user_id: user.id, role: 'member' })

  if (error) throw error
}

/**
 * Leave a club. Owners cannot leave — they must transfer ownership or delete.
 */
export async function leaveClub(clubId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in')

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .neq('role', 'owner')

  if (error) throw error
}

/**
 * Get discussions for a club.
 * Returns: [{ id, title, body, user_id, username, created_at }]
 */
export async function getClubDiscussions(clubId) {
  const { data, error } = await supabase
    .from('club_discussions')
    .select('*, profiles!club_discussions_user_id_fkey(username)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(d => ({
    ...d,
    username: d.profiles?.username || 'unknown',
    profiles: undefined,
  }))
}

/**
 * Post a new discussion to a club.
 */
export async function createDiscussion(clubId, { title, body }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be signed in')

  const { data, error } = await supabase
    .from('club_discussions')
    .insert({ club_id: clubId, user_id: user.id, title, body })
    .select()
    .single()

  if (error) throw error

  // Notify every other member of the club. Best-effort: a notification
  // failure must not fail the discussion post.
  try {
    const [{ data: club }, { data: author }, { data: members }] = await Promise.all([
      supabase.from('book_clubs').select('name').eq('id', clubId).maybeSingle(),
      supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
      supabase.from('club_members').select('user_id').eq('club_id', clubId),
    ])

    const recipients = (members || []).map(m => m.user_id).filter(id => id !== user.id)
    if (recipients.length > 0) {
      const message = `${author?.username || 'Someone'} posted in ${club?.name || 'a club'}: ${title}`
      await supabase.from('notifications').insert(
        recipients.map(userId => ({
          user_id: userId,
          type: 'club_discussion',
          actor_id: user.id,
          club_id: clubId,
          message,
        }))
      )
    }
  } catch {
    // swallow — see comment above
  }

  return data
}
