package no.systek.romby.booking

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("booking")
data class Booking(
    @Id val id: Long? = null,
    val roomId: Long,
    val title: String,
    val bookedBy: String,
    @Column("start_time") val start: LocalDateTime,
    @Column("end_time") val end: LocalDateTime,
)

/**
 * True if the half-open intervals [aStart, aEnd) and [bStart, bEnd) share any time.
 * Half-open means back-to-back meetings (one ends 10:00, next starts 10:00) do not overlap.
 */
fun overlaps(
    aStart: LocalDateTime,
    aEnd: LocalDateTime,
    bStart: LocalDateTime,
    bEnd: LocalDateTime,
): Boolean = aStart < bEnd && bStart < aEnd
