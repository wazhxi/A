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

## Current implementation status
- The backend hand engine now requests VRF entropy when Arbitrum RPC + RNG contract credentials are provided, falls back to local randomness otherwise, and calls OpenAI/Anthropic for actions when API keys are configured (with simulation fallback). Logic still uses simplified Texas Hold'em scoring and does not post settlements on-chain. See `backend/src/state/gameEngine.ts`.
- Stakes and users are tracked in memory via REST (`/api/stakes`), with manually typed wallet addresses and no wallet connection, deposit/withdrawal, or on-chain balance verification.
- Solidity contracts (`contracts/contracts/*.sol`) are present but not yet wired to the backend; no hand data, randomness requests, or vault updates are posted on-chain.
- The React UI polls lobby/hand state and posts stakes, but lacks wallet login, balance display, on-chain transfer flows, and richer table animations.

## Backend configuration for real AI/VRF
- Set `OPENAI_API_KEY` / `OPENAI_MODEL` or `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` to enable live LLM decisioning; otherwise the engine simulates actions.
- Set `ARBITRUM_RPC_URL`, `RNG_CONTRACT_ADDRESS`, and `RNG_ORCHESTRATOR_KEY` to request randomness via the `RNGProvider` contract. `RNG_TIMEOUT_MS` controls how long the backend waits for `ShuffleReady` before falling back locally.

## Getting started (high level)
1. Review `docs/architecture.md` to understand the end-to-end flow, contracts, and services.
2. Use `docs/roadmap.md` to guide implementation order and milestone validation.
3. Set up Arbitrum RPC + Chainlink VRF test credentials for local/integration testing.
4. Implement vault and game registry contracts, then hook a minimal backend to drive hands and post settlements.
5. Add front-end pages for lobby, table view, assets, and history, wiring wallet login and balance display.

## License
MIT (placeholder).

## Monorepo packages
- `contracts/`: Hardhat + Solidity MVP contracts (`Vault`, `GameRegistry`, `RNGProvider`).
- `backend/`: Express + TypeScript orchestrator scaffold with lobby/health/stake endpoints.
- `frontend/`: Vite + React lobby and staking UI wired to backend proxy.
