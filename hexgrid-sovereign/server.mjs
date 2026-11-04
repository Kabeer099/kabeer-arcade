import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);

const FACTIONS = [
  { id: 0, code: 'P1', name: 'Crimson Vanguard', color: '#e11d48', startHex: '0,-2' },
  { id: 1, code: 'P2', name: 'Cobalt Syndicate', color: '#2563eb', startHex: '0,2' },
  { id: 2, code: 'P3', name: 'Emerald Collective', color: '#059669', startHex: '-2,2' },
  { id: 3, code: 'P4', name: 'Amber Dominion', color: '#d97706', startHex: '2,-2' }
];

const RELAY_KEYS = new Set(['1,-1', '1,0', '0,1', '-1,1', '-1,0', '0,-1']);

function generateHexGrid() {
  const hexes = {};
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(q + r) <= 2) {
        const key = `${q},${r}`;
        let type = 'frontier';
        let vpYield = 1;
        let energyYield = 0;
        if (q === 0 && r === 0) {
          type = 'beacon';
          vpYield = 3;
          energyYield = 1;
        } else if (RELAY_KEYS.has(key)) {
          type = 'relay';
          vpYield = 2;
          energyYield = 1;
        }
        hexes[key] = {
          key,
          q,
          r,
          type,
          owner: null,
          shields: 0,
          vpYield,
          energyYield
        };
      }
    }
  }
  return hexes;
}

function getNeighbors(key) {
  const [q, r] = key.split(',').map(Number);
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const out = [];
  for (const [dq, dr] of dirs) {
    const nk = `${q + dq},${r + dr}`;
    if (Math.abs(q + dq) <= 2 && Math.abs(r + dr) <= 2 && Math.abs(q + dq + r + dr) <= 2) {
      out.push(nk);
    }
  }
  return out;
}

function isAdjacentToOwned(hexes, playerId, targetKey) {
  for (const nk of getNeighbors(targetKey)) {
    if (hexes[nk] && hexes[nk].owner === playerId) return true;
  }
  return false;
}

export function computeLegalMoves(state, playerId = state.activePlayer) {
  if (state.status !== 'active' || playerId !== state.activePlayer) return [];
  const player = state.players[playerId];
  if (!player) return [];
  const moves = [];
  const ownedKeys = Object.keys(state.hexes).filter(k => state.hexes[k].owner === playerId);

  // 1. HARVEST: Always available, grants +3 base Energy + 1 per controlled Relay/Beacon
  const bonusEnergy = ownedKeys.reduce((acc, k) => acc + state.hexes[k].energyYield, 0);
  moves.push({
    action: 'HARVEST',
    target: ownedKeys[0] || FACTIONS[playerId].startHex,
    cost: 0,
    description: `Harvest +${3 + bonusEnergy} Energy from network`
  });

  // If player lost all hexes, allow re-anchoring on any unowned frontier hex for free
  if (ownedKeys.length === 0) {
    for (const h of Object.values(state.hexes)) {
      if (h.owner === null && h.type === 'frontier') {
        moves.push({
          action: 'CLAIM',
          target: h.key,
          cost: 0,
          description: `Emergency re-anchor at ${h.key}`
        });
      }
    }
    return moves;
  }

  // 2. CLAIM: Cost 2 Energy, target adjacent unowned hex
  if (player.energy >= 2) {
    for (const h of Object.values(state.hexes)) {
      if (h.owner === null && isAdjacentToOwned(state.hexes, playerId, h.key)) {
        moves.push({
          action: 'CLAIM',
          target: h.key,
          cost: 2,
          description: `Claim neutral ${h.type} hex (${h.key}) for 2 Energy`
        });
      }
    }
  }

  // 3. FORTIFY: Cost 2 Energy, target owned hex with shields < 4
  if (player.energy >= 2) {
    for (const k of ownedKeys) {
      const h = state.hexes[k];
      if (h.shields < 4) {
        moves.push({
          action: 'FORTIFY',
          target: k,
          cost: 2,
          description: `Fortify (${k}) to ${Math.min(4, h.shields + 2)} Shields and gain +1 VP`
        });
      }
    }
  }

  // 4. RAID: Cost 3 Energy, target adjacent enemy hex
  if (player.energy >= 3) {
    for (const h of Object.values(state.hexes)) {
      if (h.owner !== null && h.owner !== playerId && isAdjacentToOwned(state.hexes, playerId, h.key)) {
        moves.push({
          action: 'RAID',
          target: h.key,
          cost: 3,
          description: `Raid enemy ${FACTIONS[h.owner].code} at (${h.key}) [Shields: ${h.shields}]`
        });
      }
    }
  }

  // 5. OVERCHARGE: Cost 5 Energy, target owned relay or beacon with shields >= 2
  if (player.energy >= 5) {
    for (const k of ownedKeys) {
      const h = state.hexes[k];
      if ((h.type === 'beacon' || h.type === 'relay') && h.shields >= 2) {
        moves.push({
          action: 'OVERCHARGE',
          target: k,
          cost: 5,
          description: `Overcharge ${h.type} (${k}) for +4 VP (-1 Shield)`
        });
      }
    }
  }

  return moves;
}

