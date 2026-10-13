package no.systek.reiseregning.calc

import no.systek.reiseregning.claim.ClaimLine
import no.systek.reiseregning.claim.ExpenseCategory
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

// The one sample test. Exercise 2: ask your local model to generate the rest
// (VAT per category, per diem edge cases, totals).
class ExpenseCalculatorTest {

    private val calculator = ExpenseCalculator()

    @Test
    fun `mileage is reimbursed per km with no VAT`() {
        val line = ClaimLine(claimId = 1, category = ExpenseCategory.MILEAGE, description = "Oslo - Drammen", amount = 120.0)

        val result = calculator.calculateLine(line)

        assertEquals(420.0, result.net)
        assertEquals(0.0, result.vat)
    }
}
