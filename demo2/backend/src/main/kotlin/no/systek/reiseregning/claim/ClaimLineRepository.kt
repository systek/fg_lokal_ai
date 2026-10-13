package no.systek.reiseregning.claim

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux

interface ClaimLineRepository : ReactiveCrudRepository<ClaimLine, Long> {
    // Derived query: Spring Data generates "SELECT ... WHERE claim_id = ? ORDER BY id" from the method name.
    fun findByClaimIdOrderById(claimId: Long): Flux<ClaimLine>
}
