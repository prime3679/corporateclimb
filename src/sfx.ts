// ─── RETRO SOUND EFFECTS via Web Audio API ──────────────────
// All sounds are generated programmatically — no audio files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.15, ramp = true) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

const noiseBuffers = new Map<number, AudioBuffer>();

function playNoise(duration: number, volume = 0.08) {
  const c = getCtx();
  let buffer = noiseBuffers.get(duration);
  if (!buffer) {
    const bufferSize = c.sampleRate * duration;
    buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(duration, buffer);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, c.currentTime);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
}

export const SFX = {
  // Menu / UI
  menuSelect() {
    playTone(880, 0.08, "square", 0.1);
    setTimeout(() => playTone(1320, 0.1, "square", 0.1), 60);
  },

  menuConfirm() {
    playTone(660, 0.06, "square", 0.12);
    setTimeout(() => playTone(880, 0.06, "square", 0.12), 50);
    setTimeout(() => playTone(1320, 0.12, "square", 0.12), 100);
  },

  menuBack() {
    playTone(440, 0.08, "square", 0.08);
    setTimeout(() => playTone(330, 0.12, "square", 0.08), 60);
  },

  textTick() {
    playTone(800 + Math.random() * 200, 0.03, "square", 0.04, false);
  },

  // Battle
  attackSwing() {
    playNoise(0.12, 0.12);
    playTone(200, 0.15, "sawtooth", 0.08);
    setTimeout(() => playTone(400, 0.08, "sawtooth", 0.06), 80);
  },

  hit() {
    playNoise(0.08, 0.15);
    playTone(150, 0.15, "square", 0.12);
    setTimeout(() => playTone(100, 0.2, "square", 0.08), 50);
  },

  critHit() {
    playNoise(0.1, 0.2);
    playTone(200, 0.1, "square", 0.15);
    setTimeout(() => playTone(400, 0.1, "square", 0.12), 40);
    setTimeout(() => playTone(600, 0.15, "square", 0.1), 80);
  },

  heal() {
    playTone(523, 0.12, "sine", 0.1);
    setTimeout(() => playTone(659, 0.12, "sine", 0.1), 100);
    setTimeout(() => playTone(784, 0.15, "sine", 0.1), 200);
  },

  enemyAppear() {
    playTone(180, 0.3, "square", 0.08);
    setTimeout(() => playTone(220, 0.3, "square", 0.08), 200);
    setTimeout(() => playTone(260, 0.4, "square", 0.1), 400);
  },

  faint() {
    playTone(400, 0.15, "square", 0.1);
    setTimeout(() => playTone(300, 0.15, "square", 0.1), 120);
    setTimeout(() => playTone(200, 0.2, "square", 0.1), 240);
    setTimeout(() => playTone(100, 0.4, "square", 0.08), 360);
  },

  // Progression
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.18, "square", 0.12), i * 120);
    });
    setTimeout(() => {
      playTone(1047, 0.4, "square", 0.1);
      playTone(784, 0.4, "square", 0.07);
    }, 500);
  },

  levelUp() {
    const notes = [440, 554, 659, 880, 1109, 1319];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.12, "square", 0.1), i * 70);
    });
  },

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.3, "square", 0.1), i * 250);
    });
  },

  bossIntro() {
    playTone(100, 0.5, "sawtooth", 0.08);
    setTimeout(() => playTone(80, 0.5, "sawtooth", 0.08), 300);
    setTimeout(() => playTone(60, 0.8, "sawtooth", 0.1), 600);
    setTimeout(() => playNoise(0.3, 0.06), 900);
  },

  // Events
  eventGood() {
    playTone(523, 0.1, "sine", 0.1);
    setTimeout(() => playTone(659, 0.1, "sine", 0.1), 80);
    setTimeout(() => playTone(784, 0.2, "sine", 0.12), 160);
  },

  eventBad() {
    playTone(330, 0.15, "square", 0.08);
    setTimeout(() => playTone(262, 0.25, "square", 0.08), 150);
  },

  eventNeutral() {
    playTone(440, 0.12, "triangle", 0.08);
    setTimeout(() => playTone(523, 0.15, "triangle", 0.08), 100);
  },

  coin() {
    playTone(988, 0.06, "square", 0.1);
    setTimeout(() => playTone(1319, 0.15, "square", 0.1), 60);
  },

  miss() {
    playTone(300, 0.08, "triangle", 0.06);
    setTimeout(() => playTone(200, 0.15, "triangle", 0.04), 80);
  },

  // Type effectiveness
  superEffective() {
    playTone(600, 0.08, "square", 0.12);
    setTimeout(() => playTone(800, 0.08, "square", 0.12), 60);
    setTimeout(() => playTone(1100, 0.12, "square", 0.14), 120);
    setTimeout(() => playTone(1400, 0.18, "square", 0.1), 200);
  },

  notEffective() {
    playTone(400, 0.15, "square", 0.08);
    setTimeout(() => playTone(300, 0.2, "square", 0.06), 100);
  },

  achievementUnlock() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.15, "sine", 0.1), i * 80);
    });
    setTimeout(() => {
      playTone(1319, 0.4, "sine", 0.08);
      playTone(1047, 0.4, "sine", 0.05);
    }, 450);
  },

  // Win fanfare
  fanfare() {
    const melody = [523, 523, 523, 698, 880, 784, 698, 880, 1047];
    melody.forEach((n, i) => {
      const dur = i === melody.length - 1 ? 0.5 : 0.12;
      setTimeout(() => playTone(n, dur, "square", 0.1), i * 130);
    });
  },
};
