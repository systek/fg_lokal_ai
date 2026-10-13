package no.systek.romby.booking

import java.time.LocalDateTime

/** What the API sends and receives. Kept separate from the entity so the DB shape can change freely. */
data class BookingDto(
    val id: Long? = null,
    val roomId: Long,
    val title: String,
    val bookedBy: String,
    val start: LocalDateTime,
    val end: LocalDateTime,
)

fun Booking.toDto() = BookingDto(
    id = id,
    roomId = roomId,
    title = title,
    bookedBy = bookedBy,
    start = start,
    end = end,
)
