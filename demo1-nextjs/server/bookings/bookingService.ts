import { ApiError } from '../errors'
import { roomRepository } from '../rooms/roomRepository'
import { overlaps } from './booking'
import { type BookingDto, toDto } from './bookingDto'
import { bookingRepository } from './bookingRepository'

const MAX_DURATION_HOURS = 4

export const bookingService = {
  all: () => bookingRepository.findAll().map(toDto),

  forRoom: (roomId: number) => bookingRepository.findByRoomId(roomId).map(toDto),

  create(dto: BookingDto): BookingDto {
    const error = bookingService.validate(dto)
    if (error != null) {
      throw new ApiError(400, error)
    }

    const room = roomRepository.findById(dto.roomId)
    if (!room) {
      throw new ApiError(404, `Room ${dto.roomId} not found`)
    }

    const hasConflict = bookingRepository
      .findByRoomId(room.id)
      .some((existing) => overlaps(existing.start_time, existing.end_time, dto.start, dto.end))
    if (hasConflict) {
      throw new ApiError(409, 'Room is already booked in that period')
    }

    const saved = bookingRepository.save({
      room_id: dto.roomId,
      title: dto.title,
      booked_by: dto.bookedBy,
      start_time: dto.start,
      end_time: dto.end,
    })
    return toDto(saved)
  },

  delete: (id: number) => bookingRepository.deleteById(id),

  /** Returns an error message, or null if the booking is valid. */
  validate(dto: BookingDto): string | null {
    if (dto.title.trim() !== '') {
      if (dto.bookedBy.trim() !== '') {
        if (dto.end > dto.start) {
          // Both are wall-clock times, so parsing both as local time gives the right difference.
          const hours = (new Date(dto.end).getTime() - new Date(dto.start).getTime()) / 3_600_000
          if (hours <= MAX_DURATION_HOURS) {
            if (dto.start.slice(0, 10) === dto.end.slice(0, 10)) {
              return null
            } else {
              return 'A booking must start and end on the same day'
            }
          } else {
            return `A booking can be at most ${MAX_DURATION_HOURS} hours`
          }
        } else {
          return 'End must be after start'
        }
      } else {
        return 'Booked by is required'
      }
    } else {
      return 'Title is required'
    }
  },
}