export function createMatch({ playerCount = 4, maxRounds = 12, targetVp = 25, fillBots = true, code } = {}) {
  const count = Math.min(4, Math.max(2, Number(playerCount) || 4));
  const matchCode = code || ('HX-' + Math.random().toString(36).substring(2, 6).toUpperCase());
  const hexes = generateHexGrid();
  const players = [];

  for (let i = 0; i < count; i++) {
    const f = FACTIONS[i];
    const isBot = i === 0 ? false : Boolean(fillBots);
    players.push({
      id: i,
      code: f.code,
      name: f.name,
      color: f.color,
      controller: isBot ? 'bot' : 'human',
      botProfile: ['balanced', 'raider', 'turtle', 'economist'][i % 4],
      energy: 4,
      vp: 2,
      startHex: f.startHex
    });
    hexes[f.startHex].owner = i;
    hexes[f.startHex].shields = 2;
  }

  const state = {
    matchCode,
    status: 'active',
    round: 1,
    maxRounds,
    targetVp,
    turnIndex: 1,
    activePlayer: 0,
    winner: null,
    players,
    hexes,
    matchLog: [
      {
        turn: 0,
        round: 1,
        actor: 'SYSTEM',
        text: `Match ${matchCode} initialized with ${count} seats. Victory target: ${targetVp} VP or Round ${maxRounds}.`
      }
    ],
    snapshots: []
  };

  state.legalMoves = computeLegalMoves(state, 0);
  saveSnapshot(state);
  return state;
}

function saveSnapshot(state) {
  const copy = {
    turnIndex: state.turnIndex,
    round: state.round,
    activePlayer: state.activePlayer,
    status: state.status,
    winner: state.winner,
    players: JSON.parse(JSON.stringify(state.players)),
    hexes: JSON.parse(JSON.stringify(state.hexes)),
    lastLog: state.matchLog[state.matchLog.length - 1]
  };
  state.snapshots.push(copy);
}

