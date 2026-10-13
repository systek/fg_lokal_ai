// Mirrors the Kotlin DTOs in backend/.../claim/ClaimDto.kt.
// Keep the two in sync by hand - there is no code generation in this demo.

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type ExpenseCategory = "MILEAGE" | "PER_DIEM" | "MEALS" | "HOTEL" | "TRANSPORT" | "OTHER";

export type AmountUnit = "NOK" | "KM" | "DAYS";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MILEAGE: "Kjøregodtgjørelse",
  PER_DIEM: "Diett",
  MEALS: "Bevertning",
  HOTEL: "Hotell",
  TRANSPORT: "Reise (fly, tog, taxi)",
  OTHER: "Annet",
};

export const CATEGORY_UNITS: Record<ExpenseCategory, AmountUnit> = {
  MILEAGE: "KM",
  PER_DIEM: "DAYS",
  MEALS: "NOK",
  HOTEL: "NOK",
  TRANSPORT: "NOK",
  OTHER: "NOK",
};

export interface ClaimLine {
  id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  net: number;
  vat: number;
  gross: number;
}

export interface Claim {
  id: number;
  employee: string;
  purpose: string;
  status: ClaimStatus;
  createdAt: string;
  submittedAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  lines: ClaimLine[];
  totalNet: number;
  totalVat: number;
  total: number;
}

export interface NewClaimLine {
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export interface NewClaim {
  employee: string;
  purpose: string;
  lines: NewClaimLine[];
}

export type ClaimAction = "submit" | "approve" | "reject";
