import { useState, useEffect } from 'react'
import { getReadingGoal, setReadingGoal, getBooksFinishedCount } from '../lib/library'

export default function ReadingGoal({ userId }) {
  const year = new Date().getFullYear()
  const [goal, setGoal] = useState(null)
  const [finished, setFinished] = useState(0)
  const [target, setTarget] = useState(12)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function load() {
      const [goalRes, countRes] = await Promise.all([
        getReadingGoal(userId, year),
        getBooksFinishedCount(userId, year),
      ])
      if (goalRes.data) {
        setGoal(goalRes.data)
        setTarget(goalRes.data.target)
      }
      setFinished(countRes.count || 0)
      setLoading(false)
    }
    load()
  }, [userId, year])

  const handleSave = async () => {
    if (target < 1 || target > 100) return
    await setReadingGoal(userId, year, target)
    setGoal({ target })
    setEditing(false)
  }

  if (loading) return null

  const progress = goal ? Math.round((finished / goal.target) * 100) : 0

  return (
    <div className="reading-goal">
      <div className="reading-goal-header">
        <h2 className="reading-goal-title">Reading Goal {year}</h2>
        {!editing && (
          <button
            className="reading-goal-edit"
            onClick={() => setEditing(true)}
            type="button"
          >
            {goal ? 'Edit' : 'Set goal'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="reading-goal-form">
          <label className="reading-goal-label">
            I want to read
            <input
              className="reading-goal-input"
              max="100"
              min="1"
              onChange={(e) => setTarget(parseInt(e.target.value, 10) || 1)}
              type="number"
              value={target}
            />
            books this year
          </label>
          <div className="reading-goal-actions">
            <button className="reading-goal-save" onClick={handleSave} type="button">
              Save
            </button>
            <button
              className="reading-goal-cancel"
              onClick={() => { setEditing(false); if (goal) setTarget(goal.target) }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : goal ? (
        <div className="reading-goal-progress">
          <div className="reading-goal-stats">
            <span className="reading-goal-finished">{finished}</span>
            <span className="reading-goal-of">of</span>
            <span className="reading-goal-target">{goal.target}</span>
            <span className="reading-goal-label">books</span>
          </div>
          <div className="reading-goal-bar">
            <div
              className="reading-goal-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="reading-goal-message">
            {progress >= 100
              ? '🎉 You hit your goal!'
              : progress >= 50
                ? `Keep going! ${goal.target - finished} books to go.`
                : `${finished} down, ${goal.target - finished} to go. You got this!`}
          </p>
        </div>
      ) : (
        <p className="reading-goal-empty">
          Set a reading goal to track your progress this year.
        </p>
      )}
    </div>
  )
}
