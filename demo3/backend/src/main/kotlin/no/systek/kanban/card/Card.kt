package no.systek.kanban.card

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

/**
 * Persistent card. Immutable on purpose: changes are made with `copy()`,
 * e.g. `card.copy(status = CardStatus.DONE)`, and then saved.
 *
 * `id` is null until the row is inserted; Spring Data R2DBC uses that to
 * decide between INSERT and UPDATE.
 *
 * `@Table` without a name maps to CARD. Spring Data Relational 4 quotes explicit
 * names exactly as written, so `@Table("card")` would look for a lower-case table
 * that H2 (which upper-cases unquoted DDL names) does not have.
 */
@Table
data class Card(
    @Id val id: Long? = null,
    val title: String,
    val assignee: String? = null,
    val priority: Priority = Priority.MEDIUM,
    val status: CardStatus = CardStatus.TODO,
    val createdAt: LocalDateTime = LocalDateTime.now(),
)
