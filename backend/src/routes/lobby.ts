import { Router } from "express";

interface CountdownState {
  nextHandId: number;
  secondsRemaining: number;
  seats: Array<{ id: string; label: string; stack: number }>;
}

const lobbyState: CountdownState = {
  nextHandId: 1,
  secondsRemaining: 60,
  seats: [
    { id: "ai1", label: "Agent A", stack: 0 },
    { id: "ai2", label: "Agent B", stack: 0 },
    { id: "ai3", label: "Agent C", stack: 0 }
  ]
};

export const lobbyRouter = Router();

lobbyRouter.get("/state", (_req, res) => {
  res.json(lobbyState);
});
