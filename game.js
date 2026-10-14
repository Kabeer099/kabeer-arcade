/**
 * ASPHALT OVERDRIVE 3D — KABEER MOTORSPORT DIVISION
 * Pure Vanilla JS 3D Perspective Highway Engine + Web Audio V8 Synthesizer
 * 100% Offline PWA Ready — Zero External Assets Required
 */

(() => {
  'use strict';

  // --- PWA SERVICE WORKER & OFFLINE INDICATOR ---
  const netBadge = document.getElementById('netBadge');
  const netText = document.getElementById('netText');
  const installBtn = document.getElementById('installBtn');
  let deferredInstallPrompt = null;

  function updateNetworkBadge() {
    if (navigator.onLine) {
      netBadge.className = 'status-pill online';
      netText.textContent = 'OFFLINE READY ✓';
    } else {
      netBadge.className = 'status-pill offline';
      netText.textContent = 'PLAYING OFFLINE ⚡';
    }
  }
  window.addEventListener('online', updateNetworkBadge);
  window.addEventListener('offline', updateNetworkBadge);
  updateNetworkBadge();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  // --- PERSISTENT SAVE STATE (LOCALSTORAGE) ---
  const STORAGE_KEY = 'kabeer_motorsport_save_v3';
  const defaultSave = {
    credits: 1250,
    selectedCar: 'apex',
    ownedCars: ['apex'],
    weather: 'day',
    sfx: true,
    bestScores: {
      highway: 0,
      timetrial: 0,
      pursuit: 0
    },
    tuning: {
      engine: 1,
      handling: 1,
      boost: 1
    }
  };

  let save = loadSave();
  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultSave);
      const parsed = JSON.parse(raw);
      return {
        ...defaultSave,
        ...parsed,
        bestScores: { ...defaultSave.bestScores, ...(parsed.bestScores || {}) },
        tuning: { ...defaultSave.tuning, ...(parsed.tuning || {}) },
        ownedCars: Array.isArray(parsed.ownedCars) && parsed.ownedCars.length ? parsed.ownedCars : ['apex']
      };
    } catch {
      return structuredClone(defaultSave);
    }
  }

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {}
    updateTopBarUI();
  }

  // --- CAR CATALOG (CLEAN MOTORSPORT PALETTE) ---
  const CARS = {
    apex: {
      id: 'apex',
      name: 'Apex GT-R',
      subtitle: 'Guards Red · Balanced GT3 Chassis',
      price: 0,
      bodyColor: '#d92b38',
      darkColor: '#8f1922',
      stripeColor: '#f4f2ec',
      trimColor: '#16181d',
      topSpeedBase: 285,
      accelBase: 1.0,
      handlingBase: 1.0
    },
    weissach: {
      id: 'weissach',
      name: 'Weissach 911 RS',
      subtitle: 'Chalk White · Track Aero & High Grip',
      price: 600,
      bodyColor: '#ece9e0',
      darkColor: '#b8b4a9',
      stripeColor: '#d92b38',
      trimColor: '#14161a',
      topSpeedBase: 305,
      accelBase: 1.12,
      handlingBase: 1.25
    },
    cobalt: {
      id: 'cobalt',
      name: 'Cobalt F1-LM',
      subtitle: 'Studio Blue · Twin-Turbo Slipstream',
      price: 1200,
      bodyColor: '#435bf0',
      darkColor: '#2536a8',
      stripeColor: '#ffffff',
      trimColor: '#101218',
      topSpeedBase: 328,
      accelBase: 1.25,
      handlingBase: 1.18
    },
    blackwing: {
      id: 'blackwing',
      name: 'Blackwing V12',
      subtitle: 'Stealth Carbon · 355 KM/H Hyper Tourer',
      price: 2200,
      bodyColor: '#22252e',
      darkColor: '#111318',
      stripeColor: '#d9a441',
      trimColor: '#d9a441',
      topSpeedBase: 355,
      accelBase: 1.38,
      handlingBase: 1.32
    }
  };

  // --- WEATHER PRESETS (REALISTIC NON-NEON ENVIRONMENTS) ---
  const WEATHERS = {
    day: {
      id: 'day',
      icon: '☀️',
      label: 'Alpine Day',
      pill: '☀️ ALPINE DAYLIGHT',
      skyTop: '#3b6ca8',
      skyMid: '#7aa6d6',
      skyHorizon: '#d9e6f2',
      sunColor: '#fff9e6',
      mountainFar: '#4c6582',
      mountainNear: '#35495e',
      grassA: '#3b5334',
      grassB: '#33482d',
      asphaltA: '#2f3238',
      asphaltB: '#35383f',
      kerbA: '#c9332b',
      kerbB: '#ebe8df',
      laneDash: '#ebe8df',
      centerLine: '#e0a83a',
      fogColor: 'rgba(217, 230, 242, 0.25)'
    },
    sunset: {
      id: 'sunset',
      icon: '🌅',
      label: 'Canyon Sunset',
      pill: '🌅 CANYON SUNSET',
      skyTop: '#241a2e',
      skyMid: '#9e422e',
      skyHorizon: '#f2ac57',
      sunColor: '#ffd485',
      mountainFar: '#4d292a',
      mountainNear: '#331c21',
      grassA: '#5e3f2d',
      grassB: '#523626',
      asphaltA: '#2a282d',
      asphaltB: '#302d34',
      kerbA: '#b8322a',
      kerbB: '#e3d5c1',
      laneDash: '#e8dac8',
      centerLine: '#e8a435',
      fogColor: 'rgba(242, 172, 87, 0.22)'
    },
    rain: {
      id: 'rain',
      icon: '🌧️',
      label: 'Wet Overcast',
      pill: '🌧️ WET MONSOON',
      skyTop: '#161c24',
      skyMid: '#2d3846',
      skyHorizon: '#566475',
      sunColor: '#9aa8b8',
      mountainFar: '#27313d',
      mountainNear: '#1c242e',
      grassA: '#253029',
      grassB: '#1f2923',
      asphaltA: '#1e2126',
      asphaltB: '#23272d',
      kerbA: '#9e2c28',
      kerbB: '#c2c5cc',
      laneDash: '#b8bdc4',
      centerLine: '#c49332',
      fogColor: 'rgba(86, 100, 117, 0.32)'
    }
  };
  const WEATHER_ORDER = ['day', 'sunset', 'rain'];

  // --- MODE DEFINITIONS ---
  const MODES = {
    highway: {
      id: 'highway',
      kicker: '01 // TWO-WAY HIGHWAY',
      title: 'ASPHALT OVERDRIVE',
      desc: 'Precision 3D highway racing. Thread through heavy traffic, use oncoming left lanes for 2x velocity multipliers, and build near-miss slipstream combos.'
    },
    timetrial: {
      id: 'timetrial',
      kicker: '02 // CHECKPOINT SPRINT',
      title: 'FIA TIME TRIAL',
      desc: 'Race against the countdown clock. Blast through overhead FIA timing gantries every 1.2 KM to extend your time (+14s) and earn bonus championship payouts.'
    },
    pursuit: {
      id: 'pursuit',
      kicker: '03 // INTERCEPTOR ESCAPE',
      title: 'HIGHWAY PURSUIT',
      desc: 'Outrun aggressive Highway Patrol interceptors attempting to pace and box your vehicle in. Use Slipstream Overdrive to break through patrol formations.'
    }
  };

  // --- PROCEDURAL WEB AUDIO ENGINE (REALISTIC V8 / SFX) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, gainVal = 0.08, endFreq = null) {
      if (!save.sfx) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    playNearMiss(combo) {
      // Aerodynamic Doppler pass whoosh + crisp telemetry chime
      const base = Math.min(880, 420 + combo * 55);
      this.playTone(base, 'triangle', 0.16, 0.09, base * 1.35);
      this.playTone(190, 'sawtooth', 0.18, 0.04, 75);
    }

    playCheckpoint() {
      this.playTone(587.33, 'triangle', 0.12, 0.1);
      setTimeout(() => this.playTone(880, 'triangle', 0.22, 0.11), 90);
    }

    playGearShift() {
      this.playTone(140, 'sawtooth', 0.09, 0.05, 95);
    }

    playBoostEngage() {
      this.playTone(160, 'sawtooth', 0.32, 0.09, 420);
    }

    playCrash() {
      this.playTone(115, 'sawtooth', 0.35, 0.14, 32);
      this.playTone(78, 'square', 0.28, 0.1, 28);
    }
  }

  const audio = new SoundEngine();

  // --- CANVAS & DOM REFERENCES ---
  const canvas = document.getElementById('raceCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const HORIZON_Y = Math.floor(H * 0.41);

  const hudScore = document.getElementById('hudScore');
  const hudDist = document.getElementById('hudDist');
  const hudBest = document.getElementById('hudBest');
  const timerBox = document.getElementById('timerBox');
  const hudTimer = document.getElementById('hudTimer');
  const comboBanner = document.getElementById('comboBanner');
  const comboText = document.getElementById('comboText');
  const hudCarName = document.getElementById('hudCarName');
  const hudBoostPct = document.getElementById('hudBoostPct');
  const hudBoostFill = document.getElementById('hudBoostFill');
  const hudGear = document.getElementById('hudGear');
  const hudRpmFill = document.getElementById('hudRpmFill');
  const hudSpeed = document.getElementById('hudSpeed');

  const menuOverlay = document.getElementById('menuOverlay');
  const modalKicker = document.getElementById('modalKicker');
  const modalWeatherTag = document.getElementById('modalWeatherTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const statLastScore = document.getElementById('statLastScore');
  const statBestScore = document.getElementById('statBestScore');
  const statTopSpeed = document.getElementById('statTopSpeed');
  const statEarned = document.getElementById('statEarned');
  const modalCarTitle = document.getElementById('modalCarTitle');
  const startRaceBtn = document.getElementById('startRaceBtn');

  const garageModal = document.getElementById('garageModal');
  const carRoster = document.getElementById('carRoster');

  // --- INPUT STATE ---
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  };

  window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW') keys.up = true;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;
    if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
      if (state.running && !state.paused && !keys.boost && state.boost > 15) {
        audio.playBoostEngage();
      }
      keys.boost = true;
      if (state.running) e.preventDefault();
    }
    if (code === 'KeyC') {
      cycleWeather();
    }
    if (code === 'KeyP' || code === 'Escape') {
      if (state.running) togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW') keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
    if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') keys.boost = false;
  });

  // Mobile Touch Bindings
  function bindTouch(id, keyName) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const setKey = (val) => (e) => {
      e.preventDefault();
      keys[keyName] = val;
    };
    btn.addEventListener('pointerdown', setKey(true));
    btn.addEventListener('pointerup', setKey(false));
    btn.addEventListener('pointerleave', setKey(false));
    btn.addEventListener('pointercancel', setKey(false));
  }
  bindTouch('btnLeft', 'left');
  bindTouch('btnRight', 'right');
  bindTouch('btnBrake', 'down');
  bindTouch('btnBoost', 'boost');

  // --- GAME STATE ---
  let currentMode = 'highway';
  const LANE_X = [-0.72, -0.24, 0.24, 0.72]; // 4 highway lanes (0,1 oncoming; 2,3 same way)

  const state = {
    running: false,
    paused: false,
    roadZ: 0,
    distanceKm: 0,
    nextCheckpointKm: 1.0,
    score: 0,
    runTopSpeed: 0,
    creditsEarned: 0,
    timeLeft: 45.0,
    integrity: 3, // 3 chassis armor points
    invulnTimer: 0,
    shakeTimer: 0,
    playerX: 0.24, // Start in right-hand cruising lane (lane 2)
    playerVelX: 0,
    steerAngle: 0,
    speedKmh: 0,
    gear: 1,
    boost: 100,
    boosting: false,
    combo: 0,
    comboTimer: 0,
    roadCurve: 0,
    targetCurve: 0,
    curveTimer: 6,
    traffic: [],
    popups: [],
    particles: [],
    rainDrops: Array.from({ length: 95 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 14 + Math.random() * 14,
      speed: 750 + Math.random() * 350
    }))
  };

  function getActiveCar() {
    return CARS[save.selectedCar] || CARS.apex;
  }

  function getMaxSpeedKmh() {
    const car = getActiveCar();
    const engineBonus = (save.tuning.engine - 1) * 14;
    return car.topSpeedBase + engineBonus;
  }

  function resetRaceState() {
    state.roadZ = 0;
    state.distanceKm = 0;
    state.nextCheckpointKm = 1.0;
    state.score = 0;
    state.runTopSpeed = 0;
    state.creditsEarned = 0;
    state.timeLeft = 45.0;
    state.integrity = 3;
    state.invulnTimer = 0;
    state.shakeTimer = 0;
    state.playerX = LANE_X[2];
    state.playerVelX = 0;
    state.steerAngle = 0;
    state.speedKmh = 95;
    state.gear = 2;
    state.boost = 100;
    state.boosting = false;
    state.combo = 0;
    state.comboTimer = 0;
    state.roadCurve = 0;
    state.targetCurve = 0;
    state.traffic = [];
    state.popups = [];
    state.particles = [];

    // Seed initial highway traffic ahead
    for (let z = 90; z <= 360; z += 55) {
      spawnTrafficVehicle(z);
    }
  }

  const TRAFFIC_PALETTE = [
    { name: 'Sedan', body: '#d6d4ce', roof: '#9e9c96', w: 0.16, h: 0.85 },
    { name: 'Executive', body: '#272b33', roof: '#15181d', w: 0.165, h: 0.88 },
    { name: 'Coupe', body: '#b8322a', roof: '#781d18', w: 0.16, h: 0.82 },
    { name: 'Touring', body: '#34527a', roof: '#1f334d', w: 0.165, h: 0.88 },
    { name: 'SUV', body: '#495446', roof: '#2d362b', w: 0.18, h: 1.04 },
    { name: 'SilverGT', body: '#8c929c', roof: '#595e66', w: 0.16, h: 0.84 }
  ];

  function spawnTrafficVehicle(customZ = null) {
    const laneIdx = Math.floor(Math.random() * 4);
    const z = customZ !== null ? customZ : 350 + Math.random() * 50;

    // Prevent overlapping vehicles in same lane
    const tooClose = state.traffic.some(
      (t) => Math.abs(t.laneIdx - laneIdx) < 0.5 && Math.abs(t.z - z) < 52
    );
    if (tooClose) return;

    const isOncoming = laneIdx < 2;
    const isInterceptor = currentMode === 'pursuit' && !isOncoming && Math.random() < 0.36;

    const spec = isInterceptor
      ? { name: 'Patrol', body: '#14161b', roof: '#f4f2ec', w: 0.168, h: 0.9, police: true }
      : TRAFFIC_PALETTE[Math.floor(Math.random() * TRAFFIC_PALETTE.length)];

    const baseSpeed = isOncoming
      ? -(105 + Math.random() * 45)
      : isInterceptor
      ? 165 + Math.random() * 45
      : 105 + Math.random() * 55;

    state.traffic.push({
      laneIdx,
      x: LANE_X[laneIdx],
      targetX: LANE_X[laneIdx],
      z,
      speedKmh: baseSpeed,
      spec,
      isOncoming,
      isInterceptor,
      nearMissed: false,
      laneChangeTimer: 1.5 + Math.random() * 3.5,
      blinkerDir: 0
    });
  }

  // --- UI CONTROLS & GARAGE ---
  function updateTopBarUI() {
    document.getElementById('creditsVal').textContent = `$${save.credits.toLocaleString()}`;
    const w = WEATHERS[save.weather] || WEATHERS.day;
    document.getElementById('weatherIcon').textContent = w.icon;
    document.getElementById('weatherLabel').textContent = w.label;
    modalWeatherTag.textContent = w.pill;

    const sfxBtn = document.getElementById('sfxBtn');
    sfxBtn.classList.toggle('active', save.sfx);
    sfxBtn.querySelector('span').textContent = save.sfx ? '🔊 Engine SFX' : '🔇 Muted';

    const car = getActiveCar();
    hudCarName.textContent = car.name.toUpperCase();
    modalCarTitle.textContent = `${car.name} (${car.subtitle.split('·')[0].trim()})`;
    hudBest.textContent = (save.bestScores[currentMode] || 0).toLocaleString();
    statBestScore.textContent = (save.bestScores[currentMode] || 0).toLocaleString();
  }

  function cycleWeather() {
    const idx = WEATHER_ORDER.indexOf(save.weather);
    save.weather = WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
    persistSave();
  }

  document.getElementById('weatherBtn').addEventListener('click', cycleWeather);

  document.getElementById('sfxBtn').addEventListener('click', () => {
    save.sfx = !save.sfx;
    persistSave();
  });

  document.querySelectorAll('.mode-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      timerBox.hidden = currentMode !== 'timetrial';

      const m = MODES[currentMode];
      modalKicker.textContent = m.kicker;
      modalTitle.textContent = m.title;
      modalDesc.textContent = m.desc;
      state.running = false;
      state.paused = false;
      resetRaceState();
      updateTopBarUI();
      menuOverlay.hidden = false;
    });
  });

  function renderGarage() {
    carRoster.innerHTML = '';
    Object.values(CARS).forEach((car) => {
      const owned = save.ownedCars.includes(car.id);
      const selected = save.selectedCar === car.id;
      const card = document.createElement('div');
      card.className = `car-card ${selected ? 'selected' : ''}`;
      card.innerHTML = `
        <div>
          <div class="car-card-top">
            <h4>${car.name}</h4>
            <span class="car-swatch" style="background:${car.bodyColor}"></span>
          </div>
          <p>${car.subtitle}</p>
          <p style="margin-top:4px;font-family:var(--font-mono);font-size:0.7rem;color:#f3c66b;">
            Top Speed: ${car.topSpeedBase} KM/H
          </p>
        </div>
        <button class="car-Action-btn ${selected ? 'active-car' : ''}">
          ${selected ? '✓ SELECTED IN PADDOCK' : owned ? 'SELECT CHASSIS' : `UNLOCK — $${car.price.toLocaleString()}`}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (owned) {
          save.selectedCar = car.id;
          persistSave();
          renderGarage();
        } else if (save.credits >= car.price) {
          save.credits -= car.price;
          save.ownedCars.push(car.id);
          save.selectedCar = car.id;
          audio.playCheckpoint();
          persistSave();
          renderGarage();
        }
      });
      carRoster.appendChild(card);
    });

    // Tuning buttons
    const tuneTypes = [
      { key: 'engine', lvlEl: 'lvlEngine', btnEl: 'buyEngine' },
      { key: 'handling', lvlEl: 'lvlHandling', btnEl: 'buyHandling' },
      { key: 'boost', lvlEl: 'lvlBoost', btnEl: 'buyBoost' }
    ];

    tuneTypes.forEach(({ key, lvlEl, btnEl }) => {
      const lvl = save.tuning[key] || 1;
      const cost = lvl * 250;
      document.getElementById(lvlEl).textContent = `Stage ${lvl} / 5`;
      const btn = document.getElementById(btnEl);
      if (lvl >= 5) {
        btn.textContent = 'MAX STAGE';
        btn.disabled = true;
      } else {
        btn.textContent = `UPGRADE — $${cost}`;
        btn.disabled = save.credits < cost;
        btn.onclick = () => {
          if (save.credits >= cost && save.tuning[key] < 5) {
            save.credits -= cost;
            save.tuning[key]++;
            audio.playCheckpoint();
            persistSave();
            renderGarage();
          }
        };
      }
    });
  }

  document.getElementById('garageBtn').addEventListener('click', () => {
    renderGarage();
    garageModal.hidden = false;
  });
  document.getElementById('openGarageFromModal').addEventListener('click', () => {
    renderGarage();
    garageModal.hidden = false;
  });
  document.getElementById('closeGarageBtn').addEventListener('click', () => {
    garageModal.hidden = true;
  });

  function startRace() {
    audio.init();
    garageModal.hidden = true;
    menuOverlay.hidden = true;
    resetRaceState();
    state.running = true;
    state.paused = false;
  }

  startRaceBtn.addEventListener('click', startRace);

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    if (state.paused) {
      modalKicker.textContent = 'RACE PAUSED';
      modalTitle.textContent = 'TELEMETRY HOLD';
      modalDesc.textContent = 'Take a breather or adjust your garage tuning before resuming the drive.';
      startRaceBtn.querySelector('span').textContent = 'RESUME DRIVE';
      menuOverlay.hidden = false;
    } else {
      menuOverlay.hidden = true;
    }
  }

  document.getElementById('pauseBtn').addEventListener('click', () => {
    if (!state.running) return;
    if (state.paused) {
      state.paused = false;
      menuOverlay.hidden = true;
    } else {
      togglePause();
    }
  });

  startRaceBtn.addEventListener('click', () => {
    if (state.running && state.paused) {
      state.paused = false;
      menuOverlay.hidden = true;
    } else {
      startRaceBtn.querySelector('span').textContent = 'START ENGINE & DRIVE';
      startRace();
    }
  });

  function finishRace(reasonTitle) {
    state.running = false;
    state.paused = false;
    const finalScore = Math.floor(state.score);
    const earned = Math.max(25, Math.floor(finalScore / 18) + state.creditsEarned);
    save.credits += earned;

    if (finalScore > (save.bestScores[currentMode] || 0)) {
      save.bestScores[currentMode] = finalScore;
    }
    persistSave();

    modalKicker.textContent = `${MODES[currentMode].kicker} // SESSION COMPLETE`;
    modalTitle.textContent = reasonTitle;
    modalDesc.textContent = `You covered ${state.distanceKm.toFixed(2)} KM reaching a peak velocity of ${Math.floor(state.runTopSpeed)} KM/H.`;
    statLastScore.textContent = finalScore.toLocaleString();
    statBestScore.textContent = (save.bestScores[currentMode] || 0).toLocaleString();
    statTopSpeed.innerHTML = `${Math.floor(state.runTopSpeed)} <small>KM/H</small>`;
    statEarned.textContent = `+$${earned.toLocaleString()}`;
    startRaceBtn.querySelector('span').textContent = 'RACE AGAIN';
    menuOverlay.hidden = false;
  }

  // --- UPDATE PHYSICS & TRAFFIC ---
  function updateRace(dt) {
    const car = getActiveCar();
    const maxKmh = getMaxSpeedKmh();
    const accelMult = car.accelBase * (1 + (save.tuning.engine - 1) * 0.08);
    const handleMult = car.handlingBase * (1 + (save.tuning.handling - 1) * 0.1);
    const boostDrain = 26 / (1 + (save.tuning.boost - 1) * 0.18);

    // Slipstream Overdrive Boost
    if (keys.boost && state.boost > 2) {
      state.boosting = true;
      state.boost = Math.max(0, state.boost - boostDrain * dt);
    } else {
      state.boosting = false;
      state.boost = Math.min(100, state.boost + 6.5 * dt);
    }

    const effectiveMax = state.boosting ? maxKmh + 52 : maxKmh;

    // Throttle & Braking
    if (keys.down) {
      state.speedKmh = Math.max(60, state.speedKmh - 190 * handleMult * dt);
    } else if (state.boosting) {
      state.speedKmh = Math.min(effectiveMax, state.speedKmh + 145 * accelMult * dt);
    } else if (keys.up) {
      state.speedKmh = Math.min(effectiveMax, state.speedKmh + 85 * accelMult * dt);
    } else {
      // Natural highway cruise acceleration up to ~78% top speed
      const cruiseTarget = maxKmh * 0.78;
      if (state.speedKmh < cruiseTarget) {
        state.speedKmh = Math.min(cruiseTarget, state.speedKmh + 48 * accelMult * dt);
      } else {
        state.speedKmh = Math.max(cruiseTarget, state.speedKmh - 28 * dt);
      }
    }

    if (state.speedKmh > state.runTopSpeed) {
      state.runTopSpeed = state.speedKmh;
    }

    // 6-Speed Automatic Gearbox Calculation
    const speedRatio = state.speedKmh / maxKmh;
    const newGear = Math.min(6, Math.max(1, Math.ceil(speedRatio * 6)));
    if (newGear > state.gear) {
      audio.playGearShift();
    }
    state.gear = newGear;

    // Road Curvature
    state.curveTimer -= dt;
    if (state.curveTimer <= 0) {
      state.curveTimer = 4.5 + Math.random() * 5;
      state.targetCurve = (Math.random() - 0.5) * 1.1;
    }
    state.roadCurve += (state.targetCurve - state.roadCurve) * dt * 0.8;

    // Steering & Centrifugal Curve Drift
    let steerInput = 0;
    if (keys.left) steerInput -= 1;
    if (keys.right) steerInput += 1;

    const steerSpeed = 1.48 * handleMult;
    state.playerX += steerInput * steerSpeed * dt;
    state.playerX -= state.roadCurve * (state.speedKmh / 320) * 0.36 * dt;
    state.steerAngle += (steerInput - state.steerAngle) * 12 * dt;

    // Off-road shoulder rumble clamp
    if (Math.abs(state.playerX) > 0.94) {
      state.playerX = Math.sign(state.playerX) * 0.94;
      state.speedKmh = Math.max(75, state.speedKmh - 95 * dt);
    }

    // Advance Forward Distance
    const worldSpeed = state.speedKmh * 0.95; // Z units per second
    state.roadZ += worldSpeed * dt;
    state.distanceKm += (state.speedKmh / 3600) * dt;

    // Score Calculation (Oncoming left lanes = 2x multiplier!)
    const inOncomingLane = state.playerX < -0.02;
    const laneMult = inOncomingLane && state.speedKmh > 130 ? 2.0 : 1.0;
    state.score += (state.speedKmh * 0.24 * laneMult * (state.boosting ? 1.5 : 1.0)) * dt;

    // Checkpoint Sprint Mode Logic
    if (currentMode === 'timetrial') {
      state.timeLeft -= dt;
      if (state.distanceKm >= state.nextCheckpointKm) {
        state.nextCheckpointKm += 1.0;
        state.timeLeft += 14.0;
        state.creditsEarned += 75;
        audio.playCheckpoint();
        state.popups.push({
          text: 'FIA CHECKPOINT +14.0s',
          sub: '+$75 BONUS',
          x: W * 0.5,
          y: H * 0.34,
          color: '#4bce97',
          life: 1.4
        });
      }
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        finishRace('TIME EXPIRED');
        return;
      }
    }

    // Invulnerability & Combo Timers
    if (state.invulnTimer > 0) state.invulnTimer -= dt;
    if (state.shakeTimer > 0) state.shakeTimer -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        comboBanner.hidden = true;
      }
    }

    // Spawn & Update Traffic Vehicles
    if (state.traffic.length < 9 && Math.random() < 0.08) {
      spawnTrafficVehicle();
    }

    for (let i = state.traffic.length - 1; i >= 0; i--) {
      const t = state.traffic[i];
      const relSpeed = worldSpeed - t.speedKmh * 0.95;
      t.z -= relSpeed * dt;

      // Subtle AI Lane Changing with Turn Signal Blinker
      if (!t.isOncoming && t.z > 70 && t.z < 260) {
        t.laneChangeTimer -= dt;
        if (t.laneChangeTimer < 0.7 && t.blinkerDir === 0) {
          const targetLane = t.laneIdx === 2 ? 3 : 2;
          t.blinkerDir = targetLane > t.laneIdx ? 1 : -1;
          t.targetX = LANE_X[targetLane];
          t.laneIdx = targetLane;
        }
        if (t.laneChangeTimer <= 0) {
          t.x += (t.targetX - t.x) * 3.5 * dt;
          if (Math.abs(t.targetX - t.x) < 0.01) {
            t.x = t.targetX;
            t.blinkerDir = 0;
            t.laneChangeTimer = 3.0 + Math.random() * 4.0;
          }
        }
      }

      // Check Collision & Near-Miss Overtake around Player Z Plane (z ∈ [14, 28])
      if (t.z < 28 && t.z > 10) {
        const dx = Math.abs(state.playerX - t.x);
        const hitThreshold = 0.145;
        const nearMissThreshold = 0.30;

        if (dx < hitThreshold && state.invulnTimer <= 0) {
          // Collision!
          audio.playCrash();
          state.shakeTimer = 0.35;
          state.invulnTimer = 1.6;
          state.speedKmh = Math.max(70, state.speedKmh * 0.48);
          state.combo = 0;
          comboBanner.hidden = true;
          state.integrity -= 1;

          state.popups.push({
            text: state.integrity > 0 ? `CHASSIS IMPACT (${state.integrity} LEFT)` : 'TOTALED!',
            sub: 'ARMOR DAMAGED',
            x: W * 0.5,
            y: H * 0.38,
            color: '#ff5a64',
            life: 1.2
          });

          if (state.integrity <= 0) {
            finishRace('CHASSIS TOTALED');
            return;
          }
        } else if (dx >= hitThreshold && dx < nearMissThreshold && !t.nearMissed && state.speedKmh >= 120) {
          // Near-Miss Overtake!
          t.nearMissed = true;
          state.combo += 1;
          state.comboTimer = 3.2;
          const pts = (t.isOncoming ? 300 : 180) * state.combo;
          state.score += pts;
          state.creditsEarned += 12 * state.combo;
          state.boost = Math.min(100, state.boost + 18);
          audio.playNearMiss(state.combo);

          comboBanner.hidden = false;
          comboText.textContent = `${t.isOncoming ? 'ONCOMING' : 'NEAR MISS'} x${state.combo} (+${pts})`;

          state.popups.push({
            text: `NEAR MISS +${pts}`,
            sub: t.isOncoming ? 'ONCOMING 2X BONUS' : `SLIPSTREAM x${state.combo}`,
            x: W * 0.5 + (t.x - state.playerX) * 260,
            y: H * 0.52,
            color: '#f3c66b',
            life: 1.0
          });
        }
      }

      // Recycle passed vehicles
      if (t.z < -20 || t.z > 440) {
        state.traffic.splice(i, 1);
      }
    }

    // Update Floating Popups
    for (let i = state.popups.length - 1; i >= 0; i--) {
      const p = state.popups[i];
      p.y -= 38 * dt;
      p.life -= dt;
      if (p.life <= 0) state.popups.splice(i, 1);
    }

    // Update HUD Elements
    hudScore.textContent = Math.floor(state.score).toLocaleString();
    hudDist.innerHTML = `${state.distanceKm.toFixed(1)} <small>KM</small>`;
    hudSpeed.textContent = String(Math.floor(state.speedKmh)).padStart(3, '0');
    hudGear.textContent = state.boosting ? 'S' : String(state.gear);

    const rpmPct = Math.min(100, Math.max(15, ((state.speedKmh % 55) / 55) * 85 + (state.boosting ? 25 : 10)));
    hudRpmFill.style.width = `${rpmPct}%`;
    hudRpmFill.style.background = rpmPct > 85 ? '#e12d39' : '#f4f2ec';

    hudBoostPct.textContent = `${Math.floor(state.boost)}%`;
    hudBoostFill.style.width = `${state.boost}%`;

    if (currentMode === 'timetrial') {
      hudTimer.textContent = `${state.timeLeft.toFixed(1)}s`;
    }
  }

  // --- 3D PERSPECTIVE PROJECTION HELPER ---
  // Maps highway coordinates (laneX in [-1..1], z in [1..380]) to screen (sx, sy, scale)
  function projectRoadPoint(laneX, z) {
    const safeZ = Math.max(1, z);
    const depth = 24 / safeZ; // Perspective factor
    const sy = HORIZON_Y + (H - HORIZON_Y) * Math.min(1.25, depth);
    const roadHalfWidth = W * 0.44 * depth;
    const curveOffset = state.roadCurve * Math.pow(1 - Math.min(1, depth), 2) * 260;
    const cameraShift = -state.playerX * roadHalfWidth * 0.62;
    const sx = W * 0.5 + curveOffset + cameraShift + laneX * roadHalfWidth;
    return { sx, sy, roadHalfWidth, scale: depth };
  }

  // --- RENDERING ENGINE (CLEAN REALISTIC MOTORSPORT GRAPHICS) ---
  function renderScene(dt) {
    const w = WEATHERS[save.weather] || WEATHERS.day;

    ctx.save();
    if (state.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    }

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    skyGrad.addColorStop(0, w.skyTop);
    skyGrad.addColorStop(0.58, w.skyMid);
    skyGrad.addColorStop(1, w.skyHorizon);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, HORIZON_Y + 2);

    // 2. Sun / Atmospheric Disc
    const sunX = W * 0.72 - state.roadCurve * 35;
    const sunY = save.weather === 'sunset' ? HORIZON_Y - 28 : HORIZON_Y - 115;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 95);
    sunGrad.addColorStop(0, w.sunColor);
    sunGrad.addColorStop(0.35, w.sunColor + '66');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
    ctx.fill();

    // 3. Distant Alpine / Canyon Mountain Silhouettes
    drawMountainRange(w.mountainFar, HORIZON_Y, 68, 0.18);
    drawMountainRange(w.mountainNear, HORIZON_Y, 38, 0.35);

    // 4. Ground & 3D Highway Strips (Painter's Algorithm Back-to-Front)
    const numSlices = 95;
    const maxZ = 340;

    for (let i = numSlices; i >= 1; i--) {
      const zFar = (i / numSlices) * maxZ;
      const zNear = ((i - 0.98) / numSlices) * maxZ;
      const pFar = projectRoadPoint(0, zFar);
      const pNear = projectRoadPoint(0, zNear);

      const bandIndex = Math.floor((zFar + state.roadZ) / 14);
      const isAlt = bandIndex % 2 === 0;

      // Roadside Verge (Grass / Sandstone / Moss)
      ctx.fillStyle = isAlt ? w.grassA : w.grassB;
      ctx.fillRect(0, pFar.sy, W, pNear.sy - pFar.sy + 1.5);

      // FIA Rumble Kerbs (Red & Warm Paper White)
      ctx.fillStyle = isAlt ? w.kerbA : w.kerbB;
      drawTrapezoid(
        pFar.sx,
        pFar.sy,
        pFar.roadHalfWidth * 1.07,
        pNear.sx,
        pNear.sy,
        pNear.roadHalfWidth * 1.07
      );

      // Asphalt Tarmac Surface
      ctx.fillStyle = isAlt ? w.asphaltA : w.asphaltB;
      drawTrapezoid(
        pFar.sx,
        pFar.sy,
        pFar.roadHalfWidth,
        pNear.sx,
        pNear.sy,
        pNear.roadHalfWidth
      );

      // Double Yellow Center Divider (separating Oncoming vs Same-Direction)
      ctx.fillStyle = w.centerLine;
      drawTrapezoid(
        pFar.sx - pFar.roadHalfWidth * 0.018,
        pFar.sy,
        pFar.roadHalfWidth * 0.008,
        pNear.sx - pNear.roadHalfWidth * 0.018,
        pNear.sy,
        pNear.roadHalfWidth * 0.008
      );
      drawTrapezoid(
        pFar.sx + pFar.roadHalfWidth * 0.018,
        pFar.sy,
        pFar.roadHalfWidth * 0.008,
        pNear.sx + pNear.roadHalfWidth * 0.018,
        pNear.sy,
        pNear.roadHalfWidth * 0.008
      );

      // Dashed White Lane Dividers (at laneX = -0.48 and +0.48)
      if (isAlt) {
        ctx.fillStyle = w.laneDash;
        [-0.48, 0.48].forEach((lx) => {
          const lf = projectRoadPoint(lx, zFar);
          const ln = projectRoadPoint(lx, zNear);
          drawTrapezoid(
            lf.sx,
            lf.sy,
            pFar.roadHalfWidth * 0.012,
            ln.sx,
            ln.sy,
            pNear.roadHalfWidth * 0.012
          );
        });
      }

      // Roadside Mile Marker Posts every 6 bands
      if (bandIndex % 6 === 0 && i % 3 === 0) {
        const postScale = pNear.scale;
        const postH = 26 * postScale;
        const postW = Math.max(2, 5 * postScale);
        ctx.fillStyle = '#d8d5cc';
        ctx.fillRect(pNear.sx - pNear.roadHalfWidth * 1.16, pNear.sy - postH, postW, postH);
        ctx.fillRect(pNear.sx + pNear.roadHalfWidth * 1.16, pNear.sy - postH, postW, postH);
      }
    }

    // 5. Horizon Atmospheric Haze
    ctx.fillStyle = w.fogColor;
    ctx.fillRect(0, HORIZON_Y - 12, W, 28);

    // 6. Sort & Render Traffic Vehicles (Back to Front)
    const sortedTraffic = [...state.traffic].sort((a, b) => b.z - a.z);
    for (const v of sortedTraffic) {
      if (v.z > 8 && v.z < 340) {
        drawTrafficCar(v);
      }
    }

    // 7. Render Player Grand Tourer (at Z = 22)
    drawPlayerCar();

    // 8. Rain Overlay (if Monsoon Weather is selected)
    if (save.weather === 'rain') {
      ctx.strokeStyle = 'rgba(215, 228, 242, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const r of state.rainDrops) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 9, r.y + r.len);
        r.y += r.speed * dt;
        r.x -= 180 * dt;
        if (r.y > H) {
          r.y = -20;
          r.x = Math.random() * W;
        }
        if (r.x < 0) r.x = W;
      }
      ctx.stroke();
    }

    // 9. Floating Score / Near-Miss Popups
    for (const p of state.popups) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.4);
      ctx.textAlign = 'center';
      ctx.font = '900 20px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      if (p.sub) {
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f4f2ec';
        ctx.fillText(p.sub, p.x, p.y + 16);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function drawMountainRange(color, baseY, maxHeight, parallax) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const shift = state.roadCurve * 120 * parallax;
    const peaks = [
      [0, 0.45],
      [0.14, 0.85],
      [0.28, 0.35],
      [0.44, 0.95],
      [0.6, 0.5],
      [0.76, 0.9],
      [0.9, 0.4],
      [1.0, 0.65]
    ];
    for (const [px, py] of peaks) {
      ctx.lineTo(px * W - shift, baseY - py * maxHeight);
    }
    ctx.lineTo(W, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function drawTrapezoid(x1, y1, w1, x2, y2, w2) {
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x2 - w2, y2);
    ctx.closePath();
    ctx.fill();
  }

  function drawTrafficCar(v) {
    const p = projectRoadPoint(v.x, v.z);
    const cw = Math.max(14, p.roadHalfWidth * v.spec.w * 2);
    const ch = cw * 0.64 * v.spec.h;
    const cx = p.sx;
    const cy = p.sy;

    ctx.save();

    // Ground Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, cw * 0.56, Math.max(3, ch * 0.16), 0, 0, Math.PI * 2);
    ctx.fill();

    // Tires
    const tireW = Math.max(3, cw * 0.16);
    const tireH = Math.max(4, ch * 0.28);
    ctx.fillStyle = '#111215';
    ctx.fillRect(cx - cw * 0.46, cy - tireH, tireW, tireH);
    ctx.fillRect(cx + cw * 0.46 - tireW, cy - tireH, tireW, tireH);

    // Lower Chassis Body
    ctx.fillStyle = v.spec.body;
    roundRect(ctx, cx - cw * 0.48, cy - ch * 0.62, cw * 0.96, ch * 0.48, Math.max(2, cw * 0.06));
    ctx.fill();

    // Upper Cabin Greenhouse
    ctx.fillStyle = v.spec.roof;
    roundRect(ctx, cx - cw * 0.37, cy - ch * 0.96, cw * 0.74, ch * 0.38, Math.max(2, cw * 0.05));
    ctx.fill();

    // Windshield / Rear Glass
    ctx.fillStyle = '#1b222c';
    roundRect(ctx, cx - cw * 0.32, cy - ch * 0.91, cw * 0.64, ch * 0.26, 2);
    ctx.fill();

    // Lights (Headlights if Oncoming, Brake Tail-Lights if Same-Direction)
    const lightW = Math.max(3, cw * 0.16);
    const lightH = Math.max(2, ch * 0.11);
    const lightY = cy - ch * 0.46;

    if (v.isOncoming) {
      // Warm White Halogen / Xenon Headlights
      ctx.fillStyle = '#fff6d6';
      ctx.fillRect(cx - cw * 0.42, lightY, lightW, lightH);
      ctx.fillRect(cx + cw * 0.42 - lightW, lightY, lightW, lightH);
    } else {
      // Crisp Crimson Tail Lights
      ctx.fillStyle = '#e12d39';
      ctx.fillRect(cx - cw * 0.42, lightY, lightW, lightH);
      ctx.fillRect(cx + cw * 0.42 - lightW, lightY, lightW, lightH);

      // Turn Signal Blinker (Amber)
      if (v.blinkerDir !== 0 && Math.floor(performance.now() / 160) % 2 === 0) {
        ctx.fillStyle = '#f5a623';
        const bx = v.blinkerDir < 0 ? cx - cw * 0.44 : cx + cw * 0.44 - lightW * 0.6;
        ctx.fillRect(bx, lightY, lightW * 0.6, lightH);
      }
    }

    // Highway Patrol Interceptor Lightbar
    if (v.isInterceptor) {
      const barW = cw * 0.44;
      const barH = Math.max(3, ch * 0.1);
      const flash = Math.floor(performance.now() / 110) % 2 === 0;
      ctx.fillStyle = flash ? '#e12d39' : '#2962ff';
      ctx.fillRect(cx - barW * 0.5, cy - ch * 1.04, barW * 0.5, barH);
      ctx.fillStyle = flash ? '#2962ff' : '#e12d39';
      ctx.fillRect(cx, cy - ch * 1.04, barW * 0.5, barH);
    }

    ctx.restore();
  }

  function drawPlayerCar() {
    const car = getActiveCar();
    const cx = W * 0.5;
    const cy = H - 62;
    const cw = 152;
    const ch = 84;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.steerAngle * 0.055);

    // Invulnerability Flash after bump
    if (state.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Realistic Soft Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.beginPath();
    ctx.ellipse(0, 6, cw * 0.56, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wide Rear Michelin Pilot Sport Tires
    ctx.fillStyle = '#101114';
    roundRect(ctx, -cw * 0.48, -24, 26, 26, 5);
    ctx.fill();
    roundRect(ctx, cw * 0.48 - 26, -24, 26, 26, 5);
    ctx.fill();

    // Lower Carbon Rear Diffuser
    ctx.fillStyle = '#15171c';
    roundRect(ctx, -cw * 0.42, -18, cw * 0.84, 14, 4);
    ctx.fill();

    // Dual Exhaust Tips + Overdrive Afterburner Flame
    ctx.fillStyle = '#8c9099';
    ctx.fillRect(-26, -11, 10, 6);
    ctx.fillRect(16, -11, 10, 6);

    if (state.boosting) {
      ctx.fillStyle = '#ff6b2b';
      ctx.beginPath();
      ctx.arc(-21, -6, 6 + Math.random() * 4, 0, Math.PI * 2);
      ctx.arc(21, -6, 6 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sculpted GT3 Rear Body
    ctx.fillStyle = car.bodyColor;
    roundRect(ctx, -cw * 0.48, -50, cw * 0.96, 36, 9);
    ctx.fill();

    // Lower Shaded Fascia
    ctx.fillStyle = car.darkColor;
    ctx.fillRect(-cw * 0.46, -26, cw * 0.92, 10);

    // Center Motorsport Stripe
    ctx.fillStyle = car.stripeColor;
    ctx.fillRect(-6, -76, 12, 60);

    // Cabin Greenhouse & Tinted Rear Louvered Glass
    ctx.fillStyle = car.trimColor;
    roundRect(ctx, -cw * 0.35, -78, cw * 0.7, 32, 8);
    ctx.fill();

    ctx.fillStyle = '#1e2530';
    roundRect(ctx, -cw * 0.28, -73, cw * 0.56, 21, 5);
    ctx.fill();

    // GT3 Swan-Neck Rear Wing Spoiler
    ctx.fillStyle = '#14161b';
    ctx.fillRect(-cw * 0.46, -60, cw * 0.92, 6);
    ctx.fillRect(-28, -56, 5, 10);
    ctx.fillRect(23, -56, 5, 10);

    // LED Brake Light Strip & Tail Lamps
    const braking = keys.down;
    ctx.fillStyle = braking ? '#ff2a38' : '#c9202b';
    roundRect(ctx, -cw * 0.44, -42, 30, 9, 3);
    ctx.fill();
    roundRect(ctx, cw * 0.44 - 30, -42, 30, 9, 3);
    ctx.fill();
    // Center Light Bar
    ctx.fillRect(-cw * 0.2, -39, cw * 0.4, 3);

    // Rear License Plate ("GT3-099")
    ctx.fillStyle = '#f4f2ec';
    roundRect(ctx, -20, -32, 40, 12, 2);
    ctx.fill();
    ctx.fillStyle = '#101014';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KBR 099', 0, -23);

    ctx.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  // --- MAIN 60FPS ANIMATION LOOP ---
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (state.running && !state.paused) {
      updateRace(dt);
    } else {
      // Idle showroom background highway cruise while menu is open
      state.roadZ += 95 * dt;
    }

    renderScene(dt);
    requestAnimationFrame(frame);
  }

  resetRaceState();
  updateTopBarUI();
  requestAnimationFrame(frame);
})();
