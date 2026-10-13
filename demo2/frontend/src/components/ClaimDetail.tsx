import { useEffect, useState } from "react";
import { api } from "../api";
import { formatNok } from "../money";
import { CATEGORY_LABELS, CATEGORY_UNITS, type Claim, type ClaimAction, type ClaimLine } from "../types";
import StatusBadge from "./StatusBadge";

interface Props {
  id: number;
  user: string;
  onBack: () => void;
}

/** Shows what the user typed: kroner for receipts, km or days for allowances. */
function formatEntered(line: ClaimLine): string {
  switch (CATEGORY_UNITS[line.category]) {
    case "KM":
      return `${line.amount} km`;
    case "DAYS":
      return `${String(line.amount).replace(".", ",")} døgn`;
    case "NOK":
      return formatNok(line.amount);
  }
}

export default function ClaimDetail({ id, user, onBack }: Props) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getClaim(id).then(setClaim).catch((e: Error) => setError(e.message));
  }, [id]);

  const perform = async (action: ClaimAction) => {
    setError(null);
    try {
      setClaim(await api.performAction(id, action, user, reason || undefined));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!claim) return <p>{error ?? "Laster…"}</p>;

  const isOwner = claim.employee === user;

  return (
    <section>
      <button className="link" onClick={onBack}>
        ← Tilbake
      </button>
      <div className="toolbar">
        <h2>
          #{claim.id} {claim.purpose}
        </h2>
        <StatusBadge status={claim.status} />
      </div>
      <p>
        Ansatt: {claim.employee}
        {claim.decidedBy && <> · Behandlet av: {claim.decidedBy}</>}
      </p>
      {claim.rejectionReason && <p className="error">Avvist: {claim.rejectionReason}</p>}

      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Beskrivelse</th>
            <th className="num">Oppgitt</th>
            <th className="num">Netto</th>
            <th className="num">Mva</th>
            <th className="num">Brutto</th>
          </tr>
        </thead>
        <tbody>
          {claim.lines.map((line) => (
            <tr key={line.id}>
              <td>{CATEGORY_LABELS[line.category]}</td>
              <td>{line.description}</td>
              <td className="num">{formatEntered(line)}</td>
              <td className="num">{formatNok(line.net)}</td>
              <td className="num">{formatNok(line.vat)}</td>
              <td className="num">{formatNok(line.gross)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Totalt</td>
            <td className="num">{formatNok(claim.totalNet)}</td>
            <td className="num">{formatNok(claim.totalVat)}</td>
            <td className="num total">{formatNok(claim.total)}</td>
          </tr>
        </tfoot>
      </table>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        {isOwner && (claim.status === "DRAFT" || claim.status === "REJECTED") && (
          <button onClick={() => perform("submit")}>Send inn</button>
        )}
        {!isOwner && claim.status === "SUBMITTED" && (
          <>
            <button onClick={() => perform("approve")}>Godkjenn</button>
            <input placeholder="Begrunnelse for avvisning" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="danger" onClick={() => perform("reject")}>
              Avvis
            </button>
          </>
        )}
      </div>
    </section>
  );
}
