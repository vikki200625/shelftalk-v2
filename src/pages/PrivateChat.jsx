import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import {
  getUserChannels,
  getChannelMessages,
  sendPrivateMessage,
  markAsRead,
  subscribePrivateMessages,
  subscribeReadReceipts,
} from '../lib/chat'
import Avatar from '../components/Avatar'

export default function PrivateChat() {
  const { channelId } = useParams()
  const { user } = useAuth()
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [channelsError, setChannelsError] = useState(null)
  const [threadError, setThreadError] = useState(null)
  const [sendError, setSendError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadChannels()
  }, [user])

  useEffect(() => {
    if (channelId && user) {
      loadMessages(channelId)
      markAsRead(channelId, user.id)

      const subscription = subscribePrivateMessages(channelId, (message) => {
        setMessages((prev) => [...prev, message])
      })

      const readReceipt = subscribeReadReceipts(channelId, (updated) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updated.id ? { ...msg, read_at: updated.read_at } : msg
          )
        )
      })

      return () => {
        subscription.unsubscribe()
        readReceipt.unsubscribe()
      }
    }
  }, [channelId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChannels() {
    setLoading(true)
    setChannelsError(null)
    try {
      const { channels: data, error } = await getUserChannels(user.id)
      if (error) throw new Error(error.message || 'load failed')
      setChannels(data || [])
    } catch {
      setChannelsError("Couldn't load conversations.")
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(cid) {
    setThreadError(null)
    try {
      const { data, error } = await getChannelMessages(cid)
      if (error) throw new Error(error.message || 'load failed')
      setMessages(data || [])
    } catch {
      setThreadError("Couldn't load this conversation.")
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !user || !channelId) return

    setSendError(null)
    try {
      const { data, error } = await sendPrivateMessage(channelId, user.id, newMessage.trim())
      if (error || !data) {
        setSendError("Couldn't send your message. Please try again.")
        return
      }
      setMessages((prev) => [...prev, data])
      setNewMessage('')
    } catch {
      setSendError("Couldn't send your message. Please try again.")
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Conversation list view
  if (!channelId) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <h1 className="chat-title">Messages</h1>
          <p className="chat-subtitle">Private conversations with friends</p>
        </div>

        <div className="chat-channels">
          {loading ? (
            <p className="chat-loading">Loading conversations...</p>
          ) : channelsError ? (
            <div className="chat-error-state" role="alert">
              <p>{channelsError}</p>
              <button className="retry-btn" onClick={loadChannels} type="button">
                Try again
              </button>
            </div>
          ) : channels.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon" aria-hidden="true">📩</span>
              <p>No conversations yet.</p>
              <p className="chat-empty-sub">Visit a friend's profile and start chatting!</p>
            </div>
          ) : (
            channels.map((channel) => (
              <Link
                className={`chat-channel ${channel.unreadCount > 0 ? 'chat-channel--unread' : ''}`}
                key={channel.channelId}
                to={`/messages/${channel.channelId}`}
              >
                <Avatar
                  size={48}
                  username={channel.otherUser?.username || 'user'}
                  url={channel.otherUser?.avatar_url}
                />
                <div className="chat-channel-info">
                  <div className="chat-channel-name">
                    {channel.otherUser?.display_name || channel.otherUser?.username}
                  </div>
                  {channel.lastMessage && (
                    <p className="chat-channel-preview">
                      {channel.lastMessage.message.length > 50
                        ? channel.lastMessage.message.slice(0, 50) + '...'
                        : channel.lastMessage.message}
                    </p>
                  )}
                </div>
                <div className="chat-channel-meta">
                  {channel.lastMessage && (
                    <span className="chat-channel-time">
                      {formatTime(channel.lastMessage.created_at)}
                    </span>
                  )}
                  {channel.unreadCount > 0 && (
                    <span className="chat-channel-badge">{channel.unreadCount}</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    )
  }

  // Individual chat view
  const otherUser = channels.find((c) => c.channelId === channelId)?.otherUser

  return (
    <div className="chat-page">
      <div className="chat-header chat-header--chat">
        <Link className="chat-back" to="/messages">
          ←
        </Link>
        <Avatar
          size={36}
          username={otherUser?.username || 'user'}
          url={otherUser?.avatar_url}
        />
        <div className="chat-header-info">
          <h1 className="chat-title chat-title--small">
            {otherUser?.display_name || otherUser?.username || 'Chat'}
          </h1>
        </div>
      </div>

      <div className="chat-messages">
        {threadError && (
          <div className="chat-error-state" role="alert">
            <p>{threadError}</p>
            <button className="retry-btn" onClick={() => loadMessages(channelId)} type="button">
              Try again
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <div
            className={`chat-message ${msg.sender_id === user?.id ? 'chat-message--own' : ''}`}
            key={msg.id}
          >
            <div className="chat-message-content">
              <p className="chat-message-text">{msg.message}</p>
              <div className="chat-message-footer">
                <span className="chat-message-time">{formatTime(msg.created_at)}</span>
                {msg.sender_id === user?.id && (
                  <span className={`chat-message-read ${msg.read_at ? 'chat-message-read--yes' : ''}`}>
                    {msg.read_at ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          className="chat-input"
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          type="text"
          value={newMessage}
        />
        {sendError && <p className="chat-error" role="alert">{sendError}</p>}
        <button
          className="chat-send-btn"
          disabled={!newMessage.trim()}
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  )
}
