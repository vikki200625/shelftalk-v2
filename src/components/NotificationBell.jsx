import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import supabase from '../lib/supabase'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  subscribeNotifications,
} from '../lib/notifications'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}

/** Where a notification click should land. */
function targetFor(notification) {
  if (notification.type === 'follow' && notification.actor_username) {
    return `/profile/${notification.actor_username}`
  }
  if (notification.type === 'club_discussion' && notification.club_id) {
    return `/clubs/${notification.club_id}`
  }
  return null
}

/**
 * NotificationBell — bell button with unread badge and a dropdown of
 * the last 20 notifications. Live-updates via Supabase Realtime.
 */
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [attempt, setAttempt] = useState(0)

  const bellRef = useRef(null)

  // Close dropdown when clicking outside (same pattern as profile dropdown)
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [rows, count] = await Promise.all([
        getNotifications(user.id),
        getUnreadCount(user.id),
      ])
      setItems(rows)
      setUnread(count)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [user.id])

  // Initial load + realtime subscription for this user
  useEffect(() => {
    load()

    const channel = subscribeNotifications(user.id, () => {
      // New notification arrived — refresh count and list.
      load()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, attempt])

  async function handleItemClick(notification) {
    setOpen(false)
    if (!notification.read) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
      setUnread((prev) => Math.max(0, prev - 1))
      try {
        await markAsRead(notification.id)
      } catch {
        // optimistic update stands; next load reconciles
      }
    }
    const to = targetFor(notification)
    if (to) navigate(to)
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    try {
      await markAllRead(user.id)
    } catch {
      // optimistic; next load reconciles
    }
  }

  function toggle() {
    setOpen((o) => !o)
  }

  return (
    <div className="nav-bell" ref={bellRef}>
      <button
        className="nav-bell-btn"
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        onClick={toggle}
      >
        <svg
          fill="none"
          height="22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="22"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="nav-bell-badge" aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="nav-bell-dropdown" role="region" aria-label="Notifications list">
          <div className="nav-bell-head">
            <span className="nav-bell-title">Notifications</span>
            {unread > 0 && (
              <button className="nav-bell-markall" type="button" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {status === 'error' && (
            <p className="nav-bell-empty">
              Couldn&apos;t load notifications.{' '}
              <button className="nav-bell-retry" type="button" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </button>
            </p>
          )}

          {status !== 'error' && items.length === 0 && (
            <p className="nav-bell-empty">No notifications yet.</p>
          )}

          {items.length > 0 && (
            <ul className="nav-bell-list">
              {items.map((n) => {
                const to = targetFor(n)
                const body = (
                  <>
                    {!n.read && <span className="nav-bell-dot" aria-label="Unread" />}
                    <span className="nav-bell-message">{n.message}</span>
                    <span className="nav-bell-time">{timeAgo(n.created_at)}</span>
                  </>
                )
                return (
                  <li key={n.id}>
                    {to ? (
                      <button
                        className={`nav-bell-item${n.read ? '' : ' nav-bell-item--unread'}`}
                        type="button"
                        onClick={() => handleItemClick(n)}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className={`nav-bell-item${n.read ? '' : ' nav-bell-item--unread'}`}>
                        {body}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
