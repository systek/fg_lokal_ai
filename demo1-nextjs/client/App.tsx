'use client'

import { useCallback, useEffect, useState } from 'react'
import { deleteBooking, fetchBookings, type Booking } from './api'
import { useRooms } from './hooks'
import { RoomList } from './components/RoomList'
import { WeekCalendar } from './components/WeekCalendar'
import { BookingForm } from './components/BookingForm'

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // getDay(): Sunday = 0, Monday = 1 ... shift so Monday is the first day of the week.
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export default function App() {
  const { rooms, error: roomsError } = useRooms()
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  const loadBookings = useCallback(() => {
    if (selectedRoomId == null) return
    fetchBookings(selectedRoomId)
      .then(setBookings)
      .catch((e: Error) => setBookingsError(e.message))
  }, [selectedRoomId])

  useEffect(loadBookings, [loadBookings])

  // Select the first room once rooms have loaded.
  useEffect(() => {
    if (selectedRoomId == null && rooms.length > 0) setSelectedRoomId(rooms[0].id)
  }, [rooms, selectedRoomId])

  const shiftWeek = (weeks: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + weeks * 7)
    setWeekStart(d)
  }

  const handleDelete = async (id: number) => {
    await deleteBooking(id)
    loadBookings()
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

  return (
    <div className="app">
      <header>
        <h1>Romby</h1>
        <span>Booking av møterom</span>
      </header>

      {(roomsError || bookingsError) && <p className="error">{roomsError ?? bookingsError}</p>}

      <main>
        <aside>
          <h2>Rom</h2>
          <RoomList rooms={rooms} selectedId={selectedRoomId} onSelect={setSelectedRoomId} />
          {selectedRoomId != null && <BookingForm roomId={selectedRoomId} onCreated={loadBookings} />}
        </aside>

        <section>
          <div className="week-nav">
            <button onClick={() => shiftWeek(-1)}>‹ Forrige</button>
            <h2>
              {selectedRoom?.name ?? '…'} · uke fra {weekStart.toLocaleDateString('nb-NO')}
            </h2>
            <button onClick={() => shiftWeek(1)}>Neste ›</button>
          </div>
          <WeekCalendar weekStart={weekStart} bookings={bookings} onDelete={handleDelete} />
        </section>
      </main>
    </div>
  )
}
