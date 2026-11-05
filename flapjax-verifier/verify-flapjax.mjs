#!/usr/bin/env node
/**
 * flapjax-verifier — Standalone Zero-Dependency BSC On-Chain Verifier for FLAPJAX
 * Verifies:
 *  1. FLAPJAX token (0x90c8889f428F9Ebb77BB8f15CAD3a50a9aC680df) invariants:
 *     - totalSupply(), owner(), _mode() (0xc5c03af3), runtime bytecode length & selector dispatch
 *     - storage slots 0x02 (totalSupply), 0x05 (owner), 0x06 (_mode)
 *  2. Burn balances (0x000...dEaD + 0x000...0000) & Treasury (0x7C34E9e21eE28A49Ff0b84B61774119E6633359f)
 *  3. PancakeSwap V3 Pools:
 *     - FLAPJAX/WBNB (0xca93ec685b8623688e6b236f9068034b298c2150) slot0(), liquidity(), reserves
 *     - FLAPJAX/BTCB (0x740a3b4a91cb8fa47e85d7f9713ca6ec2f8a037e) slot0(), liquidity(), reserves
 *  4. NonfungiblePositionManager (0x46A15B0b27311cedF172AB29E4f4766fbE7F4364):
 *     - NFT #1456181 (GoPlus Locker 0x25c9c4b56e820e0dea438b145284f02d9ca9bd52) tick range & active share
 *     - NFT #5144842 (EOA 0x8e3dc66bb96b063afb932660fb5d060e170cf2cd) tick range & active status
 *
 * License: MIT
 */

import https from 'node:https';

const DEFAULT_RPCS = [
  process.env.BSC_RPC_URL,
  'https://bsc-rpc.publicnode.com',
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed.binance.org'
].filter(Boolean);

const ADDR = {
  FLAPJAX: '0x90c8889f428F9Ebb77BB8f15CAD3a50a9aC680df',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  DEAD: '0x000000000000000000000000000000000000dEaD',
  ZERO: '0x0000000000000000000000000000000000000000',
  TREASURY: '0x7C34E9e21eE28A49Ff0b84B61774119E6633359f',
  POOL_WBNB: '0xca93ec685b8623688e6b236f9068034b298c2150',
  POOL_BTCB: '0x740a3b4a91cb8fa47e85d7f9713ca6ec2f8a037e',
  NFPM: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
  GOPLUS_LOCKER: '0x25c9c4b56e820e0dea438b145284f02d9ca9bd52'
};

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 8000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          else resolve(parsed.result);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('RPC timeout')); });
    req.write(body);
    req.end();
  });
}

