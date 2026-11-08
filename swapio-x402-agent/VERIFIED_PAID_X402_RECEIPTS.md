# PaySweep x402: Autonomous Multi-Token Invoice Sweeper Agent for Solana (`Swap.io` × `x402`)

**Built for the `@swapdotio` × `@Superteam` x402 Use Case Pitch Bounty (`+30% Working Demo Bonus Verified`)**  
**Author:** Kabeer Ahmed (`@kabeerahmed0120` · GitHub: `@Kabeer099`)  
**Live API Targeted:** `https://hermes.swap.io` (`Swap.io` Hermes Agent API over the `routhex` routing engine)  

---

## 🔥 Live Verified Paid `x402` Calls & On-Chain Settlement Receipts (`HTTP 200 OK`)

We executed the complete **end-to-end paid `x402` flow** against `https://hermes.swap.io` (`POST /v1/swap/quote` followed by `POST /v1/swap/build-tx` passing `best.providerQuote`), paying in `USDC` via gasless `x402` EIP-3009 authorization and verifying the `X-PAYMENT-RESPONSE` on-chain settlement receipts:

| Step | Endpoint Called | Price Paid (`USDC`) | HTTP Status | Decoded `X-PAYMENT-RESPONSE` On-Chain Settlement Receipt |
| :--- | :--- | :--- | :--- | :--- |
| **1. Multi-DEX Quote** | `POST https://hermes.swap.io/v1/swap/quote` | **`$0.003007 USDC`** (`3007` atomic) | **`200 OK`** (`5` ranked quotes: `OKX DEX`, `DFlow`, `0x`, `Autobahn`, `Metis/Jupiter` — best: `1 SOL -> 89.459393 USDC`) | **Tx:** [`0x79d84df9c7bff38f77952fbbd4429031049f6e4246eedb94226194632f46e161`](https://basescan.org/tx/0x79d84df9c7bff38f77952fbbd4429031049f6e4246eedb94226194632f46e161) (`success: true`, `payer: 0xac958f0925a31a2c3844179ab62f12d480baa76d`) |
| **2. Build Unsigned Swap Tx** | `POST https://hermes.swap.io/v1/swap/build-tx` | **`$0.003000 USDC`** (`3000` atomic) | **`200 OK`** (Returned unsigned base64 Solana `VersionedTransaction` for `21wpwAaGMSd1sXCy7uZpFG4khSGawGE2bHpwd5iqKkfH`) | **Tx:** [`0x23fc879eab51f8bbfa3104540d575a23cbb99689f11ca207d90a85f0859bc650`](https://basescan.org/tx/0x23fc879eab51f8bbfa3104540d575a23cbb99689f11ca207d90a85f0859bc650) (`success: true`, `payer: 0xac958f0925a31a2c3844179ab62f12d480baa76d`) |

### Verbatim `X-PAYMENT-RESPONSE` Receipts (from [`hermes_200_paid_quote.json`](./hermes_200_paid_quote.json) & [`hermes_200_paid_build_tx.json`](./hermes_200_paid_build_tx.json))

```json
{
  "quoteCall": {
    "status": 200,
    "amountPaidAtomicUsdc": "3007",
    "xPaymentResponseRaw": "eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4NzlkODRkZjljN2JmZjM4Zjc3OTUyZmJiZDQ0MjkwMzEwNDlmNmU0MjQ2ZWVkYjk0MjI2MTk0NjMyZjQ2ZTE2MSIsIm5ldHdvcmsiOiJiYXNlIiwicGF5ZXIiOiIweGFjOTU4ZjA5MjVhMzFhMmMzODQ0MTc5YWI2MmYxMmQ0ODBiYWE3NmQifQ==",
    "xPaymentResponseDecoded": {
      "success": true,
      "transaction": "0x79d84df9c7bff38f77952fbbd4429031049f6e4246eedb94226194632f46e161",
      "network": "base",
      "payer": "0xac958f0925a31a2c3844179ab62f12d480baa76d"
    },
    "topRankedQuotes": [
      { "provider": "OKX DEX (okx-dex)", "input": "1.0 SOL", "output": "89.459393 USDC" },
      { "provider": "DFlow (dflow)", "input": "1.0 SOL", "output": "89.457797 USDC" },
      { "provider": "0x (zerox)", "input": "1.0 SOL", "output": "89.456011 USDC" },
      { "provider": "Autobahn (autobahn)", "input": "1.0 SOL", "output": "89.454660 USDC" },
      { "provider": "Metis / Jupiter (jupiter)", "input": "1.0 SOL", "output": "89.439517 USDC" }
    ]
  },
  "buildTxCall": {
    "status": 200,
    "amountPaidAtomicUsdc": "3000",
    "xPaymentResponseRaw": "eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4MjNmYzg3OWVhYjUxZjhiYmZhMzEwNDU0MGQ1NzVhMjNjYmI5OTY4OWYxMWNhMjA3ZDkwYTg1ZjA4NTliYzY1MCIsIm5ldHdvcmsiOiJiYXNlIiwicGF5ZXIiOiIweGFjOTU4ZjA5MjVhMzFhMmMzODQ0MTc5YWI2MmYxMmQ0ODBiYWE3NmQifQ==",
    "xPaymentResponseDecoded": {
      "success": true,
      "transaction": "0x23fc879eab51f8bbfa3104540d575a23cbb99689f11ca207d90a85f0859bc650",
      "network": "base",
      "payer": "0xac958f0925a31a2c3844179ab62f12d480baa76d"
    }
  }
}
```

---

## 1. The Concrete Scenario: Why Autonomous Invoice Sweeping Needs `x402`

Freelancers, indie SaaS tools, DAO treasuries, and autonomous AI worker agents on Solana frequently receive client or bounty payments in volatile SPL tokens (`SOL`, `JUP`, `PYTH`, `BONK`, `RAY`). To protect working capital without manual intervention, an autonomous background agent (**`PaySweep x402`**) watches the recipient wallet and immediately sweeps incoming non-stablecoin tokens into **`USDC`**.

### Why `Swap.io` Hermes (`https://hermes.swap.io`) + `x402` Beats Legacy API Keys & Subscriptions
- **Zero API Keys, Zero Subscriptions:** Every HTTP request pays for itself on-demand (`$0.003007 USDC` per quote + `$0.003000 USDC` per build-tx = **`$0.006007 USDC` total per full swap**). Sweeping **50 invoices/month costs just `$0.30 USDC` total** (`99.4%` cheaper than a `$49/mo` plan).
- **100% Gasless Payment Settlement:** Facilitator covers network gas fees on both Solana (`feePayer: 2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4`) and Base (`EIP-3009 TransferWithAuthorization`).
- **Zero Charge on Upstream Errors:** `4xx/5xx` upstream errors never settle payment.
- **Cryptographic Audit Trail (`X-PAYMENT-RESPONSE`):** Every paid `HTTP 200` response carries a verifiable on-chain transaction hash.

---

## 2. Included Files
- [`agent.mjs`](./agent.mjs) — Node.js 22+ CLI agent for `hermes.swap.io` discovery, `x402` payment signing, and `X-PAYMENT-RESPONSE` verification
- [`hermes_200_paid_quote.json`](./hermes_200_paid_quote.json) — Full live capture of paid `POST /v1/swap/quote` (`HTTP 200 OK`, 5 ranked quotes + BaseScan Tx `0x79d84df9...`)
- [`hermes_200_paid_build_tx.json`](./hermes_200_paid_build_tx.json) — Full live capture of paid `POST /v1/swap/build-tx` (`HTTP 200 OK`, unsigned Solana swap tx + BaseScan Tx `0x23fc879e...`)
- [`hermes_v1_info.json`](./hermes_v1_info.json) — Full live capture of `GET https://hermes.swap.io/v1/info` (all 12 endpoints)
- [`hermes_402_challenge.json`](./hermes_402_challenge.json) — Full live capture of `POST https://hermes.swap.io/v1/swap/quote` (`HTTP 402` challenge)
