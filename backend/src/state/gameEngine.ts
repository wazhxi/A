import { clearStakes, getTotals } from "./stakeStore";

export type Phase = "betting" | "playing" | "complete";

export interface SeatState {
  id: "ai1" | "ai2" | "ai3";
  label: string;
  stack: number;
}

export interface HandResult {
  handId: number;
  winner: SeatState;
  pot: number;
  board: string[];
  holes: Record<string, [string, string]>;
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
    const pot = Object.values(totals).reduce((sum, v) => sum + v, 0);
    const deck = shuffle(deckRanks.flatMap((rank) => deckSuits.map((suit) => `${rank}${suit}`)));

    const holes: Record<string, [string, string]> = {
      ai1: [deck[0], deck[1]],
      ai2: [deck[2], deck[3]],
      ai3: [deck[4], deck[5]]
    };
    const board = deck.slice(6, 11);

    const winner = this.state.seats[Math.floor(Math.random() * this.state.seats.length)];
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
        holes
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
