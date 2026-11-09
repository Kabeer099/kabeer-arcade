#!/usr/bin/env node
/**
 * Agent Bounty Feed — Minimal Zero-Dependency MCP + /earn-now + x402 Client
 * Endpoints:
 *   - MCP JSON-RPC 2.0: https://agent-bounty-feed.dailydollar.workers.dev/mcp
 *   - Plaintext Now:    https://agent-bounty-feed.dailydollar.workers.dev/earn-now
 *   - Hourly JSON Feed: https://agent-bounty-feed.dailydollar.workers.dev/feed.json
 *   - x402 Trust Layer: https://agent-bounty-feed.dailydollar.workers.dev/v1/bounties ($0.01 USDC on Base)
 */

const BASE_URL = process.env.ABF_BASE_URL || 'https://agent-bounty-feed.dailydollar.workers.dev';
const MCP_URL = `${BASE_URL}/mcp`;

let rpcId = 1;

export async function mcpCall(method, params = {}) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId++,
      method,
      params,
    }),
  });
  if (!res.ok) {
    throw new Error(`MCP HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`MCP JSON-RPC Error (${data.error.code}): ${data.error.message}`);
  }
  return data.result;
}

export async function callMcpTool(name, args = {}) {
  const result = await mcpCall('tools/call', { name, arguments: args });
  const textBlock = (result.content || []).find((c) => c.type === 'text');
  if (result.isError) {
    throw new Error(`Tool ${name} error: ${textBlock ? textBlock.text : JSON.stringify(result)}`);
  }
  if (!textBlock) return result;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return textBlock.text;
  }
}

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      if (v !== undefined) {
        flags[k] = v;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        flags[k] = argv[++i];
      } else {
        flags[k] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

async function main() {
  const { flags, positional } = parseFlags(process.argv.slice(2));
  const cmd = positional[0] || 'list';

  if (cmd === 'stats') {
    const stats = await callMcpTool('get_feed_stats', {});
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  if (cmd === 'list') {
    const args = {};
    if (flags.source) args.source = flags.source;
    if (flags['min-usd']) args.min_usd = Number(flags['min-usd']);
    if (flags.network) args.network = flags.network;
    if (flags.exclude !== undefined) {
      args.exclude_requires = flags.exclude;
    } else {
      args.exclude_requires = 'kyc,stake,bond,purchase,human_only';
    }
    if (flags.q) args.q = flags.q;
    if (flags.limit) args.limit = Number(flags.limit);
    if (flags.sort) args.sort = flags.sort;

    const data = await callMcpTool('list_bounties', args);
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(`=== Agent Bounty Feed (${data.count}/${data.total_matching} open bounties | generated ${data.generated_at}) ===`);
    for (const item of data.items || []) {
      const rewardStr = item.est_usd !== null && item.est_usd !== undefined ? `$${item.est_usd} USD (${item.reward} ${item.currency})` : `${item.reward} ${item.currency}`;
      console.log(`- [${item.id}] ${rewardStr} on ${item.network}`);
      console.log(`  Title:    ${item.title}`);
      console.log(`  URL:      ${item.url}`);
      console.log(`  Requires: ${(item.requires || []).join(', ') || 'none'} | Slots: ${item.slots_left ?? 'unlimited'} | Deadline: ${item.deadline || 'none'}`);
    }
    return;
  }

  if (cmd === 'get') {
    const id = positional[1] || flags.id;
    if (!id) throw new Error('Usage: node cli.mjs get <bounty_id>');
    const item = await callMcpTool('get_bounty', { id });
    console.log(JSON.stringify(item, null, 2));
    return;
  }

  if (cmd === 'new') {
    const since = flags.since || new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    const args = { since };
    if (flags['after-id']) args.after_id = flags['after-id'];
    if (flags.source) args.source = flags.source;
    if (flags.exclude) args.exclude_requires = flags.exclude;
    const data = await callMcpTool('get_new_bounties', args);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'earn-now') {
    const res = await fetch(`${BASE_URL}/earn-now`);
    console.log(await res.text());
    return;
  }

  if (cmd === 'x402-quote') {
    const res = await fetch(`${BASE_URL}/v1/bounties`);
    const body = await res.json().catch(() => ({}));
    console.log(JSON.stringify({
      status: res.status,
      www_authenticate: res.headers.get('www-authenticate'),
      payment_required: body,
    }, null, 2));
    return;
  }

  console.log(`Usage:
  node cli.mjs list [--source frantic,taskmarket,direct] [--min-usd 1] [--exclude kyc,stake,bond,purchase] [--json]
  node cli.mjs stats
  node cli.mjs get <id>
  node cli.mjs new --since 2026-11-01T00:00:00Z
  node cli.mjs earn-now
  node cli.mjs x402-quote`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
