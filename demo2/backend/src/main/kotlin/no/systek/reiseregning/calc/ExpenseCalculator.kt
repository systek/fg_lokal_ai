package no.systek.reiseregning.calc

import no.systek.reiseregning.claim.ClaimLine
import no.systek.reiseregning.claim.ExpenseCategory
import no.systek.reiseregning.claim.ExpenseCategory.HOTEL
import no.systek.reiseregning.claim.ExpenseCategory.MEALS
import no.systek.reiseregning.claim.ExpenseCategory.MILEAGE
import no.systek.reiseregning.claim.ExpenseCategory.OTHER
import no.systek.reiseregning.claim.ExpenseCategory.PER_DIEM
import no.systek.reiseregning.claim.ExpenseCategory.TRANSPORT
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.RoundingMode

data class LineAmounts(val net: Double, val vat: Double) {
    val gross: Double get() = net + vat
}

data class ClaimTotals(val net: Double, val vat: Double, val gross: Double)

/**
 * Turns what the employee typed into money: applies mileage and per diem rates,
 * and splits receipt amounts into net + VAT.
 *
 * Rates are simplified for the demo, loosely based on "statens satser". Not for real payroll!
 */
@Component
class ExpenseCalculator {

    /** The amount to reimburse for one line, before any VAT split. */
    fun grossAmount(category: ExpenseCategory, amount: Double): BigDecimal {
        val entered = amount.toBigDecimal()
        // An exhaustive `when` over the enum: adding a category won't compile until it gets a rule here.
        return when (category) {
            MILEAGE -> entered * MILEAGE_RATE_PER_KM
            PER_DIEM -> perDiem(days = entered)
            MEALS, HOTEL, TRANSPORT, OTHER -> entered
        }
    }

    fun calculateLine(line: ClaimLine): LineAmounts {
        val gross = grossAmount(line.category, line.amount)
        val rate = line.category.vatRate.toBigDecimal()

        // Receipts are entered incl. VAT, so back out the net amount first: net = gross / (1 + rate)
        val net = gross.divide(BigDecimal.ONE + rate, 2, RoundingMode.HALF_EVEN)
        val vat = (net * rate).setScale(2, RoundingMode.HALF_EVEN)

        return LineAmounts(net = net.toDouble(), vat = vat.toDouble())
    }

    fun calculateTotals(lines: List<LineAmounts>): ClaimTotals {
        val net = lines.sumOf { it.net }
        val vat = lines.sumOf { it.vat }
        return ClaimTotals(net = net, vat = vat, gross = net + vat)
    }

    /**
     * Full days get the overnight rate. A remaining part of a day counts as a
     * day trip if it is at least half a day (12 hours); shorter remainders give nothing.
     */
    private fun perDiem(days: BigDecimal): BigDecimal {
        val fullDays = days.setScale(0, RoundingMode.DOWN)
        val remainder = days - fullDays
        val partialDay = if (remainder >= HALF_DAY) DAY_TRIP_RATE else BigDecimal.ZERO
        return fullDays * PER_DIEM_RATE + partialDay
    }

    companion object {
        // BigDecimal from String, never from Double: BigDecimal(0.1) is 0.1000000000000000055511151231257827...
        val MILEAGE_RATE_PER_KM = BigDecimal("3.50")
        val PER_DIEM_RATE = BigDecimal("1012.00")
        val DAY_TRIP_RATE = BigDecimal("397.00")
        private val HALF_DAY = BigDecimal("0.5")
    }
}
