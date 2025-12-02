import { Router } from "express";
import { gameEngine } from "../state/gameEngine";
import { getTotals } from "../state/stakeStore";

export const lobbyRouter = Router();

lobbyRouter.get("/state", (_req, res) => {
  const state = gameEngine.getState();
  res.json({ ...state, totals: getTotals().totals });
});
