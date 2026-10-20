import { ApiError } from '../errors'
import type { Booking, LocalDateTime } from './booking'

/** What the API sends and receives. Kept separate from the row type so the DB shape can change freely. */
export interface BookingDto {
  id?: number
  roomId: number
  title: string
  bookedBy: string
  start: LocalDateTime
  end: LocalDateTime
}

export const toDto = (booking: Booking): BookingDto => ({
  id: booking.id,
  roomId: booking.room_id,
  title: booking.title,
  bookedBy: booking.booked_by,
  start: booking.start_time,
  end: booking.end_time,
})

/** Checks the shape of a request body. TypeScript types vanish at runtime, so someone has to. */
export function parseBookingDto(body: unknown): BookingDto {
  const b = (body ?? {}) as Record<string, unknown>
  if (typeof b.roomId !== 'number') throw new ApiError(400, 'roomId must be a number')
  if (typeof b.title !== 'string') throw new ApiError(400, 'title must be a string')
  if (typeof b.bookedBy !== 'string') throw new ApiError(400, 'bookedBy must be a string')

  return {
    roomId: b.roomId,
    title: b.title,
    bookedBy: b.bookedBy,
    start: toLocalDateTime(b.start, 'start'),
    end: toLocalDateTime(b.end, 'end'),
  }
}

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

/** Normalises an ISO date-time string to the "YYYY-MM-DDTHH:mm:ss" format we store. */
function toLocalDateTime(value: unknown, field: string): LocalDateTime {
  if (typeof value !== 'string' || !ISO_DATE_TIME.test(value)) {
    throw new ApiError(400, `${field} must be an ISO date-time`)
  }
  // "2026-10-14T09:00" -> "2026-10-14T09:00:00", "2026-10-14T09:00:00.000" -> "2026-10-14T09:00:00"
  return value.length === 16 ? `${value}:00` : value.slice(0, 19)
}
