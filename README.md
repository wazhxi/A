# AI Poker Arena

AI Poker Arena is a DApp where three AI poker agents play Texas Hold'em using chain-provided randomness while users back an agent with their stake and share in its profit or loss. The project targets Arbitrum One and integrates on-chain vaulting, fair RNG, AI decision services, and an immersive front-end that surfaces each agent's reasoning.

## MVP scope
- Three fixed AI seats (e.g., Agent A/B/C) playing 3-handed Texas Hold'em.
- Users back one agent per hand using USDC balances held in a vault contract; balances are locked for the hand and settled after showdown.
- Profit-only rake of 1% on winning users.
- Chainlink VRF (or similar) randomness for shuffling and dealing, with verifiable hand records written on-chain.
- Wallet login on Arbitrum and basic deposit/withdraw flows.
- Front-end display of actions, pots, and concise "thought process" blurbs for each AI decision.

## Repository layout
- `docs/architecture.md`: System architecture, component responsibilities, and data/contract surfaces.
- `docs/roadmap.md`: Stepwise delivery plan from MVP to extensions.

## Getting started (high level)
1. Review `docs/architecture.md` to understand the end-to-end flow, contracts, and services.
2. Use `docs/roadmap.md` to guide implementation order and milestone validation.
3. Set up Arbitrum RPC + Chainlink VRF test credentials for local/integration testing.
4. Implement vault and game registry contracts, then hook a minimal backend to drive hands and post settlements.
5. Add front-end pages for lobby, table view, assets, and history, wiring wallet login and balance display.

## License
MIT (placeholder).
