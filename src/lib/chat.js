import supabase from './supabase'

/**
 * Chat data layer — global chat + private messages.
 * All queries go through RLS (owner-only access).
 */

// ==================== GLOBAL CHAT ====================

// Send a message to global chat.
export async function sendGlobalMessage(userId, message) {
  const { data, error } = await supabase
    .from('global_chat_messages')
    .insert({ user_id: userId, message })
    .select()
    .single()
  return { data, error }
}

// Get recent global chat messages (newest first).
export async function getGlobalMessages(limit = 50) {
  const { data, error } = await supabase
    .from('global_chat_messages')
    .select('id, user_id, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ? data.reverse() : [], error }
}

// Subscribe to new global messages (real-time).
export function subscribeGlobalMessages(callback) {
  return supabase
    .channel('global_chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'global_chat_messages',
    }, (payload) => {
      callback(payload.new)
    })
    .subscribe()
}

// ==================== PRIVATE CHAT ====================

// Get or create a private chat channel between two users.
// Uses the SECURITY DEFINER rpc (applied live 2026-08-22): client-side
// creation cannot work under correct RLS — the creator is not allowed to
// insert the OTHER user's participant row. The rpc reuses an existing
// channel for the pair or creates one atomically. userId1 is implicit
// (auth.uid() inside the function); it stays in the signature because
// callers pass both ids.
export async function getOrCreateChannel(userId1, userId2) {
  const { data: channelId, error } = await supabase.rpc('create_dm_channel', {
    other_user: userId2,
  })

  if (error) return { channelId: null, error }
  return { channelId, error: null }
}

// Get all channels for a user (with last message preview).
export async function getUserChannels(userId) {
  const { data: participations, error } = await supabase
    .from('chat_participants')
    .select('channel_id')
    .eq('user_id', userId)

  if (error || !participations) return { channels: [], error }

  const channels = []
  for (const { channel_id } of participations) {
    // Get other participant
    const { data: others } = await supabase
      .from('chat_participants')
      .select('user_id, profiles:user_id(username, display_name, avatar_url)')
      .eq('channel_id', channel_id)
      .neq('user_id', userId)

    if (!others || others.length === 0) continue

    const other = others[0]

    // Get last message
    const { data: lastMessage } = await supabase
      .from('private_messages')
      .select('message, created_at, sender_id')
      .eq('channel_id', channel_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('private_messages')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channel_id)
      .neq('sender_id', userId)
      .is('read_at', null)

    channels.push({
      channelId: channel_id,
      otherUser: other.profiles,
      lastMessage: lastMessage || null,
      unreadCount: unreadCount || 0,
    })
  }

  // Sort by last message time
  channels.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || '1970-01-01'
    const bTime = b.lastMessage?.created_at || '1970-01-01'
    return new Date(bTime) - new Date(aTime)
  })

  return { channels, error: null }
}

// Send a private message.
export async function sendPrivateMessage(channelId, senderId, message) {
  const { data, error } = await supabase
    .from('private_messages')
    .insert({ channel_id: channelId, sender_id: senderId, message })
    .select()
    .single()
  return { data, error }
}

// Get messages in a channel.
export async function getChannelMessages(channelId, limit = 50) {
  const { data, error } = await supabase
    .from('private_messages')
    .select('id, channel_id, sender_id, message, created_at, read_at')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ? data.reverse() : [], error }
}

// Mark messages as read.
export async function markAsRead(channelId, userId) {
  const { error } = await supabase
    .from('private_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .neq('sender_id', userId)
    .is('read_at', null)
  return { error }
}

// Subscribe to new private messages (real-time).
export function subscribePrivateMessages(channelId, callback) {
  return supabase
    .channel(`private_${channelId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'private_messages',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      callback(payload.new)
    })
    .subscribe()
}

// Subscribe to read receipts (real-time).
export function subscribeReadReceipts(channelId, callback) {
  return supabase
    .channel(`read_receipts_${channelId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'private_messages',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      callback(payload.new)
    })
    .subscribe()
}
