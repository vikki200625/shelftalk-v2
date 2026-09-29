import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendGlobalMessage, getGlobalMessages, subscribeGlobalMessages } from '../lib/chat'
import supabase from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function GlobalChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const messagesEndRef = useRef(null)
  const [userNames, setUserNames] = useState({})

  // Realtime payloads carry no profile embed — resolve the sender's
  // username once and cache it so the label doesn't stay a fallback.
  async function resolveUsername(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
    if (data?.username) {
      setUserNames((prev) => ({ ...prev, [userId]: data.username }))
    }
  }

  useEffect(() => {
    loadMessages()
    const subscription = subscribeGlobalMessages((message) => {
      if (message.user_id !== user?.id && !message.profiles) {
        resolveUsername(message.user_id)
      }
      setMessages((prev) => [...prev, message])
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error: loadErr } = await getGlobalMessages(100)
      if (loadErr) throw new Error(loadErr.message)
      setMessages(data || [])
    } catch {
      setLoadError("Couldn't load messages.")
    } finally {
      setLoading(false)
    }
  }

  function displayName(msg) {
    if (msg.user_id === user?.id) return 'You'
    return msg.profiles?.username || userNames[msg.user_id] || 'Reader'
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const text = newMessage.trim()
    setNewMessage('')
    setError(null)

    try {
      const { data, error } = await sendGlobalMessage(user.id, text)
      if (error) {
        setError(error.message || 'Failed to send message')
        setNewMessage(text)
        return
      }
      if (data) {
        setMessages((prev) => [...prev, data])
      }
    } catch (err) {
      console.error('Chat send error:', err)
      setError('Failed to send message. Please try again.')
      setNewMessage(text)
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

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1 className="chat-title">Global Chat</h1>
        <p className="chat-subtitle">Chat with everyone in the community</p>
      </div>

      <div className="chat-messages">
        {loading ? (
          <p className="chat-loading">Loading messages...</p>
        ) : loadError ? (
          <div className="chat-error-state" role="alert">
            <p>{loadError}</p>
            <button className="retry-btn" onClick={loadMessages} type="button">
              Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty-icon" aria-hidden="true">💬</span>
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              className={`chat-message ${msg.user_id === user?.id ? 'chat-message--own' : ''}`}
              key={msg.id}
            >
              <Avatar
                size={32}
                username={displayName(msg) === 'You' ? (user?.email?.split('@')[0] || 'you') : displayName(msg)}
              />
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className="chat-message-user">
                    {displayName(msg)}
                  </span>
                  <span className="chat-message-time">{formatTime(msg.created_at)}</span>
                </div>
                <p className="chat-message-text">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {user ? (
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            className="chat-input"
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            type="text"
            value={newMessage}
          />
          {error && <p className="chat-error">{error}</p>}
          <button
            className="chat-send-btn"
            disabled={!newMessage.trim()}
            type="submit"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="chat-signin">
          <p>Sign in to join the conversation</p>
        </div>
      )}
    </div>
  )
}
