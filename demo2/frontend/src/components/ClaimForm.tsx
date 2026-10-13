import { useState } from "react";
import { api } from "../api";
import { formatNok, parseAmount, sumAmounts } from "../money";
import { CATEGORY_LABELS, CATEGORY_UNITS, type AmountUnit, type ExpenseCategory } from "../types";

interface Props {
  employee: string;
  onCreated: (id: number) => void;
  onCancel: () => void;
}

// Form state keeps the raw text the user typed; we only parse when we need a number.
interface LineInput {
  category: ExpenseCategory;
  description: string;
  amount: string;
}

const UNIT_PLACEHOLDERS: Record<AmountUnit, string> = {
  NOK: "kr inkl. mva, f.eks. 1 234,50",
  KM: "antall km",
  DAYS: "antall døgn, f.eks. 2,5",
};

const emptyLine = (): LineInput => ({ category: "MEALS", description: "", amount: "" });

export default function ClaimForm({ employee, onCreated, onCancel }: Props) {
  const [purpose, setPurpose] = useState("");
  const [lines, setLines] = useState<LineInput[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);

  const updateLine = (index: number, patch: Partial<LineInput>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const removeLine = (index: number) => setLines((current) => current.filter((_, i) => i !== index));

  // Live preview of the receipts total (mileage and per diem are calculated by the backend).
  const receiptsTotal = sumAmounts(
    lines
      .filter((line) => CATEGORY_UNITS[line.category] === "NOK")
      .map((line) => parseAmount(line.amount))
      .filter((amount) => !Number.isNaN(amount)),
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = lines.map((line) => ({ ...line, amount: parseAmount(line.amount) }));
    if (parsed.some((line) => Number.isNaN(line.amount) || line.amount <= 0)) {
      setError("Alle linjer må ha et gyldig beløp");
      return;
    }
    try {
      const created = await api.createClaim({ employee, purpose, lines: parsed });
      onCreated(created.id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Ny reiseregning for {employee}</h2>

      <label className="field">
        Formål med reisen
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
      </label>

      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Beskrivelse</th>
            <th>Beløp</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index}>
              <td>
                <select
                  value={line.category}
                  onChange={(e) => updateLine(index, { category: e.target.value as ExpenseCategory })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  required
                />
              </td>
              <td>
                <input
                  className="num"
                  inputMode="decimal"
                  placeholder={UNIT_PLACEHOLDERS[CATEGORY_UNITS[line.category]]}
                  value={line.amount}
                  onChange={(e) => updateLine(index, { amount: e.target.value })}
                  required
                />
              </td>
              <td>
                <button type="button" className="link" onClick={() => removeLine(index)} disabled={lines.length === 1}>
                  Fjern
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="toolbar">
        <button type="button" className="secondary" onClick={() => setLines([...lines, emptyLine()])}>
          + Legg til linje
        </button>
        <span>
          Sum kvitteringer: <strong>{formatNok(receiptsTotal)}</strong>
        </span>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button type="submit">Lagre utkast</button>
        <button type="button" className="secondary" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
