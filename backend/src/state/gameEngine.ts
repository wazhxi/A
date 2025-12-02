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
const deckSuits = ["h", "d", "c", "s"];

function shuffle<T>(arr: T[]): T[] {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function drawDeck() {
  return shuffle(deckRanks.flatMap((rank) => deckSuits.map((suit) => `${rank}${suit}`)));
}

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

function pickReasoning(street: Street, action: ActionLog["action"], hand: [string, string], board: string[]) {
  const lane =
    street === "preflop"
      ? `Opening with ${hand.join("/")}`
      : `Board ${board.join(" ")} + hand ${hand.join("/")}`;
  switch (action) {
    case "raise":
      return `${lane} looks strong; pressuring opponents with a raise.`;
    case "bet":
      return `${lane} has equity; betting to deny draws.`;
    case "call":
      return `${lane} is decent; calling to realize equity.`;
    case "check":
      return `${lane} is marginal; pot control with a check.`;
    case "fold":
    default:
      return `${lane} is weak; folding this street.`;
  }
}

function chooseAction(street: Street, stack: number, aggression: number) {
  const roll = Math.random();
  if (stack <= 0.5) return { action: "check" as const, betSize: 0 };
  if (roll < aggression * 0.3) return { action: "raise" as const, betSize: Math.min(5, stack) };
  if (roll < aggression * 0.5) return { action: "bet" as const, betSize: Math.min(3, stack) };
  if (roll < 0.8) return { action: "call" as const, betSize: Math.min(1.5, stack) };
  return { action: "check" as const, betSize: 0 };
}

class GameEngine {
  private state: EngineState;
  private countdownHandle: NodeJS.Timeout | null = null;
  private readonly windowSeconds: number;

  constructor(windowSeconds = 30) {
    this.windowSeconds = windowSeconds;
    this.state = {
      nextHandId: 1,
      secondsRemaining: windowSeconds,
      phase: "betting",
      seats: [
        { id: "ai1", label: "Agent A", stack: 0 },
        { id: "ai2", label: "Agent B", stack: 0 },
        { id: "ai3", label: "Agent C", stack: 0 }
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
    if (this.state.secondsRemaining > 0) {
      this.state = { ...this.state, secondsRemaining: this.state.secondsRemaining - 1 };
      return;
    }

    if (this.state.phase === "betting") {
      this.playHand();
    } else if (this.state.phase === "complete") {
      this.resetForNextHand();
    }
  }

  private playHand() {
    const { totals } = getTotals();
    const deck = drawDeck();
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

    streets.forEach((street) => {
      seats.forEach((seat) => {
        if (seat.stack <= 0) return;
        const decision = chooseAction(street, seat.stack, seat.aggression);
        const amount = Math.min(decision.betSize, seat.stack);
        seat.stack -= amount;
        pot += amount;
        actions.push({
          street,
          seatId: seat.id,
          action: decision.action,
          amount,
          reasoning: pickReasoning(street, decision.action, holes[seat.id], board)
        });
      });
    });

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

    clearStakes();
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
