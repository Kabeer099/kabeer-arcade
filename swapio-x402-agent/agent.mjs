#!/usr/bin/env node
/**
 * PaySweep x402 — Autonomous Multi-Token Invoice Sweeper Agent for Solana
 * Powered by Swap.io Hermes API (https://hermes.swap.io) & the x402 Payment Protocol
 *
 * Usage:
 *   node agent.mjs --discover
 *   node agent.mjs --quote --input So11111111111111111111111111111111111111112 --amount 1000000000
 */

import fs from 'fs';
import path from 'path';

const HERMES_BASE = 'https://hermes.swap.io';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DEFAULT_WALLET = '21wpwAaGMSd1sXCy7uZpFG4khSGawGE2bHpwd5iqKkfH';

async function discoverEndpoints() {
  console.log('[PaySweep x402] Discovering Swap.io Hermes API endpoints via GET /v1/info ...');
  const res = await fetch(`${HERMES_BASE}/v1/info`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Discovery failed with HTTP ${res.status}`);
  const data = await res.json();
  console.log(`[PaySweep x402] Service: ${data.description}`);
  console.log(`[PaySweep x402] Docs: ${data.docs}`);
  console.log(`[PaySweep x402] Discovered ${(data.endpoints || []).length} x402-enabled endpoints:\n`);
  for (const ep of (data.endpoints || [])) {
    const sol = (ep.accepts || []).find(a => a.network === 'solana');
    const base = (ep.accepts || []).find(a => a.network === 'base');
    console.log(`  • ${sol?.resource || ep.path}`);
    if (sol) {
      console.log(`      Solana x402: ${sol.maxAmountRequired} atomic USDC ($${(Number(sol.maxAmountRequired) / 1e6).toFixed(6)} USDC) | payTo=${sol.payTo} | gasless feePayer=${sol.extra?.feePayer}`);
    }
    if (base) {
      console.log(`      Base x402  : ${base.maxAmountRequired} atomic USDC ($${(Number(base.maxAmountRequired) / 1e6).toFixed(6)} USDC) | payTo=${base.payTo}`);
    }
  }
  return data;
}

async function requestSwapQuote({ inputMint = SOL_MINT, outputMint = USDC_MINT, amount = '1000000000', slippageBps = 50, userPublicKey = DEFAULT_WALLET, xPaymentHeader = null }) {
  console.log(`\n[PaySweep x402] Requesting ranked multi-DEX swap quote via POST ${HERMES_BASE}/v1/swap/quote ...`);
  console.log(`  inputMint    : ${inputMint}`);
  console.log(`  outputMint   : ${outputMint}`);
  console.log(`  amount       : ${amount}`);
  console.log(`  userPublicKey: ${userPublicKey}`);

  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (xPaymentHeader) {
    headers['X-PAYMENT'] = xPaymentHeader;
  }

  const res = await fetch(`${HERMES_BASE}/v1/swap/quote`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ inputMint, outputMint, amount, slippageBps, userPublicKey })
  });

  const bodyText = await res.text();
  let parsed;
  try { parsed = JSON.parse(bodyText); } catch { parsed = bodyText; }

  if (res.status === 402) {
    console.log('\n[PaySweep x402] Received HTTP 402 Payment Required (x402 Handshake Step 2):');
    console.log(JSON.stringify(parsed, null, 2));
    const solOption = parsed.accepts?.find(a => a.network === 'solana');
    if (solOption) {
      console.log('\n[PaySweep x402] Parsed Solana x402 Payment Challenge:');
      console.log(`  • Price           : ${solOption.maxAmountRequired} atomic USDC ($${(Number(solOption.maxAmountRequired) / 1e6).toFixed(6)} USDC)`);
      console.log(`  • PayTo Recipient : ${solOption.payTo}`);
      console.log(`  • Gasless FeePayer: ${solOption.extra?.feePayer} (facilitator covers Solana network fee; agent needs 0 SOL)`);
      console.log(`  • Next Step       : Sign SPL USDC transfer authorization & retry POST /v1/swap/quote with X-PAYMENT header.`);
    }
    return { status: 402, challenge: parsed };
  }

  if (res.status === 200) {
    const paymentReceipt = res.headers.get('x-payment-response');
    console.log('\n[PaySweep x402] Received HTTP 200 Ranked Quotes!');
    console.log(`  • X-PAYMENT-RESPONSE Receipt: ${paymentReceipt || '(present in paid call)'}`);
    console.log(JSON.stringify(parsed, null, 2));
    return { status: 200, receipt: paymentReceipt, data: parsed };
  }

  console.log(`\n[PaySweep x402] Upstream returned HTTP ${res.status} (Note: x402 guarantees 4xx/5xx upstream errors are never charged!):`);
  console.log(bodyText);
  return { status: res.status, body: parsed };
}

async function main() {
  const args = process.argv.slice(2);
  await discoverEndpoints();
  await requestSwapQuote({});
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