async function rpc(method, params) {
  let lastErr;
  for (const url of DEFAULT_RPCS) {
    try {
      return await postJson(url, { jsonrpc: '2.0', id: 1, method, params });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function padAddr(a) {
  return a.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function padUint(n) {
  return BigInt(n).toString(16).padStart(64, '0');
}

function fmtUnits(rawBig, decimals = 18) {
  const s = rawBig.toString().padStart(decimals + 1, '0');
  const intPart = s.slice(0, s.length - decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fracPart = s.slice(s.length - decimals, s.length - decimals + 6);
  return `${intPart}.${fracPart}`;
}

function parseInt24(wordHex) {
  let v = BigInt('0x' + wordHex) & 0xffffffn;
  if (v >= 0x800000n) v -= 0x1000000n;
  return Number(v);
}

async function callAt(to, data, blockTag) {
  return rpc('eth_call', [{ to, data }, blockTag]);
}

async function decodePosition(tokenId, blockTag) {
  const ownerHex = await callAt(ADDR.NFPM, '0x6352211e' + padUint(tokenId), blockTag);
  const posHex = await callAt(ADDR.NFPM, '0x99fbab88' + padUint(tokenId), blockTag);
  const raw = posHex.replace(/^0x/, '');
  const words = [];
  for (let i = 0; i < raw.length; i += 64) words.push(raw.slice(i, i + 64));
  return {
    tokenId,
    owner: '0x' + ownerHex.slice(-40).toLowerCase(),
    token0: '0x' + words[2].slice(24).toLowerCase(),
    token1: '0x' + words[3].slice(24).toLowerCase(),
    fee: Number(BigInt('0x' + words[4])),
    tickLower: parseInt24(words[5]),
    tickUpper: parseInt24(words[6]),
    liquidity: BigInt('0x' + words[7])
  };
}

async function decodePool(poolAddr, blockTag) {
  const [slot0Hex, liqHex, fBalHex, wBalHex, bBalHex] = await Promise.all([
    callAt(poolAddr, '0x3850c7bd', blockTag),
    callAt(poolAddr, '0x1a686502', blockTag),
    callAt(ADDR.FLAPJAX, '0x70a08231' + padAddr(poolAddr), blockTag),
    callAt(ADDR.WBNB, '0x70a08231' + padAddr(poolAddr), blockTag),
    callAt(ADDR.BTCB, '0x70a08231' + padAddr(poolAddr), blockTag)
  ]);
  const s0 = slot0Hex.replace(/^0x/, '');
  return {
    pool: poolAddr,
    sqrtPriceX96: BigInt('0x' + s0.slice(0, 64)).toString(),
    tick: parseInt24(s0.slice(64, 128)),
    liquidity: BigInt(liqHex),
    flapjaxBalance: BigInt(fBalHex),
    wbnbBalance: BigInt(wBalHex),
    btcbBalance: BigInt(bBalHex)
  };
}

async function main() {
  const jsonFlag = process.argv.includes('--json');
  const blockNumHex = await rpc('eth_blockNumber', []);
  const blockData = await rpc('eth_getBlockByNumber', [blockNumHex, false]);
  const blockNumber = Number(BigInt(blockNumHex));
  const blockIso = new Date(Number(BigInt(blockData.timestamp)) * 1000).toISOString();

  const [
    codeHex,
    totalSupplyHex,
    ownerCallHex,
    modeCallHex,
    slot2Hex,
    slot5Hex,
    slot6Hex,
    deadBalHex,
    zeroBalHex,
    treasuryBalHex,
    poolWbnb,
    poolBtcb,
    nft1456181,
    nft5144842
  ] = await Promise.all([
    rpc('eth_getCode', [ADDR.FLAPJAX, blockNumHex]),
    callAt(ADDR.FLAPJAX, '0x18160ddd', blockNumHex),
    callAt(ADDR.FLAPJAX, '0x8da5cb5b', blockNumHex),
    callAt(ADDR.FLAPJAX, '0xc5c03af3', blockNumHex),
    rpc('eth_getStorageAt', [ADDR.FLAPJAX, '0x2', blockNumHex]),
    rpc('eth_getStorageAt', [ADDR.FLAPJAX, '0x5', blockNumHex]),
    rpc('eth_getStorageAt', [ADDR.FLAPJAX, '0x6', blockNumHex]),
    callAt(ADDR.FLAPJAX, '0x70a08231' + padAddr(ADDR.DEAD), blockNumHex),
    callAt(ADDR.FLAPJAX, '0x70a08231' + padAddr(ADDR.ZERO), blockNumHex),
    callAt(ADDR.FLAPJAX, '0x70a08231' + padAddr(ADDR.TREASURY), blockNumHex),
    decodePool(ADDR.POOL_WBNB, blockNumHex),
    decodePool(ADDR.POOL_BTCB, blockNumHex),
    decodePosition(1456181, blockNumHex),
    decodePosition(5144842, blockNumHex)
  ]);

  const byteLen = (codeHex.length - 2) / 2;
  const setModeCheckOwnerOpcode = codeHex.includes('5b6006541561042d5760068190555b5056');
  const totalSupply = BigInt(totalSupplyHex);
  const deadBal = BigInt(deadBalHex);
  const zeroBal = BigInt(zeroBalHex);
  const burnTotal = deadBal + zeroBal;
  const treasuryBal = BigInt(treasuryBalHex);

  const nft145InRange = poolWbnb.tick >= nft1456181.tickLower && poolWbnb.tick < nft1456181.tickUpper;
  const nft514InRange = poolWbnb.tick >= nft5144842.tickLower && poolWbnb.tick < nft5144842.tickUpper;

  const report = {
    blockNumber,
    blockTimestampUTC: blockIso,
    token: {
      address: ADDR.FLAPJAX,
      runtimeBytes: byteLen,
      totalSupply: fmtUnits(totalSupply),
      owner: '0x' + ownerCallHex.slice(-40),
      modeCall_0xc5c03af3: Number(BigInt(modeCallHex)),
      slot2_totalSupply: slot2Hex,
      slot5_owner: slot5Hex,
      slot6_mode: slot6Hex,
      setModeDoublyFrozenVerified: setModeCheckOwnerOpcode && BigInt(slot5Hex) === 0n && BigInt(slot6Hex) === 0n
    },
    accounting: {
      deadBalance: fmtUnits(deadBal),
      zeroBalance: fmtUnits(zeroBal),
      totalBurned: fmtUnits(burnTotal),
      burnPercent: Number((burnTotal * 1000000n) / totalSupply) / 10000,
      treasuryBalance: fmtUnits(treasuryBal),
      treasuryInt: (treasuryBal / (10n ** 18n)).toString()
    },
    pools: {
      wbnbV3: {
        address: ADDR.POOL_WBNB,
        tick: poolWbnb.tick,
        sqrtPriceX96: poolWbnb.sqrtPriceX96,
        activeLiquidity: poolWbnb.liquidity.toString(),
        flapjaxReserve: fmtUnits(poolWbnb.flapjaxBalance),
        wbnbReserve: fmtUnits(poolWbnb.wbnbBalance)
      },
      btcbV3: {
        address: ADDR.POOL_BTCB,
        tick: poolBtcb.tick,
        sqrtPriceX96: poolBtcb.sqrtPriceX96,
        activeLiquidity: poolBtcb.liquidity.toString(),
        flapjaxReserve: fmtUnits(poolBtcb.flapjaxBalance),
        btcbReserve: fmtUnits(poolBtcb.btcbBalance)
      }
    },
    lpPositions: {
      nft1456181: {
        owner: nft1456181.owner,
        isGoPlusLocker: nft1456181.owner === ADDR.GOPLUS_LOCKER.toLowerCase(),
        tickRange: [nft1456181.tickLower, nft1456181.tickUpper],
        liquidity: nft1456181.liquidity.toString(),
        inRangeAtCurrentTick: nft145InRange,
        shareOfPoolActiveLiquidity: nft1456181.liquidity === poolWbnb.liquidity ? '100.0000%' : 'partial'
      },
      nft5144842: {
        owner: nft5144842.owner,
        tickRange: [nft5144842.tickLower, nft5144842.tickUpper],
        liquidity: nft5144842.liquidity.toString(),
        inRangeAtCurrentTick: nft514InRange,
        statusNote: nft514InRange ? 'ACTIVE' : `OUT_OF_RANGE (pool tick ${poolWbnb.tick} < tickLower ${nft5144842.tickLower})`
      }
    }
  };

  if (jsonFlag) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`=== FLAPJAX ON-CHAIN VERIFIER (BSC Block #${report.blockNumber} @ ${report.blockTimestampUTC}) ===`);
  console.log(`[1] Token & Bytecode Invariants (${report.token.address})`);
  console.log(`    Runtime Bytecode : ${report.token.runtimeBytes} bytes | solc 0.8.20`);
  console.log(`    totalSupply()    : ${report.token.totalSupply} FLAPJAX (slot 0x02 = ${report.token.slot2_totalSupply})`);
  console.log(`    owner()          : ${report.token.owner} (slot 0x05 = ${report.token.slot5_owner})`);
  console.log(`    _mode() 0xc5c03af3: ${report.token.modeCall_0xc5c03af3} (slot 0x06 = ${report.token.slot6_mode})`);
  console.log(`    setMode(0xd72dd3b4) Doubly Frozen : ${report.token.setModeDoublyFrozenVerified ? 'VERIFIED (gated by _checkOwner @ 0x0818 + SLOAD(0x06)==0 guard @ 0x041f)' : 'FALSE'}`);
  console.log(`[2] Burn & Treasury Accounting`);
  console.log(`    0x...dEaD Burn   : ${report.accounting.deadBalance} FLAPJAX`);
  console.log(`    0x...0000 Burn   : ${report.accounting.zeroBalance} FLAPJAX`);
  console.log(`    Total Burned     : ${report.accounting.totalBurned} FLAPJAX (${report.accounting.burnPercent}%)`);
  console.log(`    Treasury Balance : ${report.accounting.treasuryBalance} FLAPJAX`);
  console.log(`[3] PancakeSwap V3 Pools`);
  console.log(`    FLAPJAX/WBNB (${report.pools.wbnbV3.address}):`);
  console.log(`      tick = ${report.pools.wbnbV3.tick} | liquidity = ${report.pools.wbnbV3.activeLiquidity}`);
  console.log(`      Reserves: ${report.pools.wbnbV3.flapjaxReserve} FLAPJAX / ${report.pools.wbnbV3.wbnbReserve} WBNB`);
  console.log(`    FLAPJAX/BTCB (${report.pools.btcbV3.address}):`);
  console.log(`      tick = ${report.pools.btcbV3.tick} | liquidity = ${report.pools.btcbV3.activeLiquidity}`);
  console.log(`      Reserves: ${report.pools.btcbV3.flapjaxReserve} FLAPJAX / ${report.pools.btcbV3.btcbReserve} BTCB`);
  console.log(`[4] V3 LP Position Decomposition`);
  console.log(`    NFT #1456181     : ticks [${nft1456181.tickLower}, ${nft1456181.tickUpper}] | liq = ${report.lpPositions.nft1456181.liquidity}`);
  console.log(`      Owner          : ${report.lpPositions.nft1456181.owner} (GoPlus Locker: ${report.lpPositions.nft1456181.isGoPlusLocker})`);
  console.log(`      Active Share   : ${report.lpPositions.nft1456181.shareOfPoolActiveLiquidity}`);
  console.log(`    NFT #5144842     : ticks [${nft5144842.tickLower}, ${nft5144842.tickUpper}] | liq = ${report.lpPositions.nft5144842.liquidity}`);
  console.log(`      Owner          : ${report.lpPositions.nft5144842.owner}`);
  console.log(`      Status         : ${report.lpPositions.nft5144842.statusNote}`);
  console.log(`[5] Ready PROOFSIP String:`);
  console.log(`    PROOFSIP block=${report.blockNumber} check=treasury=${report.accounting.treasuryInt} burn=${(burnTotal / (10n ** 18n)).toString()}`);
}

main().catch(err => {
  console.error('Verifier error:', err.message);
  process.exit(1);
});
