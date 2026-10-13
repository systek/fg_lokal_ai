import { useState } from 'react'
import { createCard } from './api'
import type { Priority } from './types'

export default function NewCardForm() {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // No local state update: the CREATED event comes back over SSE and the Board adds it
      await createCard({ title, assignee: assignee || undefined, priority })
      setTitle('')
      setAssignee('')
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form className="new-card" onSubmit={onSubmit}>
      <input placeholder="New card title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
      <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
      <button type="submit">Add</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
