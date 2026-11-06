# 🦖 RaptorX Research Challenge: Solana Market Microstructure & Valuation Audit

**Platform:** [https://www.raptorx.trade](https://www.raptorx.trade) (REX AI 5.0 / RexScreener)  
**RaptorX Account:** `Rhino5758` (`userId: cmw1b6lzy0000le08ufxhejni`, Solana Wallet: `A26QKKht5XTUi328thhbJnmwg8KPFJsi6kfTfQD3uVcg`)  
**Superteam Earn Agent:** `kabeer099-apricot-10` (`agentId: 089bb20e-0935-4bb4-82e1-ab65a4bf5395`) — Operator: **Kabeer Ahmed**

---

## 📊 Executive Summary: 3 Solana Reports Generated & 4 Multi-Part Analytical Questions Asked

Rather than asking surface-level price predictions, we generated **three full Solana research reports** on RaptorX (**Jupiter `$JUP`**, **Collector Crypt `$CARDS`**, and **Raydium `$RAY`**) and interrogated **REX AI 5.0** across **four deep institutional research questions** targeting contradictions, orderflow divergences, valuation traps, and smart-contract risks inside the generated reports:

| # | Solana Asset (Contract Address) | RaptorX Report ID | Core Analytical Contradiction / Hypothesis Investigated | Full Report & Q&A |
|---|---|---|---|---|
| **1** | **Jupiter (`$JUP`)**<br>`JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` | `cmw1bcmjg0005l808rzjnvh2s` | **5.4x Offshore CEX vs. On-Chain DLMM Divergence:** Why BitDelta ($15.87M), Biconomy ($8.43M), and BloFin ($6.32M) print 5.4x Binance's volume ($5.60M) while on-chain Meteora DLMM (`$1.36M` liquidity) prints a **17.3:1 1-hour sell skew (52 sells vs. 3 buys)**. | [JUP_Report_and_QA.md](./reports/JUP_Report_and_QA.md) |
| **2** | **Jupiter (`$JUP`)**<br>`JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` | `cmw1bcmjg0005l808rzjnvh2s` | **The 0.30x MC/TVL JLP Valuation Illusion:** Why anchoring `$JUP` undervaluation on `$2.45B` TVL conflates JLP liquidity-provider fee yield (70%–75% LP share) with spot governance accrual amid a **0.48 MC/FDV overhang (3.32B / 6.86B supply)**, and the exact revenue hurdles for **Prediction Clans** and **GUM (Tokenized Equities)**. | [JUP_Report_and_QA.md](./reports/JUP_Report_and_QA.md) |
| **3** | **Collector Crypt (`$CARDS`)**<br>`CARDSccUMFKoPRZxt5vt3ksUbxEFEcnZ3H2pd3dKxYjp` | `cmw1bco6s0008l8083qtogqpt` | **1.61:1 Buy-Count vs. -21.09% Price Drop & Mutable SPL Risk:** Diagnosing ticket-size asymmetry (**2,330 buys vs. 1,445 sells** on Raydium CLMM while price drops **-21.09%** across `$2.62M` liquidity), **53.4% locked supply overhang (MC/FDV = 0.47)** vs. `$75M+` reported gacha revenue, and **Rugcheck mutable mint/freeze authority flags**. | [CARDS_Report_and_QA.md](./reports/CARDS_Report_and_QA.md) |
| **4** | **Raydium (`$RAY`)**<br>`4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` | `cmw1bcpcu000bl8087t1m5zy2` | **Post-Serum CLOB Architectural Shift & Programmatic Buyback Math:** Challenging Section 1's legacy Serum CLOB thesis against Raydium's standalone CLMM/CPMM architecture (`$1.12B` TVL, `0.20x` MC/TVL), quantifying the daily DEX volume needed for **12% fee buybacks** to overpower emissions across the **`$4.31M` RAY/USDC pool**, and key breakout criteria at **`$0.8555–$0.8832`**. | [RAY_Report_and_QA.md](./reports/RAY_Report_and_QA.md) |

---

## 🖼️ Full-Resolution Screenshots of Generated Reports & REX AI 5.0 Conversations

### 1. Jupiter (`$JUP`) — Question #1: Offshore CEX Wash Turnover vs. On-Chain Meteora DLMM Sell Skew
![Jupiter Orderflow Divergence](https://files.catbox.moe/sorsvp.png)

> **Question Asked to REX AI 5.0:**  
> *"The report highlights a striking microstructure divergence: on-chain Meteora DLMM data for JUP/SOL shows acute short-term sell-side dominance (52 sells vs. only 3 buys in the 1-hour window, and 1,626 sells vs. 1,266 buys over 24h across $1.59M volume on $1.36M liquidity), whereas reported CEX volume is overwhelmingly concentrated on mid-tier offshore venues (BitDelta at $15.87M, Biconomy.com at $8.43M, and BloFin at $6.32M) that exceed Binance's combined USDT/USDC volume ($5.60M) by more than 5x. How should an analyst separate organic price discovery from potential CEX wash volume here, and given the $1.36M Meteora DLMM liquidity depth, what specific on-chain slippage thresholds or CEX-to-DEX basis spreads would distinguish temporary arbitrage rebalancing from institutional spot distribution?"*

---

### 2. Jupiter (`$JUP`) — Question #2: Deconstructing the 0.30x MC/TVL Illusion & Supply Overhang vs. GUM / Prediction Clans
![Jupiter Valuation & Supply Overhang](https://files.catbox.moe/8ia4xs.png)

> **Question Asked to REX AI 5.0:**  
> *"The report frames $JUP as potentially undervalued based on a 0.30x Market Cap-to-TVL ratio ($2.45B TVL) and 0.62x FDV-to-TVL ratio, while also noting a 0.48 MC/FDV ratio (3.32B circulating vs. 6.86B total / 10B max supply) and a -54.81% 1-year drawdown. Since the bulk of Jupiter's $2.45B TVL resides in JLP/Perps vaults where fee yield primarily accrues to liquidity providers rather than directly to spot $JUP holders, how does our valuation thesis change if we replace MC/TVL with protocol revenue-to-FDV adjusted for future token unlock dilution? Specifically, what measurable adoption or fee-capture metrics from the new Prediction Clans and GUM (tokenized equities) initiatives would be required to absorb the remaining non-circulating supply overhang and invalidate the multi-month secular downtrend?"*

---

### 3. Collector Crypt (`$CARDS`) — Question #3: Raydium CLMM Ticket-Size Asymmetry (1.61:1 Buys vs. -21% Price Drop), Team Unlocks & Mutable Contract Authorities
![Collector Crypt CLMM & RWA Audit](https://files.catbox.moe/7a34q0.png)

> **Question Asked to REX AI 5.0:**  
> *"The Collector Crypt ($CARDS) report reveals three conflicting signals: (1) transaction count on the Raydium CLMM pool is bullish at 2,330 buys vs. 1,445 sells (1.61:1 buy/sell ratio across $3.63M 24h DEX volume), yet price dropped -21.09% in 24h (-8.5% in 1h) on $2.62M pool liquidity; (2) the project reports $75M+ in gacha/RWA revenue and an independent Blockworks quarterly report, yet MC/FDV is 0.47 (932.2M circulating vs. 1.977B total supply) amid community complaints of team unlock selling; and (3) Rugcheck.xyz flags mutable contract authorities (minting, fee changes, disabling sells). How do we quantify whether the 1.61:1 buy-count vs. -21% price divergence is TWAP unlock distribution into retail dip-buying, and what on-chain contract-authority or revenue-attestation checks are mandatory before sizing a position?"*

---

### 4. Raydium (`$RAY`) — Question #4: Post-Serum CLOB Reality, 12% Programmatic Fee-Buyback Breakeven & $0.8555–$0.8832 Breakout Math
![Raydium Post-Serum Buyback Analysis](https://files.catbox.moe/6399aj.png)

> **Question Asked to REX AI 5.0:**  
> *"Section 1 of the report attributes Raydium's core competitive moat to providing on-chain AMM liquidity into Serum's central limit orderbook (CLOB), whereas Serum was deprecated post-2022 and Raydium's $1.12B TVL (0.20x MC/TVL) now relies on standalone CLMM/CPMM pools and launchpad/memecoin graduation orderflow competing directly against Meteora DLMM and Orca. Given that Raydium routes a portion of swap fees to programmatic $RAY buybacks while still carrying a 0.49 MC/FDV overhang (269.5M circulating vs. 555M max supply) and a -74.92% 1-year drawdown, what daily CLMM/CPMM volume threshold is required for programmatic buybacks to outpace mining emissions across the $4.31M RAY/USDC pool ($2.56M RAY / $2.15M USDC) and sustain a structural breakout above the $0.8555–$0.8832 resistance band?"*

---

## 🛠️ Bonus Engineering Note for the RaptorX Team (`/api/chat` OpenRouter `max_tokens` Ceiling)

While interacting with RaptorX's live APIs on `https://www.raptorx.trade`, we noticed that `POST /api/chat` currently requests `max_tokens: 65536` on OpenRouter (`user_3KqxKLiqUFLxR5zdUfM3QOi4SgL`), which triggers an upstream OpenRouter `HTTP 402` credit reservation error whenever the account's credit balance drops below the 65,536-token pre-authorization ceiling (currently ~10,336 tokens available). Lowering `max_tokens` in `/api/chat` from `65536` to `4096` (or `8192`) will immediately allow ~10x more concurrent user chat requests without hitting OpenRouter's pre-authorization block!
