class MockAudioContext {
  constructor() {
    this.state = "running";
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
  createBufferSource() {
    return { connect: () => {}, start: () => {}, stop: () => {} };
  }
  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {}
    };
  }
  createBiquadFilter() {
    return {
      frequency: { setValueAtTime: () => {} },
      connect: () => {}
    };
  }
  resume() {}
}

global.AudioContext = MockAudioContext;

// Mock playNoise directly as in sfx.ts
let ctx = null;
function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playNoiseOriginal(duration, volume = 0.08) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
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

const noiseBuffers = new Map();
function playNoiseOptimized(duration, volume = 0.08) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  let buffer = noiseBuffers.get(duration);
  if (!buffer) {
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

const iterations = 10000;
const durations = [0.12, 0.08, 0.1, 0.3];

console.log("Benchmarking playNoise Original...");
const startOrig = performance.now();
for (let i = 0; i < iterations; i++) {
  playNoiseOriginal(durations[i % durations.length], 0.1);
}
const endOrig = performance.now();
console.log(`Original: ${(endOrig - startOrig).toFixed(2)} ms`);

console.log("Benchmarking playNoise Optimized...");
const startOpt = performance.now();
for (let i = 0; i < iterations; i++) {
  playNoiseOptimized(durations[i % durations.length], 0.1);
}
const endOpt = performance.now();
console.log(`Optimized: ${(endOpt - startOpt).toFixed(2)} ms`);
console.log(`Improvement: ${(((endOrig - startOrig) - (endOpt - startOpt)) / (endOrig - startOrig) * 100).toFixed(2)}% faster`);
