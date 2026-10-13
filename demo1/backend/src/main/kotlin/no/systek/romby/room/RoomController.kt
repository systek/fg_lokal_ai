package no.systek.romby.room

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/rooms")
class RoomController(private val roomRepository: RoomRepository) {

    @GetMapping
    fun all(): Flux<Room> = roomRepository.findAll()

    @GetMapping("/{id}")
    fun byId(@PathVariable id: Long): Mono<Room> =
        roomRepository.findById(id)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Room $id not found")))
}
