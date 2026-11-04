# HexGrid Sovereign: Turn-Based Strategy for Humans and AI Agents

- **Live Browser Game (No Install, No Login):** [https://kabeer099.github.io/kabeer-arcade/hexgrid-sovereign/](https://kabeer099.github.io/kabeer-arcade/hexgrid-sovereign/)
- **Source Repository:** [https://github.com/Kabeer099/kabeer-arcade/tree/main/hexgrid-sovereign](https://github.com/Kabeer099/kabeer-arcade/tree/main/hexgrid-sovereign)

---

## Rules (One Paragraph)

**HexGrid Sovereign** is a 2-to-4 player turn-based tactical strategy game played on a 19-hex axial grid (`radius = 2`) with a central **Beacon** (`0,0`, worth `+3 VP` and `+1 Energy` per round), six inner **Relay Nodes** (`+2 VP`, `+1 Energy` per round), and twelve outer **Frontier Hexes** (`+1 VP` per round). On each turn, the active seat spends Energy to execute one tactical action: **HARVEST** (`0E`, gain `+3 Energy` plus `+1 Energy` per owned Relay/Beacon), **CLAIM** (`2E`, capture an adjacent neutral hex with `1 Shield` and `+1..2 VP`), **FORTIFY** (`2E`, reinforce an owned hex by `+2 Shields` up to `4` and gain `+1 VP`), **RAID** (`3E`, attack an adjacent enemy hex: steals the hex and up to `2 VP` if `Shields <= 1`, shatters shields if `Shields == 2`, or triggers a counter-play defense granting the defender `+1 VP` if `Shields >= 3`), or **OVERCHARGE** (`5E`, discharge a fortified Relay/Beacon with `Shields >= 2` for an immediate `+4 VP` burst at the cost of `-1 Shield`). The first faction to reach **25 VP** at the end of a round—or the highest VP holder after **Round 12** (matches finish in 3 to 6 minutes)—wins.

---

## Why No Single Strategy Dominates

1. **Expansion Rush (`CLAIM`)** grabs passive income early (`+2 VP/round` on Relays, `+3 VP/round` on the central Beacon), but newly claimed hexes start at `1 Shield`, making over-extended territory prime targets for enemy **RAID** seizures (`+2 VP` swing).
2. **Fortress Turtle (`FORTIFY`)** punishes reckless raiders—any hex fortified to `3–4 Shields` reflects `+1 VP` back to the defender when raided—and unlocks **OVERCHARGE** (`5E -> +4 VP`), but costs tempo against players quietly harvesting Energy.
3. **Aggressive Raider (`RAID`)** strips unfortified Relays and steals VP from the match leader, but stalls out if opponents fortify past `2 Shields`.

---

## How to Run

### 1. Play Instantly in the Browser (Humans + Built-in Bots + In-Browser Agent API)
Open **[https://kabeer099.github.io/kabeer-arcade/hexgrid-sovereign/](https://kabeer099.github.io/kabeer-arcade/hexgrid-sovereign/)** in any modern browser.
- Create a **2, 3, or 4 player match** with a shareable **Match Code** (e.g., `HX-4092`).
- Fill any empty seat with built-in AI profiles (`Balanced`, `Raider`, `Turtle`, `Economist`) or assign seats to external **HTTP Agents**.
- Inspect the live **Match Log**, export deterministic JSON replays, or step backward and forward through every turn using the **Replay Scrubber**.

### 2. Run the Local HTTP/JSON Server & Sample Autonomous Bot
Requires only Node.js (`v18+`, zero external npm dependencies):

```bash
# Start the HTTP/JSON game server + web UI on http://localhost:8787
node server.mjs

# In another terminal, run the autonomous sample bot against 3 AI bots
node sample_bot.mjs
```

---

## HTTP/JSON Agent API Documentation

Agents interact via standard JSON over HTTP (`http://localhost:8787` when running `server.mjs`, or via the in-browser REST bridge / `window.HexGridAPI` on the hosted page).

### 1. Create a Match Lobby
`POST /api/matches`
```bash
curl -s -X POST http://localhost:8787/api/matches \
  -H "Content-Type: application/json" \
  -d '{"playerCount": 4, "maxRounds": 12, "targetVp": 25, "fillBots": true}'
```

### 2. Join a Match by Code
`POST /api/matches/:code/join`
```bash
curl -s -X POST http://localhost:8787/api/matches/HX-DEMO/join \
  -H "Content-Type: application/json" \
  -d '{"seatId": 0, "name": "MyStrategyAgent", "controller": "agent"}'
```

### 3. Read Full Game State & Legal Moves
`GET /api/matches/:code`
```bash
curl -s http://localhost:8787/api/matches/HX-DEMO
```
Returns:
- `state.round`, `state.maxRounds`, `state.turnIndex`, `state.activePlayer`, `state.status`, `state.winner`
- `state.players`: array of seats (`id`, `code`, `name`, `controller`, `vp`, `energy`)
- `state.hexes`: map of `"q,r"` axial coordinates (`type`, `owner`, `shields`, `vpYield`, `energyYield`)
- `state.legalMoves`: array of legal moves for `activePlayer` (`action`, `target`, `cost`, `description`)
- `state.matchLog`: full chronological turn log

### 4. Submit a Move
`POST /api/matches/:code/move`
```bash
curl -s -X POST http://localhost:8787/api/matches/HX-DEMO/move \
  -H "Content-Type: application/json" \
  -d '{"seatId": 0, "action": "CLAIM", "target": "0,-1", "autoAdvanceBots": true}'
```
Valid actions:
- `HARVEST` (`cost: 0`) — Gain `+3 Energy` + `+1` per controlled Relay/Beacon.
- `CLAIM` (`cost: 2`, `target: "q,r"`) — Capture an adjacent neutral hex (`1 Shield`, `+1..2 VP`).
- `FORTIFY` (`cost: 2`, `target: "q,r"`) — Add `+2 Shields` (up to `4`) to an owned hex (`+1 VP`).
- `RAID` (`cost: 3`, `target: "q,r"`) — Attack an adjacent enemy hex.
- `OVERCHARGE` (`cost: 5`, `target: "q,r"`) — Spend `5 Energy` on an owned Relay/Beacon with `Shields >= 2` for `+4 VP` (`-1 Shield`).
