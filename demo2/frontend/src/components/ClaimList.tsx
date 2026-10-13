import { useEffect, useState } from "react";
import { api } from "../api";
import { formatNok } from "../money";
import type { Claim } from "../types";
import StatusBadge from "./StatusBadge";

interface Props {
  onOpen: (id: number) => void;
  onNew: () => void;
}

export default function ClaimList({ onOpen, onNew }: Props) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listClaims().then(setClaims).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <section>
      <div className="toolbar">
        <h2>Reiseregninger</h2>
        <button onClick={onNew}>Ny reiseregning</button>
      </div>

      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ansatt</th>
            <th>Formål</th>
            <th>Status</th>
            <th className="num">Totalt</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="clickable" onClick={() => onOpen(claim.id)}>
              <td>{claim.id}</td>
              <td>{claim.employee}</td>
              <td>{claim.purpose}</td>
              <td>
                <StatusBadge status={claim.status} />
              </td>
              <td className="num">{formatNok(claim.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
