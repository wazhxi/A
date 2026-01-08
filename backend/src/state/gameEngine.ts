import { getAIDecision } from "../services/ai";
import { buildDeck } from "../services/prng";
import { getRandomness } from "../services/rng";
import { clearStakes, getTotals } from "./stakeStore";

export type Phase = "betting" | "playing" | "complete";

export interface SeatState {
  id: "ai1" | "ai2" | "ai3";
  label: string;
  stack: number;
}

export type Street = "preflop" | "flop" | "turn" | "river";

export interface ActionLog {
  street: Street;
  seatId: SeatState["id"];
  action: "fold" | "check" | "call" | "bet" | "raise";
  amount: number;
  reasoning: string;
  provider: "openai" | "anthropic" | "simulated";
}

export interface HandResult {
  handId: number;
  winner: SeatState;
  pot: number;
  board: string[];
  holes: Record<string, [string, string]>;
  actions: ActionLog[];
}

interface EngineState {
  nextHandId: number;
  secondsRemaining: number;
  phase: Phase;
  seats: SeatState[];
  lastResult: HandResult | null;
}

const deckRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

function rankStrength(card: string): number {
  const rank = card[0];
  return deckRanks.indexOf(rank);
}

function evaluateHand(board: string[], hole: [string, string]) {
  const combined = [...board, ...hole];
  const sorted = combined.sort((a, b) => rankStrength(b) - rankStrength(a));
  const top = sorted.slice(0, 2);
  return top.reduce((sum, card) => sum + rankStrength(card), 0);
}

class GameEngine {
  private state: EngineState;
  private countdownHandle: NodeJS.Timeout | null = null;
  private readonly windowSeconds: number;
  private playing = false;

  constructor(windowSeconds = 30) {
    this.windowSeconds = windowSeconds;
    this.state = {
      nextHandId: 1,
      secondsRemaining: windowSeconds,
      phase: "betting",
      seats: [
        { id: "ai1", label: "GPT-style (OpenAI)", stack: 0 },
        { id: "ai2", label: "Claude-style (Anthropic)", stack: 0 },
        { id: "ai3", label: "Qwen-style (Sim)", stack: 0 }
      ],
      lastResult: null
    };
  }

  start() {
    if (this.countdownHandle) return;
    this.countdownHandle = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.countdownHandle) {
      clearInterval(this.countdownHandle);
      this.countdownHandle = null;
    }
  }

  getState() {
    return this.state;
  }

  isBettingWindowOpen() {
    return this.state.phase === "betting";
  }

  private tick() {
    if (this.state.phase === "betting") {
      if (this.state.secondsRemaining > 0) {
        this.state = { ...this.state, secondsRemaining: this.state.secondsRemaining - 1 };
        return;
      }
      void this.playHand();
      return;
    }

    if (this.state.phase === "complete") {
      this.resetForNextHand();
    }
  }

  private async playHand() {
    if (this.playing) return;
    this.playing = true;
    this.state = { ...this.state, phase: "playing" };

    try {
      const { totals } = getTotals();
      const randomness = await getRandomness(this.state.nextHandId);
      const deck = buildDeck(randomness);
      const holes: Record<string, [string, string]> = {
        ai1: [deck[0], deck[1]],
        ai2: [deck[2], deck[3]],
        ai3: [deck[4], deck[5]]
      };
      const board = deck.slice(6, 11);

      // reset stacks to this hand's locked stakes
      const seats = this.state.seats.map((seat, idx) => ({
        ...seat,
        stack: totals[seat.id] ?? 0,
        // light personality knobs for AI flavor
        aggression: 0.6 + idx * 0.1
      })) as Array<SeatState & { aggression: number }>;

      let pot = 0;
      const actions: ActionLog[] = [];
      const streets: Street[] = ["preflop", "flop", "turn", "river"];

      for (const street of streets) {
        for (const seat of seats) {
          if (seat.stack <= 0) continue;
          const decision = await getAIDecision({
            handId: this.state.nextHandId,
            street,
            seat: seat.id,
            stack: seat.stack,
            pot,
            board: street === "preflop" ? [] : board.slice(0, street === "flop" ? 3 : street === "turn" ? 4 : 5),
            hole: holes[seat.id],
            style: seat.label
          });
          const amount = Math.min(decision.amount, seat.stack);
          seat.stack -= amount;
          pot += amount;
          actions.push({
            street,
            seatId: seat.id,
            action: decision.action,
            amount,
            reasoning: decision.reasoning,
            provider: decision.provider
          });
        }
      }

      const scored = seats.map((seat) => ({
        seat,
        score: evaluateHand(board, holes[seat.id])
      }));
      scored.sort((a, b) => b.score - a.score);
      const winner = scored[0]?.seat ?? seats[0];

      const updatedSeats = this.state.seats.map((seat) =>
        seat.id === winner.id ? { ...seat, stack: seat.stack + pot } : seat
      );

      this.state = {
        ...this.state,
        phase: "complete",
        secondsRemaining: 5,
        seats: updatedSeats,
        lastResult: {
          handId: this.state.nextHandId,
          winner,
          pot,
          board,
          holes,
          actions
        }
      };
    } catch (err) {
      console.error("Hand execution failed", err);
      this.state = { ...this.state, phase: "complete", secondsRemaining: 5 };
    } finally {
      clearStakes();
      this.playing = false;
    }
  }

  private resetForNextHand() {
    this.state = {
      ...this.state,
      phase: "betting",
      nextHandId: this.state.nextHandId + 1,
      secondsRemaining: this.windowSeconds
    };
  }
}

export const gameEngine = new GameEngine(45);
gameEngine.start();
