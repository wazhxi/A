import { Router } from "express";
import { z } from "zod";

interface StakeEntry {
  user: string;
  aiId: string;
  amount: number;
}

const stakeBook: StakeEntry[] = [];

const stakeSchema = z.object({
  user: z.string().min(1),
  aiId: z.enum(["ai1", "ai2", "ai3"]),
  amount: z.number().positive()
});

export const stakesRouter = Router();

stakesRouter.post("/", (req, res) => {
  const parsed = stakeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  stakeBook.push(parsed.data);
  res.json({ ok: true, count: stakeBook.length });
});

stakesRouter.get("/", (_req, res) => {
  const totals = stakeBook.reduce<Record<string, number>>((memo, entry) => {
    memo[entry.aiId] = (memo[entry.aiId] || 0) + entry.amount;
    return memo;
  }, {});
  res.json({ stakes: stakeBook, totals });
});
