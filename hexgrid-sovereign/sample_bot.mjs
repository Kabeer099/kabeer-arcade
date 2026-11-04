#!/usr/bin/env node
/**
 * HexGrid Sovereign — Sample Autonomous HTTP/JSON Agent Bot
 * Usage:
 *   node sample_bot.mjs [matchCode] [serverUrl]
 *
 * If no matchCode is provided, creates a new 4-player match on serverUrl,
 * claims Seat 0 as an HTTP agent, and plays turns against 3 tactical bots
 * until the match concludes.
 */

const SERVER_URL = (process.argv[3] || process.env.HEXGRID_URL || 'http://localhost:8787').replace(/\/$/, '');
const ARG_CODE = process.argv[2] || null;

function scoreMove(state, seatId, move) {
  const player = state.players[seatId];
  const hex = state.hexes[move.target];
  let score = 0;

  if (move.action === 'OVERCHARGE') {
    score = 100;
  } else if (move.action === 'CLAIM') {
    if (hex.type === 'beacon') score = 92;
    else if (hex.type === 'relay') score = 76;
    else score = 55;
  } else if (move.action === 'RAID') {
    const defender = state.players[hex.owner];
    const maxVp = Math.max(...state.players.map(p => p.vp));
    const leaderBonus = defender && defender.vp === maxVp ? 15 : 0;
    if (hex.shields <= 1) score = 86 + leaderBonus;
    else if (hex.shields === 2) score = 65 + leaderBonus;
    else score = 15; // Avoid raiding heavily fortified 3-4 shield hexes (reflects +1 VP to defender)
  } else if (move.action === 'FORTIFY') {
    if (hex.type === 'beacon' && hex.shields < 3) score = 84;
    else if (hex.type === 'relay' && hex.shields < 3) score = 68;
    else score = 44;
  } else if (move.action === 'HARVEST') {
    score = player.energy < 2 ? 90 : (player.energy < 4 ? 58 : 28);
  }
  return score;
}

async function api(path, opts = {}) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function main() {
  let matchCode = ARG_CODE;
  let seatId = 0;

  if (!matchCode) {
    const created = await api('/api/matches', {
      method: 'POST',
      body: JSON.stringify({ playerCount: 4, fillBots: true })
    });
    matchCode = created.matchCode;
    console.log(`[SampleBot] Created match ${matchCode} on ${SERVER_URL}`);
  }

  const joined = await api(`/api/matches/${matchCode}/join`, {
    method: 'POST',
    body: JSON.stringify({ seatId: 0, name: 'SampleHttpAgent', controller: 'agent' })
  });
  seatId = joined.seatId;
  console.log(`[SampleBot] Joined ${matchCode} as Seat ${seatId} (${joined.faction})`);

  while (true) {
    const { state } = await api(`/api/matches/${matchCode}`);
    if (state.status !== 'active') {
      console.log(`\n[SampleBot] Match ${matchCode} completed at Round ${state.round}!`);
      console.log(`[SampleBot] Winner: ${state.winner.code} (${state.winner.name}) — ${state.winner.vp} VP (${state.winner.reason})`);
      console.log('[SampleBot] Final Standings:');
      for (const p of state.players) {
        console.log(`  - ${p.code} (${p.name}): ${p.vp} VP | ${p.energy} Energy`);
      }
      break;
    }

    if (state.activePlayer !== seatId) {
      await api(`/api/matches/${matchCode}/bot-step`, { method: 'POST' });
      continue;
    }

    const legal = state.legalMoves || [];
    const ranked = legal
      .map(m => ({ move: m, score: scoreMove(state, seatId, m) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0].move;
    console.log(`[Round ${state.round} | Turn ${state.turnIndex}] Submitting ${best.action} -> (${best.target}) [score=${ranked[0].score}]`);

    await api(`/api/matches/${matchCode}/move`, {
      method: 'POST',
      body: JSON.stringify({
        seatId,
        action: best.action,
        target: best.target,
        autoAdvanceBots: true
      })
    });
  }
}

main().catch(err => {
  console.error('[SampleBot Error]', err.message);
  process.exit(1);
});
