# AI Poker Arena Architecture

## Component overview
- **Frontend (React/Next.js)**: Wallet connection (EIP-4361 optional), lobby and table UI, deposit/withdraw forms, live hand visualization, AI reasoning display with typing effect, and history views.
- **Backend Orchestrator (Node.js/Python)**: Drives hand lifecycle (seating, blinds, betting rounds), validates AI actions, enforces bet sizing, triggers VRF requests, manages state persistence, and calls settlement into on-chain contracts.
- **AI Agent Adapters**: Per-model wrapper for three AIs (Agent A/B/C). Normalize input state (hole cards, board, stacks, pot, action history, risk profile) and output (action type + amount + decision explanation). Includes guardrails on bet sizing and output length.
- **Smart Contracts (Solidity on Arbitrum One)**:
  - `Vault`: Custodies USDC deposits/withdrawals; tracks user balances; records cumulative rake.
  - `GameRegistry`: Stores per-hand metadata (hand ID, seat assignments, VRF request ID, dealt cards hash, starting/ending stacks) for auditability.
  - `RNGProvider`: Integrates Chainlink VRF (or similar) to supply entropy for deck shuffling; exposes callback restricted to the registry/orchestrator.

## Data flow by phase
1. **Deposit & balance**
   - User deposits USDC into `Vault` via front-end; contract emits `Deposit` and updates balance mapping.
   - Backend reads balances through on-chain calls; UI displays available balance.
2. **Betting window**
   - Backend opens a hand with countdown (e.g., 60s) and exposes an API for users to back AI1/AI2/AI3 with an amount ≤ available balance.
   - Amounts are locked off-chain against the upcoming hand; aggregate per-AI stack = sum of backers' stakes.
3. **VRF shuffle & deal**
   - Orchestrator requests randomness from `RNGProvider`; callback seeds a deterministic shuffle that avoids card collisions.
   - `GameRegistry` records hand ID, VRF request, and deck hash; dealt hole cards/board remain off-chain but can be proved via commitments if needed.
4. **Action loops**
   - For each decision point, orchestrator sends normalized state to the seat's AI adapter.
   - Adapter returns action and explanation; orchestrator clamps to legal range (no negative bets, not exceeding stack) and applies action to pots/stacks.
   - Front-end streams both the mechanical action (chips, pot) and the explanation text.
5. **Showdown & settlement**
   - Determine winner using Texas Hold'em rules; split pots if needed.
   - Compute each AI's Δstack = `endStack - startStack`; `GameRegistry` stores the final stacks.
   - For each backer on an AI: profit share = Δstack × (userStake / totalStakeOnAI). Apply 1% rake on positive profit shares only. Update off-chain ledger, then settle to `Vault` in batches.
6. **Withdrawal**
   - User initiates withdrawal; back-end verifies off-chain balance and calls `Vault.withdraw` on behalf of the user (or signs a permit-based withdrawal).

## Key contract surfaces
- **Vault**
  - `deposit(amount)`
  - `withdraw(amount)` (access-controlled or signature-based)
  - `recordFee(user, amount)` (callable only by settlement role)
  - Events: `Deposit`, `Withdraw`, `FeeCollected`
- **GameRegistry**
  - `startHand(handId, seats, vrfRequestId, startStacks)`
  - `finalizeHand(handId, endStacks, deckHash)`
  - Events: `HandStarted`, `HandFinalized`
- **RNGProvider**
  - `requestShuffle(handId)`
  - `fulfillRandomWords(requestId, randomness)` -> emits `ShuffleReady`

## Persistence and observability
- Database (PostgreSQL/MongoDB) stores user stakes per hand, AI action logs, reasoning text, and settlement calculations for audits.
- Logs/metrics capture VRF request latency, AI response latency, invalid action trims, and rake totals.
- Front-end consumes WebSocket/Server-Sent Events for real-time table updates and reasoning streams.

## Security & controls
- Contracts gated so only a designated settlement role can mutate hand records or fees.
- Orchestrator validates AI actions and caps explanation length to prevent UI overflow.
- VRF deck generation includes no-reuse checks and recorded hashes for transparency.
- Geolocation gating and age/region disclaimers applied on front-end where required.
