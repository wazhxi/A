# Implementation status

This document summarizes which MVP features are still missing or only simulated as of the latest changes.

## AI gameplay
- The backend game engine generates random decks, chooses simple scripted actions, and picks a winner by naive card scoring; it does **not** call external AI models or implement full Texas Hold'em rules. Decisions are AI-flavored text only. See `backend/src/state/gameEngine.ts` for the simulation logic. 

## Wallets, balances, and staking
- Stakes are recorded in memory via `backend/src/state/stakeStore.ts` and submitted through REST without wallet signatures. There is no on-chain balance verification, deposit, withdrawal, or rake settlement path in the backend or UI.

## Chain integration
- Solidity contracts (`contracts/contracts/*.sol`) exist but are not wired to backend flows. The game engine does not request VRF randomness, store hand data on-chain, or settle against the `Vault`/`GameRegistry` contracts.

## Front-end gaps
- The React UI polls lobby state and submits stakes with a typed wallet address, but lacks wallet connection, balance display, deposit/withdraw actions, and real-time action/animation beyond the simulated logs.
