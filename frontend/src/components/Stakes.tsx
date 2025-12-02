import { FormEvent, useEffect, useState } from "react";

interface StakeFormState {
  user: string;
  aiId: "ai1" | "ai2" | "ai3";
  amount: number;
}

interface StakeResponse {
  stakes: Array<{ user: string; aiId: string; amount: number }>;
  totals: Record<string, number>;
}

export function Stakes() {
  const [form, setForm] = useState<StakeFormState>({ user: "", aiId: "ai1", amount: 10 });
  const [response, setResponse] = useState<StakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stakes")
      .then((r) => r.json())
      .then(setResponse)
      .catch(() => setResponse(null));
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    fetch("/api/stakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error?.formErrors?.join(", ") || "Invalid stake");
        }
        return fetch("/api/stakes").then((r) => r.json());
      })
      .then(setResponse)
      .catch((e: Error) => setError(e.message));
  };

  return (
    <div className="card">
      <div className="card-header">Back an AI</div>
      <div className="card-body">
        <form onSubmit={submit} className="stake-form">
          <label>
            Wallet address
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="0x..."
              required
            />
          </label>
          <label>
            Choose AI seat
            <select value={form.aiId} onChange={(e) => setForm({ ...form, aiId: e.target.value as StakeFormState["aiId"] })}>
              <option value="ai1">Agent A</option>
              <option value="ai2">Agent B</option>
              <option value="ai3">Agent C</option>
            </select>
          </label>
          <label>
            Amount (USDC)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </label>
          <button type="submit">Lock stake</button>
        </form>
        {error && <div className="error">{error}</div>}
        <div className="stake-totals">
          <h4>Totals</h4>
          <ul>
            <li>Agent A: {response?.totals?.ai1 || 0} USDC</li>
            <li>Agent B: {response?.totals?.ai2 || 0} USDC</li>
            <li>Agent C: {response?.totals?.ai3 || 0} USDC</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
