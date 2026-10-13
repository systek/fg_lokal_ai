package no.systek.kanban.events

import no.systek.kanban.card.CardDto

enum class BoardEventType { CREATED, MOVED, UPDATED, DELETED }

/** Pushed to every open browser tab so boards stay in sync without polling. */
data class BoardEvent(
    val type: BoardEventType,
    val card: CardDto,
)
