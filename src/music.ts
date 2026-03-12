// ─── BACKGROUND MUSIC via Web Audio API ─────────────────────
// Looping chiptune melodies generated programmatically.
// Each track is a short pattern that loops indefinitely.

let ctx: AudioContext | null = null;
let currentTrack: string | null = null;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;
let activeOscs: OscillatorNode[] = [];
let masterGain: GainNode | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getMasterGain(): GainNode {
  if (!masterGain) {
    const c = getCtx();
    masterGain = c.createGain();
    masterGain.gain.setValueAtTime(_muted ? 0 : 1, c.currentTime);
    masterGain.connect(c.destination);
  }
  return masterGain;
}

function scheduleNote(
  freq: number, startTime: number, duration: number,
  type: OscillatorType = "square", volume = 0.06,
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.setValueAtTime(volume, startTime + duration * 0.8);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(getMasterGain());
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  activeOscs.push(osc);
  osc.onended = () => {
    activeOscs = activeOscs.filter(o => o !== osc);
  };
}

// Note frequencies (octave 4-5)
const N: Record<string, number> = {
  C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
  C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988,
  C3: 131, D3: 147, E3: 165, F3: 175, G3: 196, A3: 220, B3: 247,
  R: 0, // rest
};

interface Track {
  melody: [string, number][]; // [note name, beats]
  bass?: [string, number][];
  bpm: number;
  melodyType?: OscillatorType;
  bassType?: OscillatorType;
  melodyVol?: number;
  bassVol?: number;
}

const TRACKS: Record<string, Track> = {
  title: {
    bpm: 120,
    melodyType: "square",
    melodyVol: 0.045,
    bassVol: 0.03,
    melody: [
      ["E4", 1], ["G4", 1], ["A4", 1], ["B4", 1],
      ["A4", 1], ["G4", 1], ["E4", 2],
      ["D4", 1], ["E4", 1], ["G4", 1], ["A4", 1],
      ["G4", 2], ["E4", 1], ["D4", 1],
    ],
    bass: [
      ["C3", 2], ["C3", 2], ["G3", 2], ["G3", 2],
      ["A3", 2], ["A3", 2], ["E3", 2], ["E3", 2],
    ],
  },
  battle: {
    bpm: 150,
    melodyType: "square",
    melodyVol: 0.04,
    bassType: "sawtooth",
    bassVol: 0.025,
    melody: [
      ["E4", 0.5], ["E4", 0.5], ["R", 0.5], ["E4", 0.5],
      ["R", 0.5], ["C4", 0.5], ["E4", 1],
      ["G4", 1], ["R", 1], ["G3", 1], ["R", 1],
      ["C4", 1], ["R", 0.5], ["G3", 0.5], ["R", 1],
      ["E3", 1], ["R", 0.5], ["A3", 0.5], ["B3", 1],
      ["A3", 0.5], ["R", 0.5], ["G3", 0.75], ["E4", 0.75], ["G4", 0.5],
      ["A4", 1], ["F4", 0.5], ["G4", 0.5],
      ["R", 0.5], ["E4", 1], ["C4", 0.5], ["D4", 0.5], ["B3", 0.5],
    ],
    bass: [
      ["C3", 1], ["C3", 1], ["G3", 1], ["G3", 1],
      ["E3", 1], ["E3", 1], ["C3", 1], ["C3", 1],
      ["A3", 1], ["A3", 1], ["F3", 1], ["F3", 1],
      ["G3", 1], ["G3", 1], ["G3", 1], ["G3", 1],
    ],
  },
  boss: {
    bpm: 140,
    melodyType: "sawtooth",
    melodyVol: 0.035,
    bassType: "sawtooth",
    bassVol: 0.03,
    melody: [
      ["E3", 0.5], ["E3", 0.5], ["E4", 0.5], ["E3", 0.5],
      ["E3", 0.5], ["D4", 0.5], ["E3", 0.5], ["E3", 0.5],
      ["C4", 1], ["B3", 1], ["A3", 1], ["R", 1],
      ["A3", 0.5], ["B3", 0.5], ["C4", 0.5], ["D4", 0.5],
      ["E4", 1], ["D4", 0.5], ["C4", 0.5],
      ["B3", 1], ["A3", 1], ["G3", 2],
    ],
    bass: [
      ["A3", 2], ["A3", 2], ["E3", 2], ["E3", 2],
      ["F3", 2], ["F3", 2], ["E3", 2], ["E3", 2],
    ],
  },
  event: {
    bpm: 90,
    melodyType: "triangle",
    melodyVol: 0.05,
    bassVol: 0.025,
    melody: [
      ["C4", 1.5], ["E4", 1.5], ["G4", 1],
      ["A4", 1], ["G4", 1], ["E4", 1], ["D4", 1],
      ["C4", 1.5], ["D4", 1.5], ["E4", 1],
      ["D4", 2], ["R", 2],
    ],
    bass: [
      ["C3", 2], ["E3", 2], ["F3", 2], ["G3", 2],
      ["A3", 2], ["F3", 2], ["G3", 2], ["C3", 2],
    ],
  },
};

function playTrack(name: string) {
  if (currentTrack === name) return; // already playing
  stopMusic();
  currentTrack = name;
  const track = TRACKS[name];
  if (!track) return;

  const c = getCtx();
  const beatDur = 60 / track.bpm;

  function scheduleLoop() {
    if (currentTrack !== name) return;

    const now = c.currentTime + 0.05; // small buffer

    // Schedule melody
    let t = now;
    for (const [note, beats] of track.melody) {
      const dur = beats * beatDur;
      if (note !== "R" && N[note]) {
        scheduleNote(N[note], t, dur * 0.9, track.melodyType || "square", track.melodyVol ?? 0.05);
      }
      t += dur;
    }
    const melodyLen = t - now;

    // Schedule bass (loops to fill melody length)
    if (track.bass) {
      let bt = now;
      while (bt < now + melodyLen) {
        for (const [note, beats] of track.bass!) {
          if (bt >= now + melodyLen) break;
          const dur = beats * beatDur;
          if (note !== "R" && N[note]) {
            scheduleNote(N[note], bt, dur * 0.85, track.bassType || "square", track.bassVol ?? 0.03);
          }
          bt += dur;
        }
      }
    }

    // Schedule next loop
    loopTimeout = setTimeout(scheduleLoop, (melodyLen - 0.1) * 1000);
  }

  scheduleLoop();
}

function stopMusic() {
  currentTrack = null;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  // Stop all active oscillators
  const now = getCtx().currentTime;
  for (const osc of activeOscs) {
    try {
      osc.stop(now + 0.05);
    } catch { /* already stopped */ }
  }
  activeOscs = [];
}

export const Music = {
  playTitle() { playTrack("title"); },
  playBattle() { playTrack("battle"); },
  playBoss() { playTrack("boss"); },
  playEvent() { playTrack("event"); },
  stop() { stopMusic(); },

  get muted() { return _muted; },

  setMuted(muted: boolean) {
    _muted = muted;
    if (masterGain) {
      const c = getCtx();
      masterGain.gain.setValueAtTime(muted ? 0 : 1, c.currentTime);
    }
  },

  toggleMute(): boolean {
    Music.setMuted(!_muted);
    return _muted;
  },

  get currentTrack() { return currentTrack; },
};
