import { useState } from "react";
import ClaimList from "./components/ClaimList";
import ClaimForm from "./components/ClaimForm";
import ClaimDetail from "./components/ClaimDetail";

// No login in this demo: pick who you are from a dropdown.
// Employees create and submit claims; Ola Leder approves or rejects them.
const USERS = ["Kari Nordmann", "Per Hansen", "Ola Leder"];

// A tiny hand-rolled "router" keeps the demo free of extra dependencies.
type View = { kind: "list" } | { kind: "new" } | { kind: "detail"; id: number };

export default function App() {
  const [user, setUser] = useState(USERS[0]);
  const [view, setView] = useState<View>({ kind: "list" });

  return (
    <div className="app">
      <header>
        <h1 onClick={() => setView({ kind: "list" })}>Reiseregning</h1>
        <label>
          Logget inn som{" "}
          <select value={user} onChange={(e) => setUser(e.target.value)}>
            {USERS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
      </header>

      <main>
        {view.kind === "list" && (
          <ClaimList
            onOpen={(id) => setView({ kind: "detail", id })}
            onNew={() => setView({ kind: "new" })}
          />
        )}
        {view.kind === "new" && (
          <ClaimForm
            employee={user}
            onCreated={(id) => setView({ kind: "detail", id })}
            onCancel={() => setView({ kind: "list" })}
          />
        )}
        {view.kind === "detail" && (
          <ClaimDetail id={view.id} user={user} onBack={() => setView({ kind: "list" })} />
        )}
      </main>
    </div>
  );
}
