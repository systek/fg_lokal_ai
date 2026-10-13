package no.systek.romby.booking

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux

// Spring Data derives the SQL from the method name; no implementation needed.
interface BookingRepository : ReactiveCrudRepository<Booking, Long> {

    fun findByRoomId(roomId: Long): Flux<Booking>
}
