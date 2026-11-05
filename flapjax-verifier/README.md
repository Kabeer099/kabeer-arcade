# 🥞 FlapJax Payout Receipt & On-Chain Verifier (`flapjax-verifier`)

A zero-dependency CLI and single-page browser verifier for the **FLAPJAX** token (`0x90c8889f428F9Ebb77BB8f15CAD3a50a9aC680df`) and Treasury payouts (`0x7C34E9e21eE28A49Ff0b84B61774119E6633359f`) on BNB Smart Chain (BSC).

Designed with **two strictly separated verification modes** per the FlapJax Rung-4 Tool specification:
- **Mode A — Free Treasury Payout Tx Receipt Checker (`--tx` / `--test`):** Verifies any BSC transaction hash on-chain (`eth_getTransactionReceipt`), checks that `status == 0x1`, confirms a genuine `FLAPJAX` `Transfer` log was emitted from the FlapJax Treasury (`0x7C34E9e21eE28A49Ff0b84B61774119E6633359f`), and validates that the recipient matches the claimed `--wallet <address>` when one is provided.
- **Mode B — Full Token, Bytecode & Pool State Audit (default):** Verifies token supply, burn accounting, treasury reserves, PancakeSwap V3 pool states (`FLAPJAX/WBNB` & `FLAPJAX/BTCB`), NonfungiblePositionManager (`NFPM`) LP positions (`#1456181` & `#5144842`), and the runtime bytecode freeze of `setMode(uint256)` (`0xd72dd3b4`).

## Live Browser Verifier
- **Web App:** [https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/](https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/)
- **Original SVG Meme (`Compute is Calories`):** [https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/compute-calories-meme.svg](https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/compute-calories-meme.svg)

## Quick Start (Zero-Dependency Node CLI)

Requires Node.js 18+ (uses built-in `node:https` & `node:dns` only — no `npm install` needed).

```bash
git clone https://github.com/Kabeer099/kabeer-arcade.git
cd kabeer-arcade/flapjax-verifier
```

### 1. Run the 3-Case Payout Receipt Test Suite (`--test`)
Runs against a known FlapJax Treasury payout tx (`0xe588d112d726b0c75acae3305138670c12d5f12e45db2afcb07d3941cfb30963`), a mismatched claim wallet, and a known non-payout PancakeSwap V3 swap tx (`0x0db5105d4c0d70221996fba9d07425726ddb98ec2a3d2d899047f7a92c8cd271`):

```bash
node verify-flapjax.mjs --test
```

### 2. Verify Any Specific Payout Tx & Claimed Wallet (`--tx` / `--wallet`)
```bash
node verify-flapjax.mjs --tx 0xe588d112d726b0c75acae3305138670c12d5f12e45db2afcb07d3941cfb30963 --wallet 0xAC958F0925a31a2C3844179Ab62F12d480BaA76D
```

### 3. Run the Full On-Chain Token, Bytecode & V3 Pool Audit
```bash
node verify-flapjax.mjs
```

For machine-readable JSON output:
```bash
node verify-flapjax.mjs --json
```

## License
MIT
