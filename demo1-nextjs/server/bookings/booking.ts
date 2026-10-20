/** Wall-clock time without a zone, always "YYYY-MM-DDTHH:mm:ss" (like Java's LocalDateTime). */
export type LocalDateTime = string

/** A row in the booking table. Column names are snake_case, as in the database. */
export interface Booking {
  id: number
  room_id: number
  title: string
  booked_by: string
  start_time: LocalDateTime
  end_time: LocalDateTime
}

/**
 * True if the half-open intervals [aStart, aEnd) and [bStart, bEnd) share any time.
 * Half-open means back-to-back meetings (one ends 10:00, next starts 10:00) do not overlap.
 * Timestamps in the fixed "YYYY-MM-DDTHH:mm:ss" format sort correctly as plain strings.
 */
export function overlaps(aStart: LocalDateTime, aEnd: LocalDateTime, bStart: LocalDateTime, bEnd: LocalDateTime) {
  return aStart < bEnd && bStart < aEnd
}
