# Reiseregning: travel expense claims

A small workshop demo app for **local AI coding assistants**. Employees create travel expense claims
with line items (mileage, per diem, meals, hotel, transport). A manager approves or rejects them.

```
DRAFT ──submit──▶ SUBMITTED ──approve──▶ APPROVED
                    │   ▲
              reject│   │submit (after fixing)
                    ▼   │
                  REJECTED
```

- **Backend:** Kotlin 2.4, Spring Boot 4.1 (WebFlux, Jackson 3), Spring Data R2DBC, H2 in-memory DB, Java 25
- **Frontend:** Vite 8, React 19, TypeScript 7, plain CSS
- **Domain:** amounts in NOK. VAT rates are 25 % (general), 15 % (food) and 12 % (transport and hotel).
  Mileage is 3.50 kr/km and per diem is 1 012 kr per day. These are simplified demo rates.

Everything runs offline: no Docker, no external database, no cloud APIs.

## Prerequisites

- **Any JDK 17 or newer** to start Gradle. The build itself uses a **Java 25** toolchain: if you
  don't have JDK 25 installed, Gradle downloads it into `~/.gradle/jdks` on the first build
  (via the foojay toolchain resolver in `settings.gradle.kts`). Nothing is installed system-wide.
- **Node.js 24 or newer** for the frontend.
- In IntelliJ, set the project SDK to Java 25 (or let Gradle pick the downloaded one).

## Running the app

### Backend (port 8080)

- **IntelliJ:** open `backend/` as a Gradle project and run `ReiseregningApplication`.
- **CLI:**
  ```bash
  cd backend
  ./gradlew bootRun
  ```

The database is created and seeded on every start (`schema.sql`, `data.sql`). Try
`curl localhost:8080/api/claims`.

If port 8080 is taken, run `./gradlew bootRun --args='--server.port=8081'`. Then also change the
proxy target in `frontend/vite.config.ts`.

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` to the backend. Use the dropdown at the
top to switch user: Kari Nordmann and Per Hansen are employees, and Ola Leder approves claims.

### Preparing for offline use (do this before the workshop)

Conference Wi-Fi is unreliable, so fetch every dependency in advance:

```bash
cd backend && ./gradlew build          # downloads Gradle, JDK 25, plugins and dependencies once
./gradlew build --offline              # verify that it now works without network
cd ../frontend && npm ci               # installs exactly what package-lock.json says
```

You also need your local model downloaded and the IDE plugin configured.

## Project layout

```
backend/src/main/kotlin/no/systek/reiseregning/
  claim/   Claim, ClaimLine, ClaimStatus, ExpenseCategory, ClaimDto (DTOs and mappers),
           ClaimRepository, ClaimLineRepository, ClaimService, ClaimController
  calc/    ExpenseCalculator: mileage, per diem, VAT split, totals
backend/src/main/resources/  application.yml, schema.sql, data.sql
backend/src/test/            ExpenseCalculatorTest (one sample test, on purpose)

frontend/src/
  api.ts, types.ts, money.ts (NOK formatting and parsing), App.tsx
  components/  ClaimList, ClaimForm, ClaimDetail, StatusBadge
