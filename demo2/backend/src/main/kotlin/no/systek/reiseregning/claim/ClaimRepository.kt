package no.systek.reiseregning.claim

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux

interface ClaimRepository : ReactiveCrudRepository<Claim, Long> {
    fun findAllByOrderByCreatedAtDesc(): Flux<Claim>
}
