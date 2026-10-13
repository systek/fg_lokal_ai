package no.systek.romby.room

import org.springframework.data.repository.reactive.ReactiveCrudRepository

interface RoomRepository : ReactiveCrudRepository<Room, Long>
