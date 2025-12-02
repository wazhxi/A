import { Router } from "express";
import { gameEngine } from "../state/gameEngine";

export const handsRouter = Router();

handsRouter.get("/latest", (_req, res) => {
  const state = gameEngine.getState();
  if (!state.lastResult) {
    res.status(404).json({ error: "No completed hands yet" });
    return;
  }
  res.json(state.lastResult);
});
