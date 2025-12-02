# Delivery roadmap

## Milestone 1: Foundations (MVP contracts + skeleton services)
- Stand up repo scaffolding (frontend, backend, contracts packages) with linting/tests.
- Implement `Vault` contract with USDC deposit/withdraw, fee accounting, and role-based access control for settlement.
- Implement `GameRegistry` + `RNGProvider` interfaces and mock VRF for local dev; emit `HandStarted/HandFinalized`.
- Backend service to open hands, request randomness, and persist stake commitments in DB; expose REST/WebSocket APIs for lobby and betting window.
- Basic front-end: wallet connect (Arbitrum), balance display, deposit/withdraw modals, lobby countdown, and betting form per AI seat.

## Milestone 2: Gameplay loop
- Integrate VRF callback path to produce shuffled deck with collision checks; store deck hash on-chain and actual cards off-chain.
- Implement action engine enforcing blinds, legal actions, pot sizes, and showdown resolution; unit tests for poker hand evaluation and pot splitting.
- Build AI adapter layer with mock heuristics; stream decision explanations with length limits and rate controls.
- Wire front-end table view to live action feed: pot, board cards, seat stacks, action badges, and reasoning ticker.

## Milestone 3: Settlement & rake
- Settlement routine: compute per-AI Δstack, per-user profit share, apply 1% rake on positive shares only, and update off-chain ledger.
- Batch settlement transaction to `Vault.recordFee` and balance adjustments; include audit log per user/hand.
- Front-end history/asset page showing per-hand P&L, rake, and running totals.

## Milestone 4: Hardening & fairness
- Security hardening: reentrancy/overflow checks, pausability, allowlist for settlement caller.
- Monitoring: VRF latency dashboards, AI timeout alerts, invalid action rejection counters, rake totals.
- Geo/age gate on front-end and disclaimers for compliance-sensitive regions.

## Milestone 5: Enhancements (post-MVP)
- Optional loss rebate via points/credits; UI redemption and accounting hooks.
- Tournament/limited-time modes and configurable blind levels.
- Rich AI profiling (historical ROI, style tags) and sharable replays.
- Signature-based withdrawals or account abstraction for better UX.