```

## Workshop exercises

### 1. Inline completion: repetitive, pattern-shaped work

Local models are fast and good at continuing a pattern that is already on screen.

**a) Add a new expense category, `PARKING` (25 % VAT, entered in NOK).** It has to be added in
several places that all follow the same pattern:

1. `ExpenseCategory.kt`: add the enum entry. Type `PARKING(` and let completion fill in the rest.
2. `ExpenseCalculator.kt`: the exhaustive `when` in `grossAmount` won't compile until you add it.
3. `frontend/src/types.ts`: the `ExpenseCategory` union, `CATEGORY_LABELS` and `CATEGORY_UNITS`.
   Because of the `Record<ExpenseCategory, …>` types, the compiler shows you each place you missed.
4. The form dropdown picks it up automatically from `CATEGORY_LABELS`.

Then try `TOLL` ("Bompenger", 0 % VAT). The second time, completion should get it right with
fewer keystrokes.

**b) Write the missing mapper.** `ClaimDto.kt` defines `ClaimSummaryDto` but has no mapper for it.
Below the other mappers, type `fun Claim.toSummaryDto(` and accept the suggestion. Then use it in
`ClaimService.listClaims()`.

### 2. Chat on selected code: explain, test, refactor

Select the code, open the plugin's chat, and try:

- **Explain Reactor code.** Select `ClaimService.getClaim` and ask:
  > Explain step by step what this Reactor chain does. What happens if the claim doesn't exist?
  > Why is `collectList()` needed before `zipWith`?

  Follow up with:
  > Why does `listClaims` use `concatMap` instead of `flatMap`?
- **Generate tests.** Select `ExpenseCalculator` and ask:
  > Write JUnit 5 tests in Kotlin for this class, following the style of ExpenseCalculatorTest.
  > Cover each VAT rate, per diem with 2.0, 2.5 and 2.4 days, and calculateTotals.

  Run the tests. Do they pass? Do the expected values in the generated tests look right to you?
  (This is a hint for exercise 3.)
- **Refactor.** Select `ClaimService.transition` (the nested `if/else` chain) and ask:
  > Refactor this into idiomatic Kotlin. Replace the action string with a sealed interface
  > (Submit, Approve, Reject(reason)) and use an exhaustive `when`. Keep the behaviour identical.

  Or ask for a transition table instead:
  > Rewrite this as a transition table: Map<Pair<ClaimStatus, Action>, ClaimStatus>.

  Compare the two versions. Which one is easier to read on a projector?

### 3. Agentic coding: a bug that cuts across layers

The bug report from accounting:

> "Per Hansen's JavaZone claim (#2) has receipts adding up to **4 423,50 kr**, but the app says
> **4 423,48 kr**. The VAT is also off: it should be **467,05 kr**, but it shows **467,04 kr**.
> This happens on some claims but not all of them. Claim #1 is correct."

You can reproduce it yourself: create a claim with a "Reise" line of `1 207,50` and a "Bevertning"
line of `380`. The form shows *Sum kvitteringer: 1 587,50 kr*. After saving, the claim shows
1 587,48 kr.

Give the bug report to the agent (with the whole `demo2/` folder as context):

> Claim #2 shows a total of 4 423,48 kr, but the receipts add up to 4 423,50 kr. The VAT should
> be 467,05 kr. Find the root cause and fix it. Look at the whole flow, from the form input in the
> frontend, through the API and database, to the calculation. Add a test that would have caught it.

Things to watch:

- Does the agent stop at the first plausible cause, or does it follow the money through every layer?
- Does it write a failing test **before** fixing?
- How does a small local model compare with a larger one? Agentic work across many files is where
  local models struggle the most, so be honest about the results.

---

## SPOILER: exercise 3 solution

> Don't read this before you've tried the exercise.

### Symptom

With the seed data, claim #2 has these lines:

| Line | Entered | Net (per line) | VAT (per line) | net + VAT |
|---|---|---|---|---|
| Fly (12 %) | 1 207,50 | 1 078,12 | 129,37 | **1 207,49** |
| Hotell (12 %) | 2 689,00 | 2 400,89 | 288,11 | 2 689,00 |
| Middag (15 %) | 380,00 | 330,43 | 49,56 | **379,99** |
| Kjøring 42 km | 147,00 | 147,00 | 0,00 | 147,00 |
| **Total** | **4 423,50** | 3 956,44 | 467,04 | **4 423,48** |

The correct VAT is calculated once per rate on the totals, rounded half-up:
12 %: 3 896,50 × 12/112 = 417,4821 → 417,48. 15 %: 380 × 15/115 = 49,5652 → 49,57.
Together that is **467,05**.

In the raw JSON you can also see float noise, for example `"totalNet": 3956.4399999999996` and
`"gross": 1207.4899999999998`.

### Root cause, layer by layer

1. **`calc/ExpenseCalculator.kt` (the main cause).** `calculateLine` rounds the net amount to øre,
   then calculates VAT from the *rounded* net and rounds again. The line's gross is rebuilt as
   `net + vat` instead of being the amount on the receipt, so each line can lose or gain 1 øre.
   `calculateTotals` then sums these rounded values, so the errors add up across lines.
   `HALF_EVEN` (banker's rounding) makes it worse: 1 078,125 rounds to 1 078,12, but Norwegian
   accounting expects half-up (1 078,13).
2. **`claim/ClaimLine.kt`, `ClaimDto.kt`, `LineAmounts`, `ClaimTotals`: `Double` everywhere.** The
   database column is `DECIMAL(12,2)`, which is exact, but the entity converts it to a binary float.
   Sums like `lines.sumOf { it.net }` add float error on top (`3956.4399999999996`).
3. **JSON and the frontend: amounts travel as JS `number`.** `money.ts#parseAmount` does
   `Math.round(parseFloat(x) * 100) / 100`, which is a float operation that is lossy on half-øre
   values (`1.005 * 100 = 100.49999…`). `sumAmounts` adds floats. The form preview happens to show
   the "right" number only because it doesn't use the backend's calculation.

### Reference fix

**Backend: BigDecimal end to end, and round once on the total.**

```diff
 // ClaimLine.kt
-    val amount: Double,
+    val amount: BigDecimal,
```

```diff
 // ExpenseCalculator.kt
-data class LineAmounts(val net: Double, val vat: Double) {
-    val gross: Double get() = net + vat
-}
-data class ClaimTotals(val net: Double, val vat: Double, val gross: Double)
+data class LineAmounts(val gross: BigDecimal, val vatRate: BigDecimal)
+data class ClaimTotals(val net: BigDecimal, val vat: BigDecimal, val gross: BigDecimal)

-    fun calculateLine(line: ClaimLine): LineAmounts {
-        val gross = grossAmount(line.category, line.amount)
-        val rate = line.category.vatRate.toBigDecimal()
-        val net = gross.divide(BigDecimal.ONE + rate, 2, RoundingMode.HALF_EVEN)
-        val vat = (net * rate).setScale(2, RoundingMode.HALF_EVEN)
-        return LineAmounts(net = net.toDouble(), vat = vat.toDouble())
-    }
+    // The receipt amount is the truth. Never rebuild it from rounded parts.
+    fun calculateLine(line: ClaimLine) =
+        LineAmounts(gross = grossAmount(line.category, line.amount), vatRate = line.category.vatRate)

-    fun calculateTotals(lines: List<LineAmounts>): ClaimTotals {
-        val net = lines.sumOf { it.net }
-        val vat = lines.sumOf { it.vat }
-        return ClaimTotals(net = net, vat = vat, gross = net + vat)
-    }
+    fun calculateTotals(lines: List<LineAmounts>): ClaimTotals {
+        val gross = lines.sumOf { it.gross }
+        // VAT once per rate on the summed gross, rounded half-up: the way an accountant does it.
+        val vat = lines.groupBy { it.vatRate }
+            .map { (rate, group) ->
+                val groupGross = group.sumOf { it.gross }
+                (groupGross * rate).divide(BigDecimal.ONE + rate, 2, RoundingMode.HALF_UP)
+            }
+            .sumOf { it }
+        return ClaimTotals(net = gross - vat, vat = vat, gross = gross)
+    }
```

```diff
 // ExpenseCategory.kt: an exact rate, not a binary fraction
-    val vatRate: Double,
+    val vatRate: BigDecimal,
-    MEALS("Bevertning", 0.15, AmountUnit.NOK),
+    MEALS("Bevertning", BigDecimal("0.15"), AmountUnit.NOK),
```

If you still want per-line VAT in the UI, show it for information only, and use the total that
is rounded once for the sum.

**API: never send money as a JSON float.** Either send integer øre (`"total": 442350`), or send a
decimal string (`"total": "4423.50"`). For the string option, add this to `application.yml`:

```yaml
spring:
  jackson:
    write:   # Jackson 3 StreamWriteFeature (Boot 3 called this spring.jackson.generator)
      write-bigdecimal-as-plain: true
```

Then annotate the DTO fields with `@JsonFormat(shape = JsonFormat.Shape.STRING)`. The annotations
are still in `com.fasterxml.jackson.annotation` in Jackson 3; only core and databind moved to `tools.jackson`.

**Frontend: parse to øre (integers), not floats.**

```diff
-export function parseAmount(input: string): number {
-  const normalized = input.replace(/\s/g, "").replace(",", ".");
-  if (normalized === "") return NaN;
-  return Math.round(parseFloat(normalized) * 100) / 100;
-}
+/** "1 234,50" -> 123450 (øre). String arithmetic only, no floating point. */
+export function parseOre(input: string): number {
+  const match = input.replace(/\s/g, "").match(/^(\d+)(?:[.,](\d{1,2}))?$/);
+  if (!match) return NaN;
+  const [, kroner, ore = ""] = match;
+  return Number(kroner) * 100 + Number(ore.padEnd(2, "0"));
+}
+
+export const formatOre = (ore: number) => formatNok(ore / 100); // dividing only for display
```

**Test that would have caught it:**

```kotlin
@Test
fun `claim total equals the sum of the receipts`() {
    val lines = listOf(
        line(TRANSPORT, "1207.50"), line(HOTEL, "2689.00"), line(MEALS, "380.00"), line(MILEAGE, "42"),
    ).map(calculator::calculateLine)

    val totals = calculator.calculateTotals(lines)

    assertEquals(BigDecimal("4423.50"), totals.gross)
    assertEquals(BigDecimal("467.05"), totals.vat)
}
```

The lesson for the workshop: each layer looks reasonable when you read it on its own. You only
find the bug by following one amount from the input field to the screen. That is exactly the kind
of task where you want an agent that reads across files, and where you should check its reasoning.
