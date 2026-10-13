// Norwegian number formatting: space as thousands separator, comma as decimal separator.
// Intl uses a non-breaking space (U+00A0), so "1 234,50" never wraps across lines.
const nok = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  minimumFractionDigits: 2,
});

export function formatNok(amount: number): string {
  return nok.format(amount);
}

/** Parses what users type, e.g. "1 234,50", "1234.5" or "189". Returns NaN for garbage. */
export function parseAmount(input: string): number {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return NaN;
  // Keep at most two decimals - we deal in kroner and øre.
  return Math.round(parseFloat(normalized) * 100) / 100;
}

/** Sum of the amounts the user typed, for the live preview in the form. */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}
