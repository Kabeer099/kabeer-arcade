# 🥞 FlapJax On-Chain Verifier & Bytecode Inspector (`flapjax-verifier`)

A zero-dependency CLI and single-page browser verifier for the **FLAPJAX** token (`0x90c8889f428F9Ebb77BB8f15CAD3a50a9aC680df`) on BNB Smart Chain (BSC).

Built to verify token supply, burn accounting, treasury reserves, PancakeSwap V3 pool states (`FLAPJAX/WBNB` & `FLAPJAX/BTCB`), NonfungiblePositionManager (`NFPM`) LP positions (`#1456181` & `#5144842`), and the runtime bytecode freeze of `setMode(uint256)` (`0xd72dd3b4`).

## Live Browser Verifier
- **URL:** [https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/](https://kabeer099.github.io/kabeer-arcade/flapjax-verifier/)

## Quick Start (Zero-Dependency Node CLI)

Requires Node.js 18+ (uses built-in `node:https` only — no `npm install` needed).

```bash
git clone https://github.com/Kabeer099/kabeer-arcade.git
cd kabeer-arcade/flapjax-verifier
node verify-flapjax.mjs
```

For machine-readable JSON output:

```bash
node verify-flapjax.mjs --json
```

## What It Verifies on Every Run

1. **Token & Storage Slot Invariants (`0x90c8889f428F9Ebb77BB8f15CAD3a50a9aC680df`)**
   - `totalSupply()` (`0x18160ddd`) & storage slot `0x02` (`44,444,444,444 FLAPJAX`).
   - `owner()` (`0x8da5cb5b`) & storage slot `0x05` (`0x0000000000000000000000000000000000000000`).
   - `_mode()` (`0xc5c03af3`) & storage slot `0x06` (`0` = `MODE_NORMAL`).
   - **Bytecode Proof of `setMode(uint256)` (`0xd72dd3b4`) Double Freeze:** Verifies that the runtime bytecode (`2,901` bytes, `solc 0.8.20`) contains the exact dispatch sequence at `0x0417..0x042f` (`5b6006541561042d5760068190555b5056`) preceded by `PUSH2 0x0818; JUMP` (`_checkOwner`), proving `setMode` is permanently frozen both by renounced ownership (`slot 0x05 == 0`) and by the one-way `SLOAD(0x06) == 0` guard.
2. **Burn & Treasury Accounting**
   - Queries `balanceOf(0x000000000000000000000000000000000000dEaD)`, `balanceOf(0x0000000000000000000000000000000000000000)`, and Treasury `balanceOf(0x7C34E9e21eE28A49Ff0b84B61774119E6633359f)`.
3. **PancakeSwap V3 Pools**
   - `FLAPJAX/WBNB` (`0xca93ec685b8623688e6b236f9068034b298c2150`): `slot0()` (`sqrtPriceX96`, `tick`), active `liquidity()`, and live token reserves.
   - `FLAPJAX/BTCB` (`0x740a3b4a91cb8fa47e85d7f9713ca6ec2f8a037e`): `slot0()`, active `liquidity()`, and live token reserves.
4. **PancakeSwap V3 NFPM LP Position Decomposition (`0x46A15B0b27311cedF172AB29E4f4766fbE7F4364`)**
   - `NFT #1456181`: Verifies `ownerOf` (`0x25c9c4b56e820e0dea438b145284f02d9ca9bd52`, GoPlus Locker), full-range ticks `[-887200, 887200]`, and confirms its liquidity equals `100.0000%` of the `FLAPJAX/WBNB` pool's active `liquidity()`.
   - `NFT #5144842`: Verifies `ownerOf` (`0x8e3dc66bb96b063afb932660fb5d060e170cf2cd`) and ticks `[-214200, -205000]`, proving why it is out-of-range when pool `tick < -214200`.

## License
MIT
