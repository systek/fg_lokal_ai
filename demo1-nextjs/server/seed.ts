import type { DatabaseSync } from 'node:sqlite'
import type { LocalDateTime } from './bookings/booking'

/** Fills a fresh database. Runs once, the first time the database is used. */
export function seed(db: DatabaseSync) {
  const insertRoom = db.prepare('INSERT INTO room (name, floor, capacity) VALUES (?, ?, ?)')
  insertRoom.run('Fjorden', 2, 8)
  insertRoom.run('Vidda', 2, 4)
  insertRoom.run('Skogen', 3, 12)
  insertRoom.run('Telefonboksen', 3, 1)

  // Seed bookings relative to Monday of the current week, so the calendar is never empty.
  // getDay(): Sunday = 0, Monday = 1 ... shift so Monday is the first day of the week.
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

  const at = (day: number, hour: number): LocalDateTime => {
    const d = new Date(monday)
    d.setDate(d.getDate() + day)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00:00`
  }

  const insertBooking = db.prepare(
    'INSERT INTO booking (room_id, title, booked_by, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
  )
  insertBooking.run(1, 'Sprint planning', 'Kari', at(0, 9), at(0, 10))
  insertBooking.run(1, 'Arkitekturmøte', 'Ola', at(1, 13), at(1, 15))
  insertBooking.run(2, '1:1 Kari/Per', 'Per', at(2, 10), at(2, 11))
  insertBooking.run(3, 'Demo for kunde', 'Lise', at(3, 9), at(3, 12))
  insertBooking.run(3, 'Fredagslunsj', 'Ola', at(4, 11), at(4, 12))
}
