# Superteam Agentic Engineering Grant — Session & Architecture Dossier (`solana.new`)

- **Applicant:** Kabeer Ahmed (`@kabeer099` / GitHub: [https://github.com/Kabeer099](https://github.com/Kabeer099))
- **Solana Wallet:** `21wpwAaGMSd1sXCy7uZpFG4khSGawGE2bHpwd5iqKkfH`
- **Project Title:** **Hermes x402 Guard — Autonomous Solana Treasury & Multi-DEX Execution Agent**
- **Live Open-Source Prototype & Demo Video:**
  - **Repository:** [https://github.com/Kabeer099/kabeer-arcade/tree/main/swapio-x402-agent](https://github.com/Kabeer099/kabeer-arcade/tree/main/swapio-x402-agent)
  - **1m 52s Video Demo:** [https://files.catbox.moe/em5ku9.mp4](https://files.catbox.moe/em5ku9.mp4)

---

## 1. Prompt Session Output (`"help me apply for the agentic engineering grant by Superteam"` via `solana.new`)

### A. What We Are Building on Solana
**Hermes x402 Guard** is an open-source, non-custodial Solana treasury & execution toolkit built for AI agents and indie Solana teams. Instead of managing fragile API keys or recurring SaaS subscriptions across RPCs and DEX aggregators, Hermes x402 Guard combines:
1. **x402 Pay-Per-Quote Execution on Solana Mainnet (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`):**
   - Integrates Swap.io's `hermes.swap.io` x402 aggregator (`POST /v1/swap/quote`) with automatic HTTP `402 Payment Required` challenge parsing (`0.05 USDC` / `50,000` atomic units via PayAI facilitator `2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4`), `@solana/kit` SPL token transfer signing, and multi-engine quote comparison across **Jupiter, Raydium, Titan, DFlow, and OKX** (`10,000+` requests/hour).
2. **Pre-Trade Solana Token & Authority Safety Gate:**
   - Before signing any swap transaction, the agent inspects the target SPL/Token-2022 mint account on Solana RPC to verify mint authority revocation, freeze authority status, transfer-fee hooks, and Meteora DLMM / Raydium CLMM pool depth so autonomous agents never ape into honeypot or illiquid bins.
3. **Interactive Web Dashboard & CLI (`npx hermes-x402-guard`):**
   - A browser dashboard + CLI where Solana developers and DAO treasuries can configure automated rebalancing rules (e.g., *"Every 6 hours, convert excess SOL yield above 10 SOL into USDC if cross-engine price impact is < 20 bps"*), view real-time x402 receipt logs, and export verifiable SHA-256 execution manifests.

---

## 2. How We Use Agentic Engineering & AI Coding Tools (`solana.new`)

We follow the modern `solana.new` agentic engineering stack:
- **Frontend & Wallet Standard:** `@solana/client` + `@solana/react-hooks` + `@solana/kit` (strictly v2 functional primitives — zero legacy `@solana/web3.js` v1 Technical Debt).
- **Program & Account Verification:** Anchor / Pinocchio program patterns with LiteSVM local simulation before mainnet broadcast.
- **Why the $200 USDG Grant Accelerates Delivery:**
  - We have already shipped the working CLI core and live `hermes.swap.io` x402 challenge/quote verifier ([agent.mjs](https://github.com/Kabeer099/kabeer-arcade/blob/main/swapio-x402-agent/agent.mjs)).
  - The **$200 USDG Agentic Engineering Grant** funds 1 month of top-tier AI coding agent compute to complete the full Next.js + `@solana/react-hooks` web dashboard, LiteSVM pre-flight simulation suite, and public npm package (`hermes-x402-guard`) within 7 days of Tranche 1 approval.
