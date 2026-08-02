import { Link } from 'react-router'
import Avatar from './Avatar'
import FollowButton from './FollowButton'

export default function UserCard({ user, currentUserId, onFollowChange }) {
  return (
    <div className="user-card">
      <Link className="user-card-link" to={`/profile/${user.username}`}>
        <Avatar username={user.username} size={48} url={user.avatar_url} />
        <div className="user-card-info">
          <span className="user-card-name">
            {user.display_name || user.username}
          </span>
          <span className="user-card-username">@{user.username}</span>
          {user.bio && (
            <span className="user-card-bio">
              {user.bio.length > 80 ? user.bio.slice(0, 80) + '...' : user.bio}
            </span>
          )}
        </div>
      </Link>
      {currentUserId && currentUserId !== user.id && (
        <FollowButton
          currentUserId={currentUserId}
          targetUserId={user.id}
          onChange={onFollowChange}
        />
      )}
    </div>
  )
}
