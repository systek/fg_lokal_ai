package no.systek.kanban.card

import java.time.LocalDateTime

/** What the API returns. Kept separate from [Card] so the DB model can change freely. */
data class CardDto(
    val id: Long,
    val title: String,
    val assignee: String?,
    val priority: Priority,
    val status: CardStatus,
    val createdAt: LocalDateTime,
)

data class CreateCardRequest(
    val title: String?,
    val assignee: String? = null,
    val priority: Priority? = null,
)

data class MoveCardRequest(
    val status: CardStatus,
)

/** One page of results plus the numbers a pager needs. */
data class PageDto<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

fun Card.toDto() = CardDto(
    id = requireNotNull(id) { "Card must be saved before it is exposed" },
    title = title,
    assignee = assignee,
    priority = priority,
    status = status,
    createdAt = createdAt,
)
