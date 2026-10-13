package no.systek.reiseregning.claim

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * A travel expense claim (reiseregning).
 *
 * Immutable data class: state changes are made with copy(), and the result is saved.
 * Spring Data R2DBC treats a null id as "new row" and lets the database generate it.
 */
// No explicit name: Spring Data derives CLAIM from the class name, matching H2's upper-cased
// unquoted identifiers. An explicit @Table("claim") would be quoted as-is and not found.
@Table
data class Claim(
    @Id val id: Long? = null,
    val employee: String,
    val purpose: String,
    val status: ClaimStatus = ClaimStatus.DRAFT,
    val createdAt: Instant = Instant.now(),
    val submittedAt: Instant? = null,
    val decidedBy: String? = null,
    val decidedAt: Instant? = null,
    val rejectionReason: String? = null,
)
