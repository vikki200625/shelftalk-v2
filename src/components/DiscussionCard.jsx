import { Link } from 'react-router'

export default function DiscussionCard({ discussion, clubId }) {
  const date = new Date(discussion.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="discussion-card">
      <h4 className="discussion-card-title">{discussion.title}</h4>
      <p className="discussion-card-body">{discussion.body}</p>
      <div className="discussion-card-meta">
        <Link
          className="discussion-card-author"
          to={`/profile/${discussion.username}`}
        >
          {discussion.username}
        </Link>
        <span className="discussion-card-date">{date}</span>
      </div>
    </div>
  )
}
