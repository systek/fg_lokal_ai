package no.systek.reiseregning.claim

/** What the number a user types into a claim line means for this category. */
enum class AmountUnit { NOK, KM, DAYS }

/**
 * Expense categories with their Norwegian VAT rate (merverdiavgift).
 *
 * 25 % is the general rate, 15 % applies to food and drink, 12 % to passenger transport and hotels.
 * Mileage and per diem are tax-free allowances, so they carry no VAT.
 */
enum class ExpenseCategory(
    val label: String,
    val vatRate: Double,
    val unit: AmountUnit,
) {
    MILEAGE("Kjøregodtgjørelse", 0.0, AmountUnit.KM),
    PER_DIEM("Diett", 0.0, AmountUnit.DAYS),
    MEALS("Bevertning", 0.15, AmountUnit.NOK),
    HOTEL("Hotell", 0.12, AmountUnit.NOK),
    TRANSPORT("Reise (fly, tog, taxi)", 0.12, AmountUnit.NOK),
    OTHER("Annet", 0.25, AmountUnit.NOK),
}
