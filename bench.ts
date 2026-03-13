import { performance } from "perf_hooks";

class MockAudioContext {
  sampleRate = 44100;
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: (channel: number) => new Float32Array(length)
    };
  }
}

const c = new MockAudioContext() as any;

const noiseBufferCache = new Map<number, any>();

function createNoiseBufferOriginal(duration: number) {
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createNoiseBufferOptimized(duration: number) {
  const bufferSize = c.sampleRate * duration;
  if (noiseBufferCache.has(bufferSize)) {
    return noiseBufferCache.get(bufferSize)!;
  }
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBufferCache.set(bufferSize, buffer);
  return buffer;
}

const N = 1000;
const duration = 0.3;

const startOrg = performance.now();
for (let i = 0; i < N; i++) {
  createNoiseBufferOriginal(duration);
}
const endOrg = performance.now();

const startOpt = performance.now();
for (let i = 0; i < N; i++) {
  createNoiseBufferOptimized(duration);
}
const endOpt = performance.now();

console.log(`Original: ${endOrg - startOrg} ms`);
console.log(`Optimized: ${endOpt - startOpt} ms`);
