import { useState, type FormEvent } from 'react'
import { createBooking, type Booking } from '../api'

interface Props {
  roomId: number
  onCreated: (booking: Booking) => void
}

export function BookingForm({ roomId, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [bookedBy, setBookedBy] = useState('')
  // <input type="datetime-local"> gives values like "2026-10-13T09:00".
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const created = await createBooking({
        roomId,
        title,
        bookedBy,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      })
      onCreated(created)
      setTitle('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>Ny booking</h3>
      <label>
        Tittel
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Booket av
        <input value={bookedBy} onChange={(e) => setBookedBy(e.target.value)} required />
      </label>
      <label>
        Fra
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <label>
        Til
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </label>
      <button type="submit">Book rom</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