export function applyMove(state, moveInput) {
  if (state.status !== 'active') {
    throw new Error('Match has already ended.');
  }
  const playerId = moveInput.seatId !== undefined ? Number(moveInput.seatId) : state.activePlayer;
  if (playerId !== state.activePlayer) {
    throw new Error(`Not seat ${playerId}'s turn. Active player is seat ${state.activePlayer}.`);
  }

  const legal = computeLegalMoves(state, playerId);
  const action = String(moveInput.action || '').toUpperCase();
  const target = moveInput.target;
  const chosen = legal.find(m => m.action === action && (!m.target || m.target === target)) ||
                 legal.find(m => m.action === action);

  if (!chosen) {
    throw new Error(`Illegal move ${action} on ${target}. Check legalMoves in GET /api/matches/${state.matchCode}.`);
  }

  const player = state.players[playerId];
  const hex = state.hexes[chosen.target];
  player.energy -= chosen.cost;
  let logText = '';

  if (chosen.action === 'HARVEST') {
    const ownedKeys = Object.keys(state.hexes).filter(k => state.hexes[k].owner === playerId);
    const bonus = ownedKeys.reduce((acc, k) => acc + state.hexes[k].energyYield, 0);
    const gained = 3 + bonus;
    player.energy += gained;
    logText = `${player.code} (${player.name}) executed HARVEST (+${gained} Energy -> ${player.energy}E).`;
  } else if (chosen.action === 'CLAIM') {
    hex.owner = playerId;
    hex.shields = 1;
    const immediateVp = hex.type === 'beacon' ? 2 : 1;
    player.vp += immediateVp;
    logText = `${player.code} claimed ${hex.type.toUpperCase()} (${hex.key}) [+${immediateVp} VP, 1 Shield].`;
  } else if (chosen.action === 'FORTIFY') {
    hex.shields = Math.min(4, hex.shields + 2);
    player.vp += 1;
    logText = `${player.code} fortified (${hex.key}) to ${hex.shields} Shields [+1 VP].`;
  } else if (chosen.action === 'RAID') {
    const defender = state.players[hex.owner];
    if (hex.shields >= 3) {
      // Fortified counter-damage! Turtles punish reckless raiders
      hex.shields -= 2;
      defender.vp += 1;
      logText = `${player.code} raided heavily fortified (${hex.key}); shields dropped to ${hex.shields}, but ${defender.code} reflected +1 VP counter-play.`;
    } else if (hex.shields === 2) {
      hex.shields = 0;
      player.vp += 1;
      logText = `${player.code} shattered ${defender.code} shields at (${hex.key}) [+1 VP].`;
    } else {
      hex.owner = playerId;
      hex.shields = 1;
      const stolen = Math.min(2, defender.vp);
      defender.vp -= stolen;
      player.vp += Math.max(2, stolen);
      logText = `${player.code} captured (${hex.key}) from ${defender.code} and seized +${Math.max(2, stolen)} VP.`;
    }
  } else if (chosen.action === 'OVERCHARGE') {
    hex.shields -= 1;
    player.vp += 4;
    logText = `${player.code} overcharged ${hex.type.toUpperCase()} (${hex.key}) for +4 VP (Shields -> ${hex.shields}).`;
  }

  state.matchLog.push({
    turn: state.turnIndex,
    round: state.round,
    actor: player.code,
    action: chosen.action,
    target: chosen.target,
    text: logText
  });

  // Advance turn
  const nextSeat = (state.activePlayer + 1) % state.players.length;
  if (nextSeat === 0) {
    // End of round passive income & win check
    for (const p of state.players) {
      const owned = Object.values(state.hexes).filter(h => h.owner === p.id);
      const passiveVp = owned.reduce((acc, h) => acc + h.vpYield, 0);
      const passiveEnergy = 1 + owned.reduce((acc, h) => acc + h.energyYield, 0);
      p.vp += passiveVp;
      p.energy += passiveEnergy;
    }
    state.matchLog.push({
      turn: state.turnIndex,
      round: state.round,
      actor: 'ROUND_END',
      text: `End of Round ${state.round}: Passive VP and Energy distributed across controlled hexes.`
    });

    // Check victory conditions
    const sorted = [...state.players].sort((a, b) => {
      if (b.vp !== a.vp) return b.vp - a.vp;
      return b.energy - a.energy;
    });
    if (sorted[0].vp >= state.targetVp || state.round >= state.maxRounds) {
      state.status = 'completed';
      state.winner = {
        id: sorted[0].id,
        code: sorted[0].code,
        name: sorted[0].name,
        vp: sorted[0].vp,
        reason: sorted[0].vp >= state.targetVp ? `Reached target ${state.targetVp} VP` : `Highest score after Round ${state.maxRounds}`
      };
      state.matchLog.push({
        turn: state.turnIndex,
        round: state.round,
        actor: 'VICTORY',
        text: `Winner: ${sorted[0].code} (${sorted[0].name}) with ${sorted[0].vp} VP (${state.winner.reason}).`
      });
    } else {
      state.round += 1;
    }
  }

  state.turnIndex += 1;
  state.activePlayer = nextSeat;
  state.legalMoves = state.status === 'active' ? computeLegalMoves(state, state.activePlayer) : [];
  saveSnapshot(state);
  return state;
}

export function chooseBotMove(state, playerId = state.activePlayer) {
  const legal = computeLegalMoves(state, playerId);
  if (legal.length === 0) return null;
  const player = state.players[playerId];
  const profile = player.botProfile || 'balanced';

  let bestMove = legal[0];
  let bestScore = -999;

  for (const m of legal) {
    let score = 0;
    const h = state.hexes[m.target];
    if (m.action === 'OVERCHARGE') {
      score = 95;
    } else if (m.action === 'CLAIM') {
      if (h.type === 'beacon') score = 90;
      else if (h.type === 'relay') score = 72;
      else score = 50;
      if (profile === 'economist') score += 10;
    } else if (m.action === 'RAID') {
      const enemy = state.players[h.owner];
      const isLeader = enemy && enemy.vp >= Math.max(...state.players.map(p => p.vp));
      if (h.shields <= 1) score = 84 + (isLeader ? 12 : 0);
      else if (h.shields === 2) score = 62 + (isLeader ? 10 : 0);
      else score = 20; // Avoid raiding >=3 shield turtles unless desperate
      if (profile === 'raider') score += 14;
    } else if (m.action === 'FORTIFY') {
      if (h.type === 'beacon' && h.shields < 3) score = 82;
      else if (h.type === 'relay' && h.shields < 3) score = 64;
      else score = 42;
      if (profile === 'turtle') score += 18;
    } else if (m.action === 'HARVEST') {
      score = player.energy < 2 ? 88 : (player.energy < 4 ? 54 : 25);
    }
    // Small deterministic tie-breaker by turnIndex + target
    const tie = ((state.turnIndex * 17 + m.target.charCodeAt(0)) % 7) * 0.1;
    if (score + tie > bestScore) {
      bestScore = score + tie;
      bestMove = m;
    }
  }
  return bestMove;
}

