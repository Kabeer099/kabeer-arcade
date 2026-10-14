/* ==========================================================================
   KABEER ARCADE — 3-IN-1 OFFLINE CYBER GAMING ENGINE
   1. NEON DRIFT 3D (3D Perspective Synthwave Highway Runner)
   2. VOID SURVIVOR (2D Action Roguelite Space Arena)
   3. CYBER STACK 3D (3D Isometric Precision Tower Builder)
   + Procedural Web Audio API Synth & SFX (Zero external audio files needed!)
   + Service Worker Offline-First Caching & LocalStorage Persistence
   ========================================================================== */

(() => {
  'use strict';

  // --- PWA Service Worker Registration & Offline Indicator ---
  const statusPill = document.getElementById('offlineStatusPill');
  const statusText = document.getElementById('statusText');
  const installPwaBtn = document.getElementById('installPwaBtn');
  let deferredInstallPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(() => {
        updateConnectivityBadge();
      }).catch(() => {});
    });
  }

  function updateConnectivityBadge() {
    if (!navigator.onLine) {
      statusPill.classList.add('offline-mode');
      statusText.textContent = 'PLAYING OFFLINE ⚡';
    } else {
      statusPill.classList.remove('offline-mode');
      statusText.textContent = 'OFFLINE READY ✓';
    }
  }
  window.addEventListener('online', updateConnectivityBadge);
  window.addEventListener('offline', updateConnectivityBadge);
  updateConnectivityBadge();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installPwaBtn.hidden = false;
  });

  installPwaBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installPwaBtn.hidden = true;
  });

  // --- Persistent Storage (High Scores, Coins, Theme) ---
  const STORAGE_KEY = 'kabeer_arcade_save_v1';
  const defaultSave = {
    coins: 0,
    theme: 'cyan',
    best: { drift: 0, survivor: 0, stack: 0 }
  };

  let saveData = loadSave();
  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultSave));
      const parsed = JSON.parse(raw);
      return {
        coins: Number(parsed.coins) || 0,
        theme: parsed.theme || 'cyan',
        best: {
          drift: Number(parsed.best?.drift) || 0,
          survivor: Number(parsed.best?.survivor) || 0,
          stack: Number(parsed.best?.stack) || 0
        }
      };
    } catch {
      return JSON.parse(JSON.stringify(defaultSave));
    }
  }

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {}
    document.getElementById('totalCoinsDisplay').textContent = saveData.coins;
  }

  // --- Theme Palette System ---
  const THEMES = [
    { id: 'cyan', label: 'Cyan', primary: '#00f0ff', secondary: '#ff007f', accent: '#ffe600' },
    { id: 'rose', label: 'Rose', primary: '#ff2a85', secondary: '#7b2cbf', accent: '#00f5d4' },
    { id: 'emerald', label: 'Matrix', primary: '#00ff88', secondary: '#00b4d8', accent: '#ffbe0b' },
    { id: 'gold', label: 'Solar', primary: '#ffbe0b', secondary: '#fb5607', accent: '#00f0ff' }
  ];

  function applyTheme(themeId) {
    const found = THEMES.find(t => t.id === themeId) || THEMES[0];
    document.body.setAttribute('data-theme', found.id);
    document.getElementById('themeLabel').textContent = found.label;
    saveData.theme = found.id;
    persistSave();
  }
  applyTheme(saveData.theme);

  document.getElementById('themeBtn').addEventListener('click', () => {
    const idx = THEMES.findIndex(t => t.id === saveData.theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next.id);
    AudioEngine.playTone(620, 0.08, 'triangle', 0.15);
  });

  function currentPalette() {
    return THEMES.find(t => t.id === saveData.theme) || THEMES[0];
  }

  // --- Procedural Web Audio API Engine (100% Offline Sound & Synthwave Beat) ---
  const AudioEngine = (() => {
    let ctx = null;
    let sfxEnabled = true;
    let musicEnabled = false;
    let beatTimer = null;
    let step = 0;

    function ensureCtx() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function playTone(freq, duration = 0.1, type = 'sawtooth', vol = 0.14, slideFreq = null) {
      if (!sfxEnabled) return;
      const ac = ensureCtx();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
      }
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    function playCoin() {
      playTone(880, 0.07, 'sine', 0.16);
      setTimeout(() => playTone(1320, 0.12, 'sine', 0.15), 55);
    }

    function playJump() {
      playTone(220, 0.18, 'triangle', 0.16, 660);
    }

    function playLaser() {
      playTone(780, 0.07, 'sawtooth', 0.08, 190);
    }

    function playBoom() {
      playTone(120, 0.32, 'sawtooth', 0.22, 28);
    }

    function playCombo(comboCount) {
      const base = 330 * Math.pow(1.06, Math.min(comboCount, 18));
      playTone(base, 0.14, 'triangle', 0.18, base * 1.25);
    }

    function playLevelUp() {
      [440, 554, 659, 880].forEach((n, i) => {
        setTimeout(() => playTone(n, 0.14, 'triangle', 0.16), i * 70);
      });
    }

    function toggleSfx() {
      sfxEnabled = !sfxEnabled;
      return sfxEnabled;
    }

    function toggleMusic() {
      musicEnabled = !musicEnabled;
      if (musicEnabled) {
        ensureCtx();
        const bassline = [110, 110, 130.8, 146.8, 98, 98, 130.8, 164.8];
        beatTimer = setInterval(() => {
          if (!musicEnabled || !ctx) return;
          const note = bassline[step % bassline.length];
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note, now);
          g.gain.setValueAtTime(0.055, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.19);

          if (step % 2 === 1) {
            const lead = ctx.createOscillator();
            const lg = ctx.createGain();
            lead.type = 'triangle';
            lead.frequency.setValueAtTime(note * 4, now);
            lg.gain.setValueAtTime(0.025, now);
            lg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            lead.connect(lg);
            lg.connect(ctx.destination);
            lead.start(now);
            lead.stop(now + 0.13);
          }
          step++;
        }, 210);
      } else if (beatTimer) {
        clearInterval(beatTimer);
        beatTimer = null;
      }
      return musicEnabled;
    }

    return {
      playTone,
      playCoin,
      playJump,
      playLaser,
      playBoom,
      playCombo,
      playLevelUp,
      toggleSfx,
      toggleMusic
    };
  })();

  const sfxBtn = document.getElementById('sfxBtn');
  const musicBtn = document.getElementById('musicBtn');
  sfxBtn.addEventListener('click', () => {
    const on = AudioEngine.toggleSfx();
    sfxBtn.classList.toggle('active', on);
  });
  musicBtn.addEventListener('click', () => {
    const on = AudioEngine.toggleMusic();
    musicBtn.classList.toggle('active', on);
  });

  // --- Canvas & Global Game Loop Setup ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let W = 960;
  let H = 600;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, Math.floor(rect.width));
    H = Math.max(320, Math.floor(rect.height));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- UI References ---
  const hudScore = document.getElementById('hudScore');
  const hudBest = document.getElementById('hudBest');
  const hudExtraLabel = document.getElementById('hudExtraLabel');
  const hudExtraVal = document.getElementById('hudExtraVal');
  const menuOverlay = document.getElementById('menuOverlay');
  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const upgradeOptions = document.getElementById('upgradeOptions');
  const overlayBadge = document.getElementById('overlayBadge');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');
  const statsSummary = document.getElementById('statsSummary');
  const finalScoreVal = document.getElementById('finalScoreVal');
  const finalBestVal = document.getElementById('finalBestVal');
  const finalCoinsVal = document.getElementById('finalCoinsVal');
  const controlsGuide = document.getElementById('controlsGuide');
  const startGameBtn = document.getElementById('startGameBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const touchDrift = document.getElementById('touchDrift');
  const touchSurvivor = document.getElementById('touchSurvivor');
  const touchStack = document.getElementById('touchStack');

  const GAME_META = {
    drift: {
      badge: '3D ENDLESS CYBER RACER',
      title: 'NEON DRIFT 3D',
      desc: 'Speed across a 3D synthwave grid! Switch lanes to dodge neon monoliths, jump over red laser beams, and trigger Hyper-Nitro.',
      extraLabel: 'NITRO / SPEED',
      controls: [
        ['← → or A / D / Swipe', 'Switch Lanes'],
        ['SPACE / ↑ / Jump Btn', 'Jump Over Lasers'],
        ['SHIFT / Nitro Btn', 'Activate Hyper-Nitro']
      ]
    },
    survivor: {
      badge: '2D ACTION BULLET-HEAVEN ARENA',
      title: 'VOID SURVIVOR',
      desc: 'Pilot your neon starfighter against endless geometric swarms! Collect XP crystals, level up weapons, and unleash EMP Novas.',
      extraLabel: 'SHIP LEVEL',
      controls: [
        ['WASD / Arrows / Drag', 'Pilot Starfighter'],
        ['Auto-Targeting', 'Fires at Nearest Threat'],
        ['SPACE / Nova Btn', 'Trigger EMP Shockwave']
      ]
    },
    stack: {
      badge: '3D ISOMETRIC PRECISION TOWER',
      title: 'CYBER STACK 3D',
      desc: 'Drop sliding 3D neon slabs with millimeter precision! Chain 4+ Perfect Combos to expand your slab and reach orbit.',
      extraLabel: 'COMBO STREAK',
      controls: [
        ['SPACE / Click / Tap', 'Drop Moving Slab'],
        ['Exact Alignment', '⚡ Perfect Combo Bonus'],
        ['4x Combo Streak', 'Expands Slab Size!']
      ]
    }
  };

  let activeGame = 'drift';
  let gameState = 'menu';
  let score = 0;
  let runCoins = 0;
  let shakeTime = 0;
  let shakeMag = 0;
  let floatingTexts = [];
  let particles = [];

  function triggerShake(mag = 6, duration = 0.22) {
    shakeMag = Math.max(shakeMag, mag);
    shakeTime = Math.max(shakeTime, duration);
  }

  function addFloatingText(text, x, y, color = '#00f0ff') {
    floatingTexts.push({ text, x, y, vy: -55, life: 0.95, maxLife: 0.95, color });
  }

  function spawnParticles(x, y, color, count = 16, speed = 180) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.25 + Math.random() * 0.75) * speed;
      particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2 + Math.random() * 3.5,
        color,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75
      });
    }
  }

  // --- Input Handling ---
  const keys = {};
  const pointer = { active: false, x: W / 2, y: H / 2, startX: 0, startY: 0 };

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gameState === 'playing') pauseGame();
      else if (gameState === 'paused') resumeGame();
      return;
    }

    if (gameState === 'menu' || gameState === 'gameover') {
      if (e.code === 'Space' || e.code === 'Enter') startCurrentGame();
      return;
    }

    if (gameState !== 'playing') return;

    if (activeGame === 'drift') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') DriftGame.moveLane(-1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') DriftGame.moveLane(1);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') DriftGame.jump();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') DriftGame.activateNitro();
    } else if (activeGame === 'survivor') {
      if (e.code === 'Space') SurvivorGame.triggerNova();
    } else if (activeGame === 'stack') {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') StackGame.placeSlab();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointer.active = true;
    pointer.x = x;
    pointer.y = y;
    pointer.startX = x;
    pointer.startY = y;

    if (gameState === 'playing' && activeGame === 'stack') {
      StackGame.placeSlab();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });

  window.addEventListener('pointerup', (e) => {
    if (!pointer.active) return;
    pointer.active = false;
    if (gameState === 'playing' && activeGame === 'drift') {
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) - pointer.startX;
      const dy = (e.clientY - rect.top) - pointer.startY;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        DriftGame.moveLane(dx > 0 ? 1 : -1);
      } else if (dy < -30) {
        DriftGame.jump();
      }
    }
  });

  // Mobile Touch Buttons
  document.getElementById('btnLeft').addEventListener('click', () => gameState === 'playing' && DriftGame.moveLane(-1));
  document.getElementById('btnRight').addEventListener('click', () => gameState === 'playing' && DriftGame.moveLane(1));
  document.getElementById('btnJump').addEventListener('click', () => gameState === 'playing' && DriftGame.jump());
  document.getElementById('btnNitro').addEventListener('click', () => gameState === 'playing' && DriftGame.activateNitro());
  document.getElementById('btnNova').addEventListener('click', () => gameState === 'playing' && SurvivorGame.triggerNova());
  document.getElementById('btnPlaceBlock').addEventListener('click', () => gameState === 'playing' && StackGame.placeSlab());

  // ==========================================================================
  // GAME 1: NEON DRIFT 3D (Perspective 3D Synthwave Highway Runner)
  // ==========================================================================
  const DriftGame = (() => {
    const LANES = [-1, 0, 1];
    let laneIndex = 1;
    let carLaneX = 0;
    let carY = 0;
    let carVy = 0;
    let speed = 1;
    let distance = 0;
    let nitroTime = 0;
    let nitroCharge = 100;
    let shieldActive = false;
    let obstacles = [];
    let spawnTimer = 0;

    function reset() {
      laneIndex = 1;
      carLaneX = 0;
      carY = 0;
      carVy = 0;
      speed = 1;
      distance = 0;
      nitroTime = 0;
      nitroCharge = 100;
      shieldActive = false;
      obstacles = [];
      spawnTimer = 0.5;
    }

    function moveLane(dir) {
      const next = Math.max(0, Math.min(2, laneIndex + dir));
      if (next !== laneIndex) {
        laneIndex = next;
        AudioEngine.playTone(340, 0.06, 'sine', 0.1, 480);
      }
    }

    function jump() {
      if (carY <= 0.01) {
        carVy = 4.6;
        AudioEngine.playJump();
      }
    }

    function activateNitro() {
      if (nitroCharge >= 40 && nitroTime <= 0) {
        nitroTime = 2.8;
        nitroCharge = Math.max(0, nitroCharge - 50);
        AudioEngine.playTone(180, 0.35, 'sawtooth', 0.18, 720);
        triggerShake(5, 0.25);
        addFloatingText('🔥 HYPER NITRO!', W / 2, H * 0.35, '#ffe600');
      }
    }

    function spawnRow() {
      const zStart = 32;
      const pattern = Math.random();
      if (pattern < 0.42) {
        const count = Math.random() < 0.45 ? 2 : 1;
        const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count; i++) {
          obstacles.push({ lane: LANES[shuffled[i]], z: zStart, type: 'block' });
        }
        obstacles.push({ lane: LANES[shuffled[count]], z: zStart, type: 'coin' });
      } else if (pattern < 0.72) {
        const lane = LANES[Math.floor(Math.random() * 3)];
        obstacles.push({ lane, z: zStart, type: 'laser' });
        obstacles.push({ lane, z: zStart - 1.2, type: 'coin', high: true });
      } else {
        const lane = LANES[Math.floor(Math.random() * 3)];
        for (let k = 0; k < 3; k++) {
          obstacles.push({ lane, z: zStart + k * 2.2, type: k === 2 && Math.random() < 0.28 ? 'shield' : 'coin' });
        }
      }
    }

    function update(dt) {
      const targetX = LANES[laneIndex];
      carLaneX += (targetX - carLaneX) * Math.min(1, dt * 14);

      if (carY > 0 || carVy > 0) {
        carY += carVy * dt;
        carVy -= 12.5 * dt;
        if (carY <= 0) {
          carY = 0;
          carVy = 0;
        }
      }

      if (nitroTime > 0) {
        nitroTime = Math.max(0, nitroTime - dt);
      } else {
        nitroCharge = Math.min(100, nitroCharge + dt * 9);
      }

      const boostMult = nitroTime > 0 ? 1.85 : 1;
      speed = (1 + distance * 0.0006) * boostMult;
      const moveZ = dt * 13 * speed;
      distance += moveZ * 2.2;
      score = Math.floor(distance);

      spawnTimer -= dt * speed;
      if (spawnTimer <= 0) {
        spawnRow();
        spawnTimer = Math.max(0.42, 1.05 - distance * 0.00018);
      }

      const playerScreenX = W * 0.5 + carLaneX * (W * 0.22);
      const playerScreenY = H * 0.82 - carY * 95;

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const ob = obstacles[i];
        ob.z -= moveZ;

        if (!ob.passed && ob.z < 2.55 && ob.z > 1.25) {
          const sameLane = Math.abs(ob.lane - carLaneX) < 0.44;
          if (sameLane) {
            if (ob.type === 'coin') {
              if (!ob.high || carY > 0.25) {
                ob.passed = true;
                obstacles.splice(i, 1);
                score += 25;
                distance += 15;
                runCoins += 1;
                saveData.coins += 1;
                persistSave();
                nitroCharge = Math.min(100, nitroCharge + 12);
                AudioEngine.playCoin();
                spawnParticles(playerScreenX, playerScreenY - 20, '#ffe600', 10, 140);
                addFloatingText('+25 ⚡', playerScreenX, playerScreenY - 40, '#ffe600');
                continue;
              }
            } else if (ob.type === 'shield') {
              ob.passed = true;
              obstacles.splice(i, 1);
              shieldActive = true;
              AudioEngine.playLevelUp();
              addFloatingText('🛡️ SHIELD ACTIVE!', playerScreenX, playerScreenY - 45, '#00ff88');
              continue;
            } else if (ob.type === 'laser') {
              if (carY < 0.36 && nitroTime <= 0) {
                if (shieldActive) {
                  shieldActive = false;
                  ob.passed = true;
                  obstacles.splice(i, 1);
                  AudioEngine.playBoom();
                  triggerShake(8, 0.25);
                  addFloatingText('🛡️ SHIELD SAVED YOU!', playerScreenX, playerScreenY - 50, '#00f0ff');
                  continue;
                } else {
                  endCurrentGame();
                  return;
                }
              }
            } else if (ob.type === 'block') {
              if (nitroTime > 0) {
                ob.passed = true;
                obstacles.splice(i, 1);
                distance += 30;
                AudioEngine.playBoom();
                triggerShake(6, 0.18);
                spawnParticles(playerScreenX, playerScreenY - 25, '#ff007f', 18, 220);
                addFloatingText('💥 SMASH +30!', playerScreenX, playerScreenY - 45, '#ff007f');
                continue;
              } else if (shieldActive) {
                shieldActive = false;
                ob.passed = true;
                obstacles.splice(i, 1);
                AudioEngine.playBoom();
                triggerShake(8, 0.25);
                addFloatingText('🛡️ SHIELD BROKEN!', playerScreenX, playerScreenY - 50, '#00f0ff');
                continue;
              } else {
                endCurrentGame();
                return;
              }
            }
          }
        }

        if (ob.z < 0.4) {
          obstacles.splice(i, 1);
        }
      }

      hudExtraVal.textContent = nitroTime > 0
        ? '🔥 HYPER'
        : `${Math.floor(nitroCharge)}%`;
    }

    function project3D(laneX, yHeight, zDepth) {
      const horizonY = H * 0.42;
      const fov = 2.1;
      const scale = fov / Math.max(0.4, zDepth);
      const roadHalfWidthBottom = W * 0.42;
      const sx = W * 0.5 + laneX * roadHalfWidthBottom * scale;
      const sy = horizonY + (H * 0.46) * scale - yHeight * 120 * scale;
      return { x: sx, y: sy, scale };
    }

    function render() {
      const pal = currentPalette();
      const horizonY = H * 0.42;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#04030c');
      skyGrad.addColorStop(1, '#1c0936');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY);

      const sunRadius = Math.min(W, H) * 0.15;
      const sunGrad = ctx.createLinearGradient(0, horizonY - sunRadius * 1.8, 0, horizonY);
      sunGrad.addColorStop(0, pal.accent);
      sunGrad.addColorStop(0.5, pal.secondary);
      sunGrad.addColorStop(1, pal.primary);
      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = pal.secondary;
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(W * 0.5, horizonY - sunRadius * 0.35, sunRadius, Math.PI, 0, false);
      ctx.fill();
      ctx.restore();

      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      groundGrad.addColorStop(0, '#120624');
      groundGrad.addColorStop(1, '#04040a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.42;
      [-1.5, -0.5, 0.5, 1.5].forEach((lx) => {
        const pFar = project3D(lx, 0, 32);
        const pNear = project3D(lx, 0, 1);
        ctx.beginPath();
        ctx.moveTo(pFar.x, pFar.y);
        ctx.lineTo(pNear.x, pNear.y);
        ctx.stroke();
      });

      const offset = (distance * 0.45) % 2;
      for (let z = 1; z < 30; z += 2) {
        const gz = z - offset;
        if (gz < 0.8) continue;
        const left = project3D(-1.5, 0, gz);
        const right = project3D(1.5, 0, gz);
        ctx.globalAlpha = Math.max(0.08, Math.min(0.5, 1.4 / gz));
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const sorted = [...obstacles].sort((a, b) => b.z - a.z);
      for (const ob of sorted) {
        const p = project3D(ob.lane, ob.high ? 0.55 : 0, ob.z);
        const size = 68 * p.scale;

        if (ob.type === 'block') {
          ctx.save();
          ctx.fillStyle = '#140826';
          ctx.strokeStyle = pal.secondary;
          ctx.lineWidth = Math.max(1.5, 3 * p.scale);
          ctx.shadowColor = pal.secondary;
          ctx.shadowBlur = 14;
          const bw = size * 1.15;
          const bh = size * 1.35;
          ctx.fillRect(p.x - bw / 2, p.y - bh, bw, bh);
          ctx.strokeRect(p.x - bw / 2, p.y - bh, bw, bh);
          ctx.restore();
        } else if (ob.type === 'laser') {
          ctx.save();
          ctx.strokeStyle = '#ff2a55';
          ctx.lineWidth = Math.max(3, 7 * p.scale);
          ctx.shadowColor = '#ff2a55';
          ctx.shadowBlur = 18;
          const lw = size * 1.35;
          const lh = size * 0.42;
          ctx.beginPath();
          ctx.moveTo(p.x - lw / 2, p.y - lh);
          ctx.lineTo(p.x + lw / 2, p.y - lh);
          ctx.stroke();
          ctx.restore();
        } else if (ob.type === 'coin') {
          ctx.save();
          ctx.fillStyle = pal.accent;
          ctx.shadowColor = pal.accent;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(p.x, p.y - size * 0.5, Math.max(4, size * 0.34), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (ob.type === 'shield') {
          ctx.save();
          ctx.strokeStyle = '#00ff88';
          ctx.fillStyle = 'rgba(0, 255, 136, 0.35)';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y - size * 0.5, Math.max(6, size * 0.42), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      const carP = project3D(carLaneX, carY, 2.0);
      const cw = 86;
      const ch = 42;
      ctx.save();
      ctx.translate(carP.x, carP.y);

      if (carY > 0.02) {
        const groundP = project3D(carLaneX, 0, 2.0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, groundP.y - carP.y, cw * 0.48, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (shieldActive) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, -ch * 0.5, cw * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#0b1026';
      ctx.strokeStyle = nitroTime > 0 ? pal.accent : pal.primary;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = nitroTime > 0 ? pal.accent : pal.primary;
      ctx.shadowBlur = nitroTime > 0 ? 28 : 16;

      ctx.beginPath();
      ctx.moveTo(-cw * 0.5, 0);
      ctx.lineTo(-cw * 0.38, -ch * 0.65);
      ctx.lineTo(-cw * 0.22, -ch);
      ctx.lineTo(cw * 0.22, -ch);
      ctx.lineTo(cw * 0.38, -ch * 0.65);
      ctx.lineTo(cw * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pal.secondary;
      ctx.fillRect(-cw * 0.4, -ch * 0.45, cw * 0.8, 6);

      const flameLen = nitroTime > 0 ? 28 + Math.random() * 18 : 10 + Math.random() * 8;
      ctx.fillStyle = nitroTime > 0 ? pal.accent : pal.primary;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-18, flameLen);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(22, 0);
      ctx.lineTo(18, flameLen);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    return { reset, update, render, moveLane, jump, activateNitro };
  })();

  // ==========================================================================
  // GAME 2: VOID SURVIVOR (2D Action Space Shooter & Bullet-Heaven Arena)
  // ==========================================================================
  const SurvivorGame = (() => {
    let ship = null;
    let bullets = [];
    let enemies = [];
    let gems = [];
    let spawnTimer = 0;
    let waveTimer = 0;

    const UPGRADE_POOL = [
      { id: 'multishot', icon: '🔫', name: 'Twin-Linked Plasma +1', desc: 'Adds +1 simultaneous laser barrel to your fighter' },
      { id: 'firerate', icon: '⚡', name: 'Overclocked Blaster', desc: 'Increases weapon fire rate by +28%' },
      { id: 'orbitals', icon: '🛰️', name: 'Orbital Plasma Drone', desc: 'Spawns a rotating plasma satellite that shreds enemies' },
      { id: 'speed', icon: '🚀', name: 'Ion Thrusters +25%', desc: 'Boosts movement speed & XP magnet radius' },
      { id: 'nova', icon: '💥', name: 'EMP Nova Core +2', desc: 'Grants +2 screen-clearing EMP Nova shockwaves' }
    ];

    function reset() {
      ship = {
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        speed: 245,
        hp: 100,
        maxHp: 100,
        level: 1,
        xp: 0,
        nextXp: 8,
        barrels: 1,
        fireDelay: 0.22,
        fireCooldown: 0,
        orbitals: 0,
        orbitalAngle: 0,
        magnetRadius: 115,
        novas: 2
      };
      bullets = [];
      enemies = [];
      gems = [];
      spawnTimer = 0.4;
      waveTimer = 0;
      document.getElementById('novaCount').textContent = ship.novas;
    }

    function triggerNova() {
      if (!ship || ship.novas <= 0) return;
      ship.novas--;
      document.getElementById('novaCount').textContent = ship.novas;
      AudioEngine.playBoom();
      triggerShake(12, 0.35);
      spawnParticles(ship.x, ship.y, '#00f0ff', 42, 340);
      addFloatingText('💥 EMP NOVA PULSE!', ship.x, ship.y - 40, '#00f0ff');

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        spawnParticles(e.x, e.y, '#ff007f', 10, 160);
        gems.push({ x: e.x, y: e.y, val: e.xp });
        score += 20;
        enemies.splice(i, 1);
      }
    }

    function openUpgradeMenu() {
      gameState = 'upgrade';
      AudioEngine.playLevelUp();
      upgradeOverlay.hidden = false;
      upgradeOptions.innerHTML = '';

      const choices = [...UPGRADE_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
      choices.forEach((upg) => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-option-btn';
        btn.innerHTML = `
          <span class="upg-icon">${upg.icon}</span>
          <div class="upg-text">
            <strong>${upg.name}</strong>
            <span>${upg.desc}</span>
          </div>
        `;
        btn.addEventListener('click', () => {
          applyUpgrade(upg.id);
          upgradeOverlay.hidden = true;
          gameState = 'playing';
        });
        upgradeOptions.appendChild(btn);
      });
    }

    function applyUpgrade(id) {
      if (id === 'multishot') ship.barrels = Math.min(5, ship.barrels + 1);
      else if (id === 'firerate') ship.fireDelay = Math.max(0.07, ship.fireDelay * 0.76);
      else if (id === 'orbitals') ship.orbitals = Math.min(4, ship.orbitals + 1);
      else if (id === 'speed') {
        ship.speed *= 1.2;
        ship.magnetRadius *= 1.3;
      } else if (id === 'nova') {
        ship.novas += 2;
        document.getElementById('novaCount').textContent = ship.novas;
      }
      ship.hp = Math.min(ship.maxHp, ship.hp + 30);
      addFloatingText(`⚡ UPGRADED!`, ship.x, ship.y - 35, '#ffe600');
    }

    function spawnEnemy() {
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (edge === 0) { x = Math.random() * W; y = -25; }
      else if (edge === 1) { x = W + 25; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = H + 25; }
      else { x = -25; y = Math.random() * H; }

      const isTank = Math.random() < Math.min(0.35, waveTimer * 0.008);
      enemies.push({
        x, y,
        r: isTank ? 20 : 13,
        hp: isTank ? 4 + Math.floor(waveTimer / 18) : 1 + Math.floor(waveTimer / 30),
        speed: isTank ? 72 : 105 + Math.min(85, waveTimer * 1.4),
        xp: isTank ? 3 : 1,
        isTank
      });
    }

    function update(dt) {
      waveTimer += dt;

      let mx = 0, my = 0;
      if (keys.KeyW || keys.ArrowUp) my -= 1;
      if (keys.KeyS || keys.ArrowDown) my += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1;
      if (keys.KeyD || keys.ArrowRight) mx += 1;

      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        ship.x += (mx / len) * ship.speed * dt;
        ship.y += (my / len) * ship.speed * dt;
      } else if (pointer.active) {
        const dx = pointer.x - ship.x;
        const dy = pointer.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          ship.x += (dx / dist) * Math.min(dist * 6, ship.speed) * dt;
          ship.y += (dy / dist) * Math.min(dist * 6, ship.speed) * dt;
        }
      }

      ship.x = Math.max(22, Math.min(W - 22, ship.x));
      ship.y = Math.max(55, Math.min(H - 22, ship.y));

      let nearest = null;
      let minDist = Infinity;
      for (const e of enemies) {
        const d = Math.hypot(e.x - ship.x, e.y - ship.y);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      }
      if (nearest) {
        ship.angle = Math.atan2(nearest.y - ship.y, nearest.x - ship.x);
      }

      ship.fireCooldown -= dt;
      if (ship.fireCooldown <= 0 && enemies.length > 0) {
        ship.fireCooldown = ship.fireDelay;
        const spread = 0.14;
        const count = ship.barrels;
        for (let b = 0; b < count; b++) {
          const offsetAngle = (b - (count - 1) / 2) * spread;
          const a = ship.angle + offsetAngle;
          bullets.push({
            x: ship.x + Math.cos(a) * 16,
            y: ship.y + Math.sin(a) * 16,
            vx: Math.cos(a) * 560,
            vy: Math.sin(a) * 560,
            life: 1.4
          });
        }
        AudioEngine.playLaser();
      }

      ship.orbitalAngle += dt * 4.2;

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
          bullets.splice(i, 1);
        }
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(0.22, 0.88 - waveTimer * 0.01);
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const ang = Math.atan2(ship.y - e.y, ship.x - e.x);
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;

        for (let k = 0; k < ship.orbitals; k++) {
          const oa = ship.orbitalAngle + (k * Math.PI * 2) / ship.orbitals;
          const ox = ship.x + Math.cos(oa) * 58;
          const oy = ship.y + Math.sin(oa) * 58;
          if (Math.hypot(e.x - ox, e.y - oy) < e.r + 10) {
            e.hp -= dt * 12;
          }
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 6) {
            bullets.splice(j, 1);
            e.hp -= 1;
            break;
          }
        }

        if (e.hp <= 0) {
          spawnParticles(e.x, e.y, e.isTank ? '#ffbe0b' : '#ff007f', 12, 170);
          AudioEngine.playTone(240, 0.08, 'sawtooth', 0.11, 90);
          gems.push({ x: e.x, y: e.y, val: e.xp });
          score += e.isTank ? 35 : 15;
          enemies.splice(i, 1);
          continue;
        }

        if (Math.hypot(e.x - ship.x, e.y - ship.y) < e.r + 14) {
          enemies.splice(i, 1);
          ship.hp -= 25;
          triggerShake(8, 0.25);
          AudioEngine.playBoom();
          spawnParticles(ship.x, ship.y, '#ff2a55', 16, 200);
          if (ship.hp <= 0) {
            endCurrentGame();
            return;
          }
        }
      }

      for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        const d = Math.hypot(ship.x - g.x, ship.y - g.y);
        if (d < ship.magnetRadius) {
          g.x += ((ship.x - g.x) / d) * 340 * dt;
          g.y += ((ship.y - g.y) / d) * 340 * dt;
        }
        if (d < 22) {
          gems.splice(i, 1);
          ship.xp += g.val;
          runCoins += 1;
          saveData.coins += 1;
          persistSave();
          AudioEngine.playCoin();
          if (ship.xp >= ship.nextXp) {
            ship.xp -= ship.nextXp;
            ship.level += 1;
            ship.nextXp = Math.floor(ship.nextXp * 1.45 + 4);
            openUpgradeMenu();
            return;
          }
        }
      }

      hudExtraVal.textContent = `LVL ${ship.level} (${ship.hp} HP)`;
    }

    function render() {
      const pal = currentPalette();
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, W, H);

      const xpRatio = Math.min(1, ship.xp / ship.nextXp);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, 0, W, 6);
      ctx.fillStyle = pal.primary;
      ctx.fillRect(0, 0, W * xpRatio, 6);

      ctx.fillStyle = pal.accent;
      for (const g of gems) {
        ctx.beginPath();
        ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = pal.primary;
      for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.strokeStyle = e.isTank ? pal.accent : pal.secondary;
        ctx.fillStyle = 'rgba(255, 0, 127, 0.18)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const sides = e.isTank ? 6 : 4;
        for (let s = 0; s < sides; s++) {
          const a = (s * Math.PI * 2) / sides + waveTimer * 2;
          const px = Math.cos(a) * e.r;
          const py = Math.sin(a) * e.r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      for (let k = 0; k < ship.orbitals; k++) {
        const oa = ship.orbitalAngle + (k * Math.PI * 2) / ship.orbitals;
        const ox = ship.x + Math.cos(oa) * 58;
        const oy = ship.y + Math.sin(oa) * 58;
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(ox, oy, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = pal.primary;
      ctx.fillStyle = '#0b132b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = pal.primary;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-13, -12);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-13, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    return { reset, update, render, triggerNova };
  })();

  // ==========================================================================
  // GAME 3: CYBER STACK 3D (3D Isometric Precision Tower Builder)
  // ==========================================================================
  const StackGame = (() => {
    let tower = [];
    let debris = [];
    let current = null;
    let combo = 0;
    let camY = 0;
    const SLAB_H = 24;

    function reset() {
      tower = [
        { x: 0, z: 0, w: 150, d: 150, level: 0 }
      ];
      debris = [];
      combo = 0;
      camY = 0;
      spawnNextSlab();
    }

    function spawnNextSlab() {
      const top = tower[tower.length - 1];
      const lvl = tower.length;
      const axis = lvl % 2 === 1 ? 'x' : 'z';
      const dist = 210;
      current = {
        x: axis === 'x' ? -dist : top.x,
        z: axis === 'z' ? -dist : top.z,
        w: top.w,
        d: top.d,
        axis,
        dir: 1,
        speed: Math.min(340, 155 + lvl * 5.2),
        level: lvl
      };
      hudExtraVal.textContent = combo > 0 ? `🔥 ${combo}x` : '0x';
    }

    function placeSlab() {
      if (!current) return;
      const prev = tower[tower.length - 1];
      const axis = current.axis;
      const delta = current[axis] - prev[axis];
      const sizeKey = axis === 'x' ? 'w' : 'd';
      const absDelta = Math.abs(delta);

      if (absDelta >= current[sizeKey]) {
        AudioEngine.playBoom();
        triggerShake(10, 0.3);
        endCurrentGame();
        return;
      }

      if (absDelta <= 6.5) {
        current[axis] = prev[axis];
        combo += 1;
        score += 20 + combo * 5;
        runCoins += 2;
        saveData.coins += 2;
        persistSave();
        AudioEngine.playCombo(combo);
        addFloatingText(`⚡ PERFECT ${combo}x!`, W / 2, H * 0.32, '#ffe600');

        if (combo >= 4) {
          current.w = Math.min(150, current.w + 10);
          current.d = Math.min(150, current.d + 10);
          addFloatingText('🔼 SLAB EXPANDED!', W / 2, H * 0.26, '#00ff88');
        }
      } else {
        combo = 0;
        const overlap = current[sizeKey] - absDelta;
        const cutSize = absDelta;
        const sign = Math.sign(delta);

        const chunk = {
          x: current.x,
          z: current.z,
          w: current.w,
          d: current.d,
          y: current.level * SLAB_H,
          vy: 0,
          level: current.level
        };
        chunk[sizeKey] = cutSize;
        chunk[axis] = prev[axis] + sign * (overlap / 2 + cutSize / 2);
        debris.push(chunk);

        current[sizeKey] = overlap;
        current[axis] = prev[axis] + delta / 2;
        score += 10;
        runCoins += 1;
        saveData.coins += 1;
        persistSave();
        AudioEngine.playTone(300, 0.09, 'triangle', 0.14);
      }

      tower.push({
        x: current.x,
        z: current.z,
        w: current.w,
        d: current.d,
        level: current.level
      });

      spawnNextSlab();
    }

    function update(dt) {
      if (current) {
        const axis = current.axis;
        current[axis] += current.dir * current.speed * dt;
        if (current[axis] > 215) {
          current[axis] = 215;
          current.dir = -1;
        } else if (current[axis] < -215) {
          current[axis] = -215;
          current.dir = 1;
        }
      }

      const targetCamY = Math.max(0, (tower.length - 6) * SLAB_H);
      camY += (targetCamY - camY) * Math.min(1, dt * 6);

      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.vy -= 550 * dt;
        d.y += d.vy * dt;
        if (d.y < camY - 300) debris.splice(i, 1);
      }
    }

    function isoProject(x, y, z) {
      const cx = W * 0.5 + (x - z) * 0.866;
      const cy = H * 0.72 + (x + z) * 0.5 - (y - camY);
      return { x: cx, y: cy };
    }

    function drawIsoBox(slab, yBottom) {
      const hw = slab.w / 2;
      const hd = slab.d / 2;
      const yTop = yBottom + SLAB_H;

      const hue = (200 + slab.level * 14) % 360;

      const t0 = isoProject(slab.x - hw, yTop, slab.z - hd);
      const t1 = isoProject(slab.x + hw, yTop, slab.z - hd);
      const t2 = isoProject(slab.x + hw, yTop, slab.z + hd);
      const t3 = isoProject(slab.x - hw, yTop, slab.z + hd);

      const b1 = isoProject(slab.x + hw, yBottom, slab.z - hd);
      const b2 = isoProject(slab.x + hw, yBottom, slab.z + hd);
      const b3 = isoProject(slab.x - hw, yBottom, slab.z + hd);

      ctx.fillStyle = `hsl(${hue}, 88%, 62%)`;
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `hsl(${hue}, 82%, 46%)`;
      ctx.beginPath();
      ctx.moveTo(t3.x, t3.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(b3.x, b3.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `hsl(${hue}, 82%, 34%)`;
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(b1.x, b1.y);
      ctx.closePath();
      ctx.fill();
    }

    function render() {
      ctx.fillStyle = '#060612';
      ctx.fillRect(0, 0, W, H);

      const startIdx = Math.max(0, tower.length - 22);
      for (let i = startIdx; i < tower.length; i++) {
        const s = tower[i];
        drawIsoBox(s, s.level * SLAB_H);
      }

      for (const d of debris) {
        drawIsoBox(d, d.y);
      }

      if (current) {
        drawIsoBox(current, current.level * SLAB_H);
      }
    }

    return { reset, update, render, placeSlab };
  })();

  function syncMenuOverlay(isGameOver = false) {
    const meta = GAME_META[activeGame];
    overlayBadge.textContent = isGameOver ? '⚡ RUN COMPLETE' : meta.badge;
    overlayTitle.textContent = isGameOver ? 'GAME OVER' : meta.title;
    overlayDesc.textContent = meta.desc;
    hudExtraLabel.textContent = meta.extraLabel;
    hudBest.textContent = saveData.best[activeGame] || 0;

    controlsGuide.innerHTML = meta.controls.map(
      ([k, v]) => `<div class="control-item"><kbd>${k}</kbd><span>${v}</span></div>`
    ).join('');

    statsSummary.hidden = !isGameOver;
    if (isGameOver) {
      finalScoreVal.textContent = score;
      finalBestVal.textContent = saveData.best[activeGame];
      finalCoinsVal.textContent = `+${runCoins} ⚡`;
      startGameBtn.textContent = '↻ PLAY AGAIN';
    } else {
      startGameBtn.textContent = '▶ LAUNCH GAME';
    }

    touchDrift.hidden = activeGame !== 'drift';
    touchSurvivor.hidden = activeGame !== 'survivor';
    touchStack.hidden = activeGame !== 'stack';
  }

  function selectGame(gameId) {
    if (!GAME_META[gameId]) return;
    activeGame = gameId;
    gameState = 'menu';
    score = 0;
    runCoins = 0;
    hudScore.textContent = '0';

    document.querySelectorAll('.game-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === gameId);
    });

    if (activeGame === 'drift') DriftGame.reset();
    else if (activeGame === 'survivor') SurvivorGame.reset();
    else if (activeGame === 'stack') StackGame.reset();

    upgradeOverlay.hidden = true;
    menuOverlay.hidden = false;
    syncMenuOverlay(false);
  }

  function startCurrentGame() {
    score = 0;
    runCoins = 0;
    floatingTexts = [];
    particles = [];
    if (activeGame === 'drift') DriftGame.reset();
    else if (activeGame === 'survivor') SurvivorGame.reset();
    else if (activeGame === 'stack') StackGame.reset();

    gameState = 'playing';
    menuOverlay.hidden = true;
    upgradeOverlay.hidden = true;
    AudioEngine.playTone(520, 0.1, 'triangle', 0.15, 780);
  }

  function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    overlayBadge.textContent = '⏸ GAME PAUSED';
    overlayTitle.textContent = GAME_META[activeGame].title;
    statsSummary.hidden = true;
    startGameBtn.textContent = '▶ RESUME GAME';
    menuOverlay.hidden = false;
  }

  function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = 'playing';
    menuOverlay.hidden = true;
  }

  function endCurrentGame() {
    gameState = 'gameover';
    AudioEngine.playBoom();
    triggerShake(12, 0.35);
    if (score > (saveData.best[activeGame] || 0)) {
      saveData.best[activeGame] = score;
    }
    const bonusCoins = Math.max(1, Math.floor(score / 60));
    runCoins += bonusCoins;
    saveData.coins += bonusCoins;
    persistSave();

    menuOverlay.hidden = false;
    syncMenuOverlay(true);
  }

  startGameBtn.addEventListener('click', () => {
    if (gameState === 'paused') resumeGame();
    else startCurrentGame();
  });

  pauseBtn.addEventListener('click', () => {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
  });

  document.querySelectorAll('.game-tab').forEach(btn => {
    btn.addEventListener('click', () => selectGame(btn.dataset.game));
  });

  document.querySelectorAll('.mini-switch').forEach(btn => {
    btn.addEventListener('click', () => selectGame(btn.dataset.switch));
  });

  persistSave();
  selectGame('drift');

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'playing') {
      if (activeGame === 'drift') DriftGame.update(dt);
      else if (activeGame === 'survivor') SurvivorGame.update(dt);
      else if (activeGame === 'stack') StackGame.update(dt);

      hudScore.textContent = score;
      if (score > (saveData.best[activeGame] || 0)) {
        saveData.best[activeGame] = score;
        hudBest.textContent = score;
      }
    }

    ctx.save();
    if (shakeTime > 0) {
      shakeTime -= dt;
      const sx = (Math.random() - 0.5) * shakeMag * 2;
      const sy = (Math.random() - 0.5) * shakeMag * 2;
      ctx.translate(sx, sy);
    }

    if (activeGame === 'drift') DriftGame.render();
    else if (activeGame === 'survivor') SurvivorGame.render();
    else if (activeGame === 'stack') StackGame.render();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
