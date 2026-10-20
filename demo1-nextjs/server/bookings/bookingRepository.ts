import { db, queryAll, queryOne } from '../db'
import type { Booking } from './booking'

// Plain SQL, kept in one place. node:sqlite is synchronous, so these return values, not promises.
export const bookingRepository = {
  findAll: () => queryAll<Booking>('SELECT * FROM booking'),

  findByRoomId: (roomId: number) => queryAll<Booking>('SELECT * FROM booking WHERE room_id = ?', roomId),

  save: (booking: Omit<Booking, 'id'>) =>
    queryOne<Booking>(
      `INSERT INTO booking (room_id, title, booked_by, start_time, end_time)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
      booking.room_id,
      booking.title,
      booking.booked_by,
      booking.start_time,
      booking.end_time,
    )!,

  deleteById: (id: number) => {
    db().prepare('DELETE FROM booking WHERE id = ?').run(id)
  },
}