// In-memory store for active matches
const matches = new Map();

// Seed a default match HX-DEMO
const demoMatch = createMatch({ playerCount: 4, fillBots: true, code: 'HX-DEMO' });
matches.set(demoMatch.matchCode, demoMatch);

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON request body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const htmlPath = path.join(__dirname, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (req.method === 'GET' && pathname === '/api/matches') {
      const list = [...matches.values()].map(m => ({
        matchCode: m.matchCode,
        status: m.status,
        round: m.round,
        maxRounds: m.maxRounds,
        activePlayer: m.activePlayer,
        players: m.players.map(p => ({ id: p.id, code: p.code, name: p.name, controller: p.controller, vp: p.vp, energy: p.energy })),
        winner: m.winner
      }));
      return sendJson(res, 200, { ok: true, matches: list });
    }

    if (req.method === 'POST' && pathname === '/api/matches') {
      const body = await readBody(req);
      const state = createMatch({
        playerCount: body.playerCount || body.players || 4,
        maxRounds: body.maxRounds || 12,
        targetVp: body.targetVp || 25,
        fillBots: body.fillBots !== undefined ? Boolean(body.fillBots) : true,
        code: body.matchCode
      });
      matches.set(state.matchCode, state);
      return sendJson(res, 201, { ok: true, matchCode: state.matchCode, state });
    }

    const matchRoute = pathname.match(/^\/api\/matches\/([A-Za-z0-9_-]+)(\/[a-z-]+)?$/);
    if (matchRoute) {
      const code = matchRoute[1].toUpperCase();
      const sub = matchRoute[2] || '';
      const state = matches.get(code);
      if (!state) {
        return sendJson(res, 404, { ok: false, error: `Match ${code} not found.` });
      }

      if (req.method === 'GET' && sub === '') {
        return sendJson(res, 200, { ok: true, state });
      }

      if (req.method === 'POST' && sub === '/join') {
        const body = await readBody(req);
        const seatId = body.seatId !== undefined
          ? Number(body.seatId)
          : state.players.findIndex(p => p.controller === 'bot');
        const seat = state.players[seatId >= 0 ? seatId : 0];
        if (!seat) {
          return sendJson(res, 400, { ok: false, error: 'Invalid seatId' });
        }
        seat.controller = body.controller || 'agent';
        if (body.name) seat.name = String(body.name).slice(0, 32);
        state.matchLog.push({
          turn: state.turnIndex,
          round: state.round,
          actor: seat.code,
          text: `${seat.name} joined Seat ${seat.id} (${seat.code}) as ${seat.controller}.`
        });
        return sendJson(res, 200, { ok: true, seatId: seat.id, faction: seat.code, state });
      }

      if (req.method === 'POST' && sub === '/move') {
        const body = await readBody(req);
        applyMove(state, body);
        const autoAdvanceBots = body.autoAdvanceBots !== false;
        while (autoAdvanceBots && state.status === 'active' && state.players[state.activePlayer].controller === 'bot') {
          const botMove = chooseBotMove(state, state.activePlayer);
          if (!botMove) break;
          applyMove(state, { seatId: state.activePlayer, action: botMove.action, target: botMove.target });
        }
        return sendJson(res, 200, { ok: true, state });
      }

      if (req.method === 'POST' && sub === '/bot-step') {
        if (state.status !== 'active') {
          return sendJson(res, 400, { ok: false, error: 'Match already completed.' });
        }
        const botMove = chooseBotMove(state, state.activePlayer);
        applyMove(state, { seatId: state.activePlayer, action: botMove.action, target: botMove.target });
        return sendJson(res, 200, { ok: true, move: botMove, state });
      }
    }

    return sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (err) {
    return sendJson(res, 400, { ok: false, error: err.message });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  server.listen(PORT, () => {
    console.log(`HexGrid Sovereign server listening on http://localhost:${PORT}`);
  });
}
