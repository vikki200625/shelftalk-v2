/* ------------------------------------------------------------------
   notifications.js — Notification feed data layer.
   Depends on migration 0011 (notifications).
   ------------------------------------------------------------------ */

import supabase from "./supabase";

/**
 * Create a notification. Used by feature modules (profiles.js on follow,
 * clubs.js fans out its own batch insert for discussions).
 */
export async function createNotification({ userId, type, actorId = null, clubId = null, message }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    actor_id: actorId,
    club_id: clubId,
    message,
  })
  if (error) throw error
}

/**
 * Recent notifications for a user, newest first.
 * Returns: [{ id, type, message, read, created_at, actor_id,
 *             actor_username, club_id }]
 */
export async function getNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, profiles!notifications_actor_id_fkey(username)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(n => ({
    ...n,
    actor_username: n.profiles?.username || null,
    profiles: undefined,
  }))
}

/**
 * Number of unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return count ?? 0
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Mark every unread notification for a user as read.
 */
export async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}

/**
 * Subscribe to realtime INSERTs on the user's notifications.
 * Returns the channel — call supabase.removeChannel(channel) to stop.
 */
export function subscribeNotifications(userId, callback) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
