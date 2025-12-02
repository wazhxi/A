import { deriveSeed } from "./rng";

const deckRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const deckSuits = ["h", "d", "c", "s"];

export function buildDeck(randomness: bigint) {
  const seed = Number(deriveSeed(randomness) % BigInt(2 ** 32));
  const deck = deckRanks.flatMap((rank) => deckSuits.map((suit) => `${rank}${suit}`));
  const shuffled = shuffle(deck, seed);
  return shuffled;
}

function shuffle<T>(arr: T[], seed: number) {
  const prng = mulberry32(seed);
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
