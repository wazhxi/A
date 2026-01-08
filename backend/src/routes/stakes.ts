import { Router } from "express";
import { z } from "zod";
import { addStake, getTotals } from "../state/stakeStore";
import { gameEngine } from "../state/gameEngine";

const stakeSchema = z.object({
  user: z.string().min(1),
  aiId: z.enum(["ai1", "ai2", "ai3"]),
  amount: z.number().positive()
});

export const stakesRouter = Router();

stakesRouter.post("/", (req, res) => {
  if (!gameEngine.isBettingWindowOpen()) {
    res.status(400).json({ error: "Betting window is closed" });
    return;
  }

  const parsed = stakeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const entry = addStake(parsed.data);
  res.json({ ok: true, entry });
});

stakesRouter.get("/", (_req, res) => {
  const totals = getTotals();
  res.json({ stakes: totals.stakes, totals: totals.totals });
});
