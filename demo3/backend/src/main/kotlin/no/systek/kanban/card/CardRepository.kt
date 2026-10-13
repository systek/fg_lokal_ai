package no.systek.kanban.card

import org.springframework.data.domain.Pageable
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * Reactive repository. Note that R2DBC repositories cannot return `Page<T>`:
 * a `Pageable` parameter is turned into LIMIT/OFFSET + ORDER BY, and the total
 * has to be fetched with a separate count query.
 */
interface CardRepository : ReactiveCrudRepository<Card, Long> {

    fun findAllBy(pageable: Pageable): Flux<Card>

    fun findByTitleContainingIgnoreCase(title: String, pageable: Pageable): Flux<Card>

    fun countByTitleContainingIgnoreCase(title: String): Mono<Long>
}
