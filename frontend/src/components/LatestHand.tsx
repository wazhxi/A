import { useEffect, useState } from "react";

interface LatestHandState {
  handId: number;
  winner: { id: string; label: string; stack: number };
  pot: number;
  board: string[];
  holes: Record<string, [string, string]>;
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
      </div>
    </div>
  );
}
