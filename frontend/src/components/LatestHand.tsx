import { useEffect, useState } from "react";

interface LatestHandState {
  handId: number;
  winner: { id: string; label: string; stack: number };
  pot: number;
  board: string[];
  holes: Record<string, [string, string]>;
  actions: Array<{
    street: "preflop" | "flop" | "turn" | "river";
    seatId: string;
    action: string;
    amount: number;
    reasoning: string;
  }>;
}

export function LatestHand() {
  const [state, setState] = useState<LatestHandState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/hands/latest")
        .then((res) => {
          if (res.status === 404) {
            setError("No completed hand yet");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            setError(null);
            setState(data);
          }
        })
        .catch(() => setError("Unable to load latest hand"));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  if (error && !state) {
    return <div className="card">{error}</div>;
  }

  if (!state) {
    return <div className="card">Waiting for first hand…</div>;
  }

  return (
    <div className="card">
      <div className="card-header">Last showdown (Hand #{state.handId})</div>
      <div className="card-body">
        <div className="board">
          {state.board.map((card) => (
            <span key={card} className="card-chip">
              {card}
            </span>
          ))}
        </div>
        <div className="holes">
          {Object.entries(state.holes).map(([seat, cards]) => (
            <div key={seat} className="hole">
              <div className="label">{seat.toUpperCase()}</div>
              <div className="cards">
                <span className="card-chip">{cards[0]}</span>
                <span className="card-chip">{cards[1]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="winner">
          Winner: {state.winner.label} takes {state.pot} USDC
        </div>
        <div className="actions">
          <h4>Decision log</h4>
          {state.actions.map((action, idx) => (
            <div key={`${action.seatId}-${idx}`} className="action-row">
              <div className="meta">
                <span className="pill">{action.street}</span>
                <span className="pill">{action.seatId.toUpperCase()}</span>
                <span className="pill">{action.action}</span>
                {action.amount > 0 && <span className="pill">{action.amount} USDC</span>}
              </div>
              <div className="reasoning">{action.reasoning}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
