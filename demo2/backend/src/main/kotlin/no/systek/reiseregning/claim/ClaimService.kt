package no.systek.reiseregning.claim

import no.systek.reiseregning.calc.ExpenseCalculator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.util.function.component1
import reactor.kotlin.core.util.function.component2
import java.time.Instant

class ClaimNotFoundException(id: Long) : RuntimeException("Claim $id not found")

@Service
class ClaimService(
    private val claims: ClaimRepository,
    private val lines: ClaimLineRepository,
    private val calculator: ExpenseCalculator,
) {

    fun listClaims(): Flux<ClaimDto> =
        claims.findAllByOrderByCreatedAtDesc()
            // concatMap (not flatMap) keeps the list in the same order as the query.
            .concatMap { claim -> withLines(claim) }

    // zipWith waits for both queries and pairs the results in a Tuple2 (destructured below).
    // collectList turns the Flux of lines into a single Mono<List>, so the shapes match.
    // If the claim doesn't exist, findById is empty, the zip is empty, and switchIfEmpty kicks in.
    fun getClaim(id: Long): Mono<ClaimDto> =
        claims.findById(id)
            .zipWith(lines.findByClaimIdOrderById(id).collectList())
            .map { (claim, claimLines) -> toDto(claim, claimLines) }
            .switchIfEmpty(Mono.error(ClaimNotFoundException(id)))

    @Transactional
    fun createClaim(request: NewClaimRequest): Mono<ClaimDto> =
        claims.save(request.toEntity())
            .flatMap { claim ->
                val claimId = requireNotNull(claim.id)
                lines.saveAll(request.lines.map { it.toEntity(claimId) })
                    .collectList()
                    .map { savedLines -> toDto(claim, savedLines) }
            }

    fun performAction(id: Long, action: String, request: ClaimActionRequest): Mono<ClaimDto> =
        claims.findById(id)
            .switchIfEmpty(Mono.error(ClaimNotFoundException(id)))
            .map { claim -> transition(claim, action, request.actor, request.reason) }
            .flatMap { claims.save(it) }
            .flatMap { getClaim(id) }

    fun transition(claim: Claim, action: String, actor: String, reason: String?): Claim {
        if (action == "submit") {
            if (claim.status == ClaimStatus.DRAFT || claim.status == ClaimStatus.REJECTED) {
                if (actor == claim.employee) {
                    return claim.copy(
                        status = ClaimStatus.SUBMITTED,
                        submittedAt = Instant.now(),
                        rejectionReason = null,
                    )
                } else {
                    throw IllegalStateException("Only ${claim.employee} can submit this claim")
                }
            } else {
                throw IllegalStateException("Cannot submit a claim with status ${claim.status}")
            }
        } else if (action == "approve" || action == "reject") {
            if (claim.status != ClaimStatus.SUBMITTED) {
                throw IllegalStateException("Cannot $action a claim with status ${claim.status}")
            }
            if (actor == claim.employee) {
                throw IllegalStateException("You cannot $action your own claim")
            }
            if (action == "reject") {
                if (reason == null || reason.isBlank()) {
                    throw IllegalArgumentException("A reason is required when rejecting")
                }
                return claim.copy(
                    status = ClaimStatus.REJECTED,
                    decidedBy = actor,
                    decidedAt = Instant.now(),
                    rejectionReason = reason,
                )
            } else {
                return claim.copy(
                    status = ClaimStatus.APPROVED,
                    decidedBy = actor,
                    decidedAt = Instant.now(),
                )
            }
        } else {
            throw IllegalArgumentException("Unknown action: $action")
        }
    }

    private fun withLines(claim: Claim): Mono<ClaimDto> =
        lines.findByClaimIdOrderById(requireNotNull(claim.id))
            .collectList()
            .map { claimLines -> toDto(claim, claimLines) }

    private fun toDto(claim: Claim, claimLines: List<ClaimLine>): ClaimDto {
        val lineAmounts = claimLines.map { calculator.calculateLine(it) }
        val lineDtos = claimLines.zip(lineAmounts) { line, amounts -> line.toDto(amounts) }
        return claim.toDto(lineDtos, calculator.calculateTotals(lineAmounts))
    }
}
