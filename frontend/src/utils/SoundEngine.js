/**
 * Procedural Sound Engine using Web Audio API
 * No external audio files needed — all sounds generated mathematically
 */

let ctx = null;
let muted = false;
let volume = 0.3;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function gain(v = volume) {
  const c = getCtx();
  const g = c.createGain();
  g.gain.value = muted ? 0 : v;
  g.connect(c.destination);
  return g;
}

// === SOUND EFFECTS ===

export function playShoot() {
  const c = getCtx(), g = gain(0.15);
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.1);
}

export function playHit() {
  const c = getCtx(), g = gain(0.12);
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.08);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.08);
}

export function playExplosion() {
  const c = getCtx();
  const bufferSize = c.sampleRate * 0.3;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const g = gain(0.2);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
  noise.connect(filter);
  filter.connect(g);
  noise.start(c.currentTime);
  noise.stop(c.currentTime + 0.3);
}

export function playBossExplosion() {
  const c = getCtx();
  // Deep boom
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.5);
  const g1 = gain(0.25);
  osc.connect(g1);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.5);
  // Noise layer
  setTimeout(() => playExplosion(), 50);
}

export function playCrystal() {
  const c = getCtx(), g = gain(0.15);
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.06);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.15, c.currentTime + i * 0.06 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.2);
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.06);
    osc.stop(c.currentTime + i * 0.06 + 0.2);
  });
}

export function playFuel() {
  const c = getCtx(), g = gain(0.12);
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.linearRampToValueAtTime(600, c.currentTime + 0.15);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}

export function playPortal() {
  const c = getCtx();
  [400, 500, 600, 800, 1000].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.05);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.1, c.currentTime + i * 0.05 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.05 + 0.15);
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.05);
    osc.stop(c.currentTime + i * 0.05 + 0.15);
  });
}

export function playLevelUp() {
  const c = getCtx();
  const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
  melody.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.12);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.12, c.currentTime + i * 0.12 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.25);
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.12);
    osc.stop(c.currentTime + i * 0.12 + 0.25);
  });
}

export function playDamage() {
  const c = getCtx(), g = gain(0.18);
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.linearRampToValueAtTime(80, c.currentTime + 0.15);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}

export function playMine() {
  const c = getCtx(), g = gain(0.1);
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(100 + Math.random() * 50, c.currentTime);
  osc.frequency.linearRampToValueAtTime(200 + Math.random() * 100, c.currentTime + 0.06);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.06);
}

export function playMineSuccess() {
  const c = getCtx();
  [300, 450, 600].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.08);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.15, c.currentTime + i * 0.08 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.15);
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.08);
    osc.stop(c.currentTime + i * 0.08 + 0.15);
  });
}

export function playPowerup() {
  const c = getCtx();
  [600, 800, 1000, 1200].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.04);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.1, c.currentTime + i * 0.04 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.04 + 0.12);
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.04);
    osc.stop(c.currentTime + i * 0.04 + 0.12);
  });
}

export function playNuke() {
  const c = getCtx();
  // Rising tone
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.3);
  const g1 = gain(0.2);
  osc.connect(g1);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.3);
  // Then boom
  setTimeout(() => playBossExplosion(), 300);
}

export function playBuild() {
  const c = getCtx();
  [200, 300, 400].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'square';
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime + i * 0.1);
    env.gain.linearRampToValueAtTime(muted ? 0 : 0.08, c.currentTime + i * 0.1 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.12);
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(c.destination);
    osc.start(c.currentTime + i * 0.1);
    osc.stop(c.currentTime + i * 0.1 + 0.12);
  });
}

export function playDeath() {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.8);
  const g1 = gain(0.2);
  g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
  osc.connect(g1);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.8);
}

export function playClick() {
  const c = getCtx(), g = gain(0.08);
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 600;
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.03);
}

// === CONTROLS ===
export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }
export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
export function getVolume() { return volume; }
export function initAudio() { getCtx(); }
