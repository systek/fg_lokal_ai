package no.systek.reiseregning.claim

import no.systek.reiseregning.calc.ClaimTotals
import no.systek.reiseregning.calc.LineAmounts
import java.time.Instant

// ---- Requests (JSON in) ----

data class NewClaimLineRequest(
    val category: ExpenseCategory,
    val description: String,
    val amount: Double,
)

data class NewClaimRequest(
    val employee: String,
    val purpose: String,
    val lines: List<NewClaimLineRequest>,
)

/** Who is performing a status change, and (for rejections) why. */
data class ClaimActionRequest(
    val actor: String,
    val reason: String? = null,
)

// ---- Responses (JSON out) ----

data class ClaimLineDto(
    val id: Long,
    val category: ExpenseCategory,
    val description: String,
    val amount: Double,
    val net: Double,
    val vat: Double,
    val gross: Double,
)

data class ClaimDto(
    val id: Long,
    val employee: String,
    val purpose: String,
    val status: ClaimStatus,
    val createdAt: Instant,
    val submittedAt: Instant?,
    val decidedBy: String?,
    val decidedAt: Instant?,
    val rejectionReason: String?,
    val lines: List<ClaimLineDto>,
    val totalNet: Double,
    val totalVat: Double,
    val total: Double,
)

/** Lightweight version for the list view: no lines, just the total. */
data class ClaimSummaryDto(
    val id: Long,
    val employee: String,
    val purpose: String,
    val status: ClaimStatus,
    val createdAt: Instant,
    val total: Double,
)

// ---- Mappers ----
// Extension functions keep the entities free of API concerns.

fun NewClaimRequest.toEntity(): Claim =
    Claim(employee = employee, purpose = purpose)

fun NewClaimLineRequest.toEntity(claimId: Long): ClaimLine =
    ClaimLine(claimId = claimId, category = category, description = description, amount = amount)

// requireNotNull: entities loaded from the database always have an id.
fun ClaimLine.toDto(amounts: LineAmounts): ClaimLineDto =
    ClaimLineDto(
        id = requireNotNull(id),
        category = category,
        description = description,
        amount = amount,
        net = amounts.net,
        vat = amounts.vat,
        gross = amounts.gross,
    )

fun Claim.toDto(lines: List<ClaimLineDto>, totals: ClaimTotals): ClaimDto =
    ClaimDto(
        id = requireNotNull(id),
        employee = employee,
        purpose = purpose,
        status = status,
        createdAt = createdAt,
        submittedAt = submittedAt,
        decidedBy = decidedBy,
        decidedAt = decidedAt,
        rejectionReason = rejectionReason,
        lines = lines,
        totalNet = totals.net,
        totalVat = totals.vat,
        total = totals.gross,
    )
