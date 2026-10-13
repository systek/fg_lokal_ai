package no.systek.kanban.card

import no.systek.kanban.events.BoardEvent
import no.systek.kanban.events.BoardEventBus
import no.systek.kanban.events.BoardEventType
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.time.LocalDateTime
import kotlin.math.ceil

@RestController
@RequestMapping("/api/cards")
class CardController(
    private val repository: CardRepository,
    private val eventBus: BoardEventBus,
) {

    /** All cards, for the board view. The board is small, so no paging here. */
    @GetMapping
    fun all(): Flux<CardDto> = repository.findAll().map { it.toDto() }

    @GetMapping("/{id}")
    fun one(@PathVariable id: Long): Mono<CardDto> =
        repository.findById(id)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Card $id not found")))
            .map { it.toDto() }

    /** Paginated backlog, oldest first, optionally filtered on title. */
    @GetMapping("/backlog")
    fun backlog(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(required = false) q: String?,
    ): Mono<PageDto<CardDto>> {
        if (page < 0) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be >= 0")
        if (size !in 1..100) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "size must be between 1 and 100")

        val pageable = PageRequest.of(page, size, Sort.by("createdAt"))
        val filter = q?.trim().orEmpty()

        val cards = if (filter.isEmpty()) repository.findAllBy(pageable)
                    else repository.findByTitleContainingIgnoreCase(filter, pageable)
        val total = if (filter.isEmpty()) repository.count()
                    else repository.countByTitleContainingIgnoreCase(filter)

        // Run the page query and the count query, then combine them into one response
        return Mono.zip(cards.map { it.toDto() }.collectList(), total)
            .map { (content, totalElements) ->
                PageDto(
                    content = content,
                    page = page,
                    size = size,
                    totalElements = totalElements,
                    totalPages = ceil(totalElements.toDouble() / size).toInt(),
                )
            }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CreateCardRequest): Mono<CardDto> {
        val title = request.title?.trim()
        if (title.isNullOrEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required")
        }
        if (title.length > 100) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "title must be at most 100 characters")
        }
        val assignee = request.assignee?.trim()?.takeIf { it.isNotEmpty() }
        if (assignee != null && assignee.length > 50) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "assignee must be at most 50 characters")
        }

        val card = Card(
            title = title,
            assignee = assignee,
            priority = request.priority ?: Priority.MEDIUM,
            status = CardStatus.TODO,
            createdAt = LocalDateTime.now(),
        )

        return repository.save(card)
            .map { it.toDto() }
            .doOnNext { eventBus.publish(BoardEvent(BoardEventType.CREATED, it)) }
    }

    /** Move a card to another column (used by drag-and-drop on the board). */
    @PatchMapping("/{id}/move")
    fun move(@PathVariable id: Long, @RequestBody request: MoveCardRequest): Mono<CardDto> =
        repository.findById(id)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Card $id not found")))
            .flatMap { card ->
                if (card.status == request.status) Mono.just(card)
                else repository.save(card.copy(status = request.status))
            }
            .map { it.toDto() }
            .doOnNext { eventBus.publish(BoardEvent(BoardEventType.MOVED, it)) }

    // TODO: PUT /api/cards/{id} to edit title, assignee and priority
    // TODO: DELETE /api/cards/{id}
}
