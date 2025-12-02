export interface StakeEntry {
  user: string;
  aiId: string;
  amount: number;
}

const stakeBook: StakeEntry[] = [];

export function addStake(entry: StakeEntry): StakeEntry {
  stakeBook.push(entry);
  return entry;
}

export function clearStakes() {
  stakeBook.splice(0, stakeBook.length);
}

export function getTotals() {
  const totals = stakeBook.reduce<Record<string, number>>((memo, entry) => {
    memo[entry.aiId] = (memo[entry.aiId] || 0) + entry.amount;
    return memo;
  }, {});
  return { totals, stakes: [...stakeBook] };
}
