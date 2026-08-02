import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendGlobalMessage, getGlobalMessages, subscribeGlobalMessages } from '../lib/chat'
import Avatar from '../components/Avatar'

export default function GlobalChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const [userNames, setUserNames] = useState({})

  useEffect(() => {
    loadMessages()
    const subscription = subscribeGlobalMessages((message) => {
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
    const { data } = await getGlobalMessages(100)
    setMessages(data || [])
    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const { data, error } = await sendGlobalMessage(user.id, newMessage.trim())
    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setNewMessage('')
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
                username={msg.user_id === user?.id ? (user.email?.split('@')[0] || 'user') : 'other'}
              />
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className="chat-message-user">
                    {msg.user_id === user?.id ? 'You' : 'User'}
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
