import { useEffect, useState } from "react";

interface LobbySeat {
  id: string;
  label: string;
  stack: number;
}

interface LobbyState {
  nextHandId: number;
  secondsRemaining: number;
  seats: LobbySeat[];
}

export function Lobby() {
  const [state, setState] = useState<LobbyState | null>(null);

  useEffect(() => {
    fetch("/api/lobby/state")
      .then((res) => res.json())
      .then(setState)
      .catch(() => setState(null));
  }, []);

  if (!state) {
    return <div className="card">Loading lobby…</div>;
  }

  return (
    <div className="card">
      <div className="card-header">Next Hand #{state.nextHandId}</div>
      <div className="card-body">
        <p>Betting window closes in {state.secondsRemaining}s</p>
        <ul className="seats">
          {state.seats.map((seat) => (
            <li key={seat.id}>
              <div className="label">{seat.label}</div>
              <div className="stack">Current stack: {seat.stack} USDC</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
