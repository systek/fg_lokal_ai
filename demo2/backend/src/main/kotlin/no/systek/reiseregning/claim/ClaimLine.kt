package no.systek.reiseregning.claim

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

/**
 * One line on a claim.
 *
 * [amount] is in the category's [AmountUnit]: NOK incl. VAT for receipts,
 * kilometres for mileage, days for per diem.
 *
 * R2DBC has no relationship mapping (no @OneToMany like JPA), so the line just
 * stores the id of its claim and we load lines with a separate query.
 */
// Table name derived from the class name: ClaimLine -> CLAIM_LINE.
@Table
data class ClaimLine(
    @Id val id: Long? = null,
    val claimId: Long,
    val category: ExpenseCategory,
    val description: String,
    val amount: Double,
)
