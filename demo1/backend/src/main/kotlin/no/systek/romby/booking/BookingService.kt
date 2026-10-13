package no.systek.romby.booking

import no.systek.romby.room.RoomRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.Duration

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val roomRepository: RoomRepository,
) {

    fun all(): Flux<BookingDto> = bookingRepository.findAll().map { it.toDto() }

    fun forRoom(roomId: Long): Flux<BookingDto> = bookingRepository.findByRoomId(roomId).map { it.toDto() }

    fun create(dto: BookingDto): Mono<BookingDto> {
        val error = validate(dto)
        if (error != null) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, error))
        }

        // Nothing runs until someone subscribes (WebFlux does that when it writes the response).
        return roomRepository.findById(dto.roomId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Room ${dto.roomId} not found")))
            .flatMap { room ->
                bookingRepository.findByRoomId(room.id!!)
                    .filter { existing -> overlaps(existing.start, existing.end, dto.start, dto.end) }
                    .hasElements()
            }
            .flatMap { hasConflict ->
                if (hasConflict) {
                    Mono.error(ResponseStatusException(HttpStatus.CONFLICT, "Room is already booked in that period"))
                } else {
                    bookingRepository.save(
                        Booking(
                            roomId = dto.roomId,
                            title = dto.title,
                            bookedBy = dto.bookedBy,
                            start = dto.start,
                            end = dto.end,
                        )
                    )
                }
            }
            .map { it.toDto() }
    }

    fun delete(id: Long): Mono<Void> = bookingRepository.deleteById(id)

    /** Returns an error message, or null if the booking is valid. */
    fun validate(dto: BookingDto): String? {
        if (dto.title.isNotBlank()) {
            if (dto.bookedBy.isNotBlank()) {
                if (dto.end.isAfter(dto.start)) {
                    if (Duration.between(dto.start, dto.end) <= MAX_DURATION) {
                        if (dto.start.toLocalDate() == dto.end.toLocalDate()) {
                            return null
                        } else {
                            return "A booking must start and end on the same day"
                        }
                    } else {
                        return "A booking can be at most ${MAX_DURATION.toHours()} hours"
                    }
                } else {
                    return "End must be after start"
                }
            } else {
                return "Booked by is required"
            }
        } else {
            return "Title is required"
        }
    }

    companion object {
        val MAX_DURATION: Duration = Duration.ofHours(4)
    }
}
