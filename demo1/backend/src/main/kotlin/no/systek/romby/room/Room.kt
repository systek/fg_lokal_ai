package no.systek.romby.room

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

@Table("room")
data class Room(
    // Null until saved; the database generates the id.
    @Id val id: Long? = null,
    val name: String,
    val floor: Int,
    val capacity: Int,
)
