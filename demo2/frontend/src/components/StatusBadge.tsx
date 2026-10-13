import type { ClaimStatus } from "../types";

const LABELS: Record<ClaimStatus, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Sendt inn",
  APPROVED: "Godkjent",
  REJECTED: "Avvist",
};

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{LABELS[status]}</span>;
}
