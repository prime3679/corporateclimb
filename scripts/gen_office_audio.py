#!/usr/bin/env python3
"""Generate the Office campaign beds and stingers.

Original, deterministic synthesis — no sampled libraries. Re-run:

    python3 scripts/gen_office_audio.py

Writes 44.1 kHz stereo MP3s (160 kb/s, matching Classic) into public/audio/.
Classic files are never overwritten.
"""

from __future__ import annotations

import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"

# Seeded once so a re-run produces bit-identical WAVs (MP3 frames may still
# differ across ffmpeg builds; the musical content does not).
RNG = np.random.default_rng(20260906)


def time_axis(n: int) -> np.ndarray:
    return np.arange(n, dtype=np.float64) / SR


def beats_to_samples(beats: float, bpm: float) -> int:
    return int(round(beats * 60.0 / bpm * SR))


def env_adsr(
    n: int,
    attack: float,
    decay: float,
    sustain: float,
    release: float,
    peak: float = 1.0,
) -> np.ndarray:
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    s = max(0, n - a - d - r)
    parts = [
        np.linspace(0.0, peak, a, endpoint=False),
        np.linspace(peak, peak * sustain, d, endpoint=False),
        np.full(s, peak * sustain),
        np.linspace(peak * sustain, 0.0, r),
    ]
    e = np.concatenate(parts)
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def one_pole_low(x: np.ndarray, cutoff: float) -> np.ndarray:
    """Exponential moving average via a short FIR of the IIR impulse."""
    rc = 1.0 / (2.0 * math.pi * cutoff)
    alpha = 1.0 / (1.0 + rc * SR)
    decay = 1.0 - alpha
    if decay <= 0:
        return x.copy()
    ir_len = min(len(x), int(math.ceil(math.log(1e-5) / math.log(decay))) + 1)
    ir = alpha * decay ** np.arange(ir_len, dtype=np.float64)
    return np.convolve(x, ir, mode="full")[: len(x)]


def one_pole_high(x: np.ndarray, cutoff: float) -> np.ndarray:
    return x - one_pole_low(x, cutoff)


def saturate(x: np.ndarray, drive: float = 1.15) -> np.ndarray:
    return np.tanh(x * drive)


def sine(t: np.ndarray, freq: float, phase: float = 0.0) -> np.ndarray:
    return np.sin(2.0 * math.pi * freq * t + phase)


def triangle(t: np.ndarray, freq: float) -> np.ndarray:
    return 2.0 * np.abs(2.0 * np.mod(freq * t, 1.0) - 1.0) - 1.0


def soft_square(t: np.ndarray, freq: float, n_harm: int = 7) -> np.ndarray:
    y = np.zeros_like(t)
    for k in range(1, n_harm + 1, 2):
        y += sine(t, freq * k) / k
    return y * (4.0 / math.pi)


def noise(n: int) -> np.ndarray:
    return RNG.uniform(-1.0, 1.0, n)


def brown(n: int) -> np.ndarray:
    x = np.cumsum(RNG.normal(0.0, 1.0, n))
    x -= x.mean()
    peak = np.max(np.abs(x)) or 1.0
    return x / peak


def fm_rhodes(t: np.ndarray, freq: float, vel: float = 1.0) -> np.ndarray:
    """Bright attack, wooden decay — electric-piano-ish FM, not a sample."""
    n = len(t)
    index = 3.4 * vel * np.exp(-t * 9.0)
    mod = np.sin(2.0 * math.pi * freq * t) * index
    car = np.sin(2.0 * math.pi * freq * t + mod)
    tone = 0.72 * car + 0.18 * sine(t, freq * 2) + 0.10 * sine(t, freq * 3)
    return tone * env_adsr(n, 0.004, 0.18, 0.22, max(0.12, n / SR - 0.32), peak=vel)


def piano_low(t: np.ndarray, freq: float, vel: float = 1.0) -> np.ndarray:
    n = len(t)
    body = (
        0.62 * sine(t, freq)
        + 0.22 * sine(t, freq * 2)
        + 0.10 * sine(t, freq * 3)
        + 0.06 * sine(t, freq * 4.01)
    )
    hammer = one_pole_high(noise(n), 1200.0) * np.exp(-t * 55.0) * 0.12
    return (body + hammer) * env_adsr(n, 0.006, 0.35, 0.28, max(0.4, n / SR - 0.8), peak=vel)


def gold_bell(t: np.ndarray, freq: float, vel: float = 1.0) -> np.ndarray:
    n = len(t)
    partials = [1.0, 2.0, 2.76, 4.07, 5.43]
    amps = [1.0, 0.45, 0.28, 0.16, 0.09]
    y = np.zeros_like(t)
    for p, a in zip(partials, amps):
        y += a * sine(t, freq * p) * np.exp(-t * (2.2 + p * 0.55))
    return y * env_adsr(n, 0.002, 0.08, 0.35, max(0.35, n / SR - 0.45), peak=vel) * vel


def kick(n: int, freq: float = 52.0) -> np.ndarray:
    t = time_axis(n)
    sweep = freq * np.exp(-t * 18.0)
    body = np.sin(2.0 * math.pi * np.cumsum(sweep) / SR)
    click = one_pole_high(noise(n), 2000.0) * np.exp(-t * 80.0) * 0.18
    return saturate((body + click) * env_adsr(n, 0.002, 0.06, 0.12, 0.18, 1.0), 1.4)


def hat(n: int, closed: bool = True) -> np.ndarray:
    t = time_axis(n)
    x = one_pole_high(noise(n), 6000.0)
    decay = 38.0 if closed else 12.0
    return x * np.exp(-t * decay) * env_adsr(n, 0.001, 0.02, 0.08, 0.06, 0.7)


def tick(n: int) -> np.ndarray:
    t = time_axis(n)
    return one_pole_high(noise(n), 2800.0) * np.exp(-t * 70.0) * 0.55


def stereo(mono: np.ndarray, width: float = 0.18) -> np.ndarray:
    delay = int(0.012 * SR)
    right = np.pad(mono, (delay, 0))[: len(mono)]
    left = mono
    mid = (left + right) * 0.5
    side = (left - right) * width
    return np.stack([mid + side, mid - side], axis=1)


def mix_to(buf: np.ndarray, src: np.ndarray, at: int, gain: float = 1.0) -> None:
    if src.ndim == 1:
        src = stereo(src)
    end = min(len(buf), at + len(src))
    take = end - at
    if take <= 0:
        return
    buf[at:end] += src[:take] * gain


def pad_chord(n: int, freqs: list[float], brightness: float = 0.22) -> np.ndarray:
    t = time_axis(n)
    y = np.zeros(n)
    for i, f in enumerate(freqs):
        det = 1.0 + (0.003 if i % 2 == 0 else -0.0025)
        y += sine(t, f * det) * (0.55 if i == 0 else 0.32)
        y += triangle(t, f * 0.5) * 0.08
        if brightness:
            y += sine(t, f * 2 * det) * brightness * 0.15
    lfo = 0.5 + 0.5 * sine(t, 0.07 + brightness * 0.04)
    return one_pole_low(y, 1400 + brightness * 1800) * lfo * env_adsr(n, 0.6, 1.2, 0.78, 1.4, 0.9)


def hvac(n: int, colour: float = 90.0) -> np.ndarray:
    t = time_axis(n)
    air = one_pole_low(brown(n), colour)
    buzz = sine(t, 119.4) * 0.04 + sine(t, 60.1) * 0.03
    shimmer = one_pole_high(noise(n), 7000.0) * (0.012 + 0.008 * sine(t, 0.11))
    return (air * 0.22 + buzz + shimmer) * env_adsr(n, 0.8, 0.4, 0.9, 0.8, 1.0)


def schroeder_verb(x: np.ndarray, mix: float = 0.22) -> np.ndarray:
    """Tiny Schroeder-ish tail so beds sit in a room, not in a dry oscillator."""
    if x.ndim == 1:
        x = stereo(x)
    out = x.copy()
    delays = [1553, 1613, 1747, 1867]
    for ch in range(2):
        acc = x[:, ch].copy()
        for d in delays:
            delayed = np.pad(acc, (d, 0))[: len(acc)]
            acc = acc + delayed * 0.28
        out[:, ch] = x[:, ch] * (1.0 - mix) + one_pole_low(acc, 4200.0) * mix
    return out


def normalize(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def loop_crossfade(x: np.ndarray, ms: float = 90.0) -> np.ndarray:
    n = int(ms * SR / 1000.0)
    if n <= 0 or n * 2 >= len(x):
        return x
    fade = np.linspace(0.0, 1.0, n)[:, None] if x.ndim == 2 else np.linspace(0.0, 1.0, n)
    head = x[:n].copy()
    x[-n:] = x[-n:] * (1.0 - fade) + head * fade
    return x


def write_mp3(name: str, stereo_buf: np.ndarray) -> None:
    stereo_buf = normalize(stereo_buf)
    pcm = np.clip(stereo_buf, -1.0, 1.0)
    pcm_i16 = (pcm * 32767.0).astype(np.int16)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / name
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = Path(tmp.name)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm_i16.tobytes())
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "160k",
            "-ar",
            "44100",
            "-ac",
            "2",
            str(dest),
        ],
        check=True,
    )
    wav_path.unlink(missing_ok=True)
    print(f"  wrote {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")


# ─── Beds ──────────────────────────────────────────────────────


def bed_title() -> np.ndarray:
    """After-hours lobby. D dorian, 80 BPM, 4 bars. Waiting, fluorescent, not Classic jingle."""
    bpm = 80.0
    n = beats_to_samples(16, bpm)
    buf = np.zeros((n, 2))
    t = time_axis(n)
    mix_to(buf, hvac(n, 70.0), 0, 0.55)
    mix_to(buf, pad_chord(n, [146.83, 220.00, 293.66, 349.23], 0.18), 0, 0.42)  # D3 A3 D4 F4
    # Rhodes ostinato: D A C F, then A C E G
    pattern = [146.83, 220.00, 261.63, 349.23, 220.00, 261.63, 329.63, 392.00]
    eighth = beats_to_samples(0.5, bpm)
    for i, f in enumerate(pattern * 2):
        note = fm_rhodes(time_axis(int(eighth * 1.8)), f, vel=0.72 if i % 4 else 0.9)
        mix_to(buf, note, i * eighth, 0.38)
    # Bass: D / C / A / D
    bass_notes = [73.42, 65.41, 55.00, 73.42]
    bar = beats_to_samples(4, bpm)
    for i, f in enumerate(bass_notes):
        body = sine(time_axis(bar), f) * env_adsr(bar, 0.02, 0.3, 0.45, 0.5, 0.9)
        mix_to(buf, body, i * bar, 0.34)
    # Soft hats on offbeats
    hat_len = int(0.09 * SR)
    for i in range(16):
        if i % 2:
            mix_to(buf, hat(hat_len), beats_to_samples(i, bpm), 0.07)
    # Distant gold fifth on bar 3
    mix_to(buf, gold_bell(time_axis(int(1.8 * SR)), 587.33, 0.55), beats_to_samples(8, bpm), 0.16)
    mix_to(buf, gold_bell(time_axis(int(1.8 * SR)), 880.00, 0.4), beats_to_samples(10, bpm), 0.1)
    # Air LFO so the loop breathes
    breath = (0.92 + 0.08 * sine(t, 0.083))[:, None]
    return loop_crossfade(schroeder_verb(buf * breath, 0.26))


def bed_floor1() -> np.ndarray:
    """Cubicle hum. F major 7, 72 BPM. Sparse, warm, HVAC in the walls."""
    bpm = 72.0
    n = beats_to_samples(16, bpm)
    buf = np.zeros((n, 2))
    mix_to(buf, hvac(n, 55.0), 0, 0.7)
    mix_to(buf, pad_chord(n, [174.61, 220.00, 261.63, 329.63], 0.10), 0, 0.36)  # F A C E
    # Very sparse Rhodes — two hits per bar, not a wallpaper arpeggio
    hits = [
        (0.0, 174.61, 0.7),
        (3.0, 261.63, 0.45),
        (4.5, 220.00, 0.5),
        (8.0, 174.61, 0.65),
        (11.0, 329.63, 0.4),
        (13.5, 261.63, 0.48),
    ]
    for beat, f, vel in hits:
        mix_to(buf, fm_rhodes(time_axis(int(1.6 * SR)), f, vel), beats_to_samples(beat, bpm), 0.32)
    # Sub F, barely there
    bar = beats_to_samples(4, bpm)
    for i in range(4):
        f = 43.65 if i != 2 else 38.89  # F / Eb
        body = sine(time_axis(bar), f) * env_adsr(bar, 0.08, 0.5, 0.4, 0.6, 0.7)
        mix_to(buf, body, i * bar, 0.22)
    # Occasional keyboard clack (office, not a drum kit)
    mix_to(buf, tick(int(0.06 * SR)), beats_to_samples(6, bpm), 0.09)
    mix_to(buf, tick(int(0.05 * SR)), beats_to_samples(6.12, bpm), 0.06)
    mix_to(buf, tick(int(0.06 * SR)), beats_to_samples(14, bpm), 0.08)
    # Distant phone fifth, almost subliminal
    mix_to(buf, gold_bell(time_axis(int(2.2 * SR)), 349.23, 0.35), beats_to_samples(7, bpm), 0.09)
    return loop_crossfade(schroeder_verb(buf, 0.3))


def bed_floor2() -> np.ndarray:
    """Operations floor. G minor, 100 BPM. Printer-adjacent, fluorescent, still corporate."""
    bpm = 100.0
    n = beats_to_samples(32, bpm)  # 8 bars — the extra length sells the grind
    buf = np.zeros((n, 2))
    mix_to(buf, hvac(n, 110.0), 0, 0.42)
    mix_to(buf, pad_chord(n, [196.00, 233.08, 293.66, 349.23], 0.28), 0, 0.30)  # G Bb D F
    # Bass ostinato G Bb F G
    ost = [98.00, 116.54, 87.31, 98.00]
    step = beats_to_samples(1, bpm)
    for i in range(32):
        f = ost[i % 4]
        body = soft_square(time_axis(step), f, 5) * env_adsr(step, 0.01, 0.12, 0.35, 0.2, 0.8)
        body = one_pole_low(body, 380)
        mix_to(buf, body, i * step, 0.28)
    # Soft kick on 1 and 3
    k = kick(int(0.28 * SR), 48.0)
    for i in range(0, 32, 2):
        mix_to(buf, k, beats_to_samples(i, bpm), 0.16 if i % 4 == 0 else 0.11)
    # Closed hats on the offbeats, a few opens
    for i in range(32):
        if i % 2:
            mix_to(buf, hat(int(0.07 * SR), True), beats_to_samples(i, bpm), 0.055)
        if i % 8 == 6:
            mix_to(buf, hat(int(0.22 * SR), False), beats_to_samples(i, bpm), 0.05)
    # Printer-adjacent ticks
    for beat in (3.0, 7.25, 11.0, 19.0, 27.5):
        mix_to(buf, tick(int(0.05 * SR)), beats_to_samples(beat, bpm), 0.1)
    # Muted plucks (triangle + noise) — terracotta, not a lead melody
    plucks = [(1.5, 233.08), (5.5, 293.66), (9.5, 196.00), (17.5, 349.23), (21.5, 293.66), (25.5, 233.08)]
    for beat, f in plucks:
        t = time_axis(int(0.55 * SR))
        pl = triangle(t, f) * env_adsr(len(t), 0.003, 0.08, 0.12, 0.22, 0.7)
        mix_to(buf, pl + tick(len(t)) * 0.15, beats_to_samples(beat, bpm), 0.18)
    return loop_crossfade(schroeder_verb(buf, 0.2))


def hvac_rng(n: int, colour: float, rng: np.random.Generator) -> np.ndarray:
    """HVAC bed with a private seed so new floors don't steal the shared RNG stream."""
    t = time_axis(n)
    walk = np.cumsum(rng.normal(0.0, 1.0, n))
    walk -= walk.mean()
    peak = np.max(np.abs(walk)) or 1.0
    air = one_pole_low(walk / peak, colour)
    buzz = sine(t, 119.4) * 0.04 + sine(t, 60.1) * 0.03
    shimmer = one_pole_high(rng.uniform(-1.0, 1.0, n), 7000.0) * (0.012 + 0.008 * sine(t, 0.11))
    return (air * 0.22 + buzz + shimmer) * env_adsr(n, 0.8, 0.4, 0.9, 0.8, 1.0)


def tick_rng(n: int, rng: np.random.Generator) -> np.ndarray:
    t = time_axis(n)
    return one_pole_high(rng.uniform(-1.0, 1.0, n), 2800.0) * np.exp(-t * 70.0) * 0.55


def bed_floor3() -> np.ndarray:
    """Floor 3 — Product. A dorian, 86 BPM. Cork, stickies, a cursor in the Now column."""
    rng = np.random.default_rng(202609063)
    bpm = 86.0
    n = beats_to_samples(16, bpm)
    buf = np.zeros((n, 2))
    mix_to(buf, hvac_rng(n, 85.0, rng), 0, 0.48)
    # A3 C4 E4 G4 — cooler than Floor 1's Fmaj7, no G-minor grind
    mix_to(buf, pad_chord(n, [220.00, 261.63, 329.63, 392.00], 0.20), 0, 0.34)
    # Questioning Rhodes: A C G E / F E D C
    hits = [
        (0.0, 220.00, 0.72),
        (2.5, 261.63, 0.48),
        (4.0, 392.00, 0.42),
        (6.0, 329.63, 0.50),
        (8.0, 174.61, 0.62),
        (10.5, 329.63, 0.40),
        (12.0, 293.66, 0.46),
        (14.5, 261.63, 0.44),
    ]
    for beat, f, vel in hits:
        mix_to(buf, fm_rhodes(time_axis(int(1.35 * SR)), f, vel), beats_to_samples(beat, bpm), 0.30)
    # Sub A / G — a held thought, not an ostinato
    bar = beats_to_samples(4, bpm)
    for i, f in enumerate((55.00, 55.00, 49.00, 55.00)):
        body = sine(time_axis(bar), f) * env_adsr(bar, 0.06, 0.4, 0.38, 0.55, 0.68)
        mix_to(buf, body, i * bar, 0.20)
    # Keyboard / sticky-note ticks — Product, not a drum kit
    for beat, gain in ((1.75, 0.08), (3.12, 0.05), (7.0, 0.09), (7.14, 0.06), (11.5, 0.07), (15.25, 0.08)):
        mix_to(buf, tick_rng(int(0.05 * SR), rng), beats_to_samples(beat, bpm), gain)
    # Cork-board plucks (triangle, dry)
    for beat, f in ((5.5, 440.00), (9.5, 392.00), (13.5, 523.25)):
        t = time_axis(int(0.42 * SR))
        pl = triangle(t, f) * env_adsr(len(t), 0.002, 0.06, 0.10, 0.18, 0.55)
        mix_to(buf, pl, beats_to_samples(beat, bpm), 0.14)
    return loop_crossfade(schroeder_verb(buf, 0.24))


def bed_floor4() -> np.ndarray:
    """Floor 4 — Sales. F mixolydian, 108 BPM. Handshake, pipeline, the Close."""
    rng = np.random.default_rng(202609064)
    bpm = 108.0
    n = beats_to_samples(32, bpm)  # 8 bars — the floor that never sits
    buf = np.zeros((n, 2))
    mix_to(buf, hvac_rng(n, 95.0, rng), 0, 0.36)
    # F A C D — warmer than Product, major-side vs Operations' G minor
    mix_to(buf, pad_chord(n, [174.61, 220.00, 261.63, 293.66], 0.26), 0, 0.28)
    # Bass: F C Eb F — a close, not a grind
    ost = [87.31, 65.41, 77.78, 87.31]
    step = beats_to_samples(1, bpm)
    for i in range(32):
        f = ost[i % 4]
        body = soft_square(time_axis(step), f, 5) * env_adsr(step, 0.01, 0.10, 0.32, 0.18, 0.78)
        body = one_pole_low(body, 420)
        mix_to(buf, body, i * step, 0.26)
    # Kick on 1 only — Sales walks, it does not march
    k = kick(int(0.26 * SR), 50.0)
    for i in range(0, 32, 4):
        mix_to(buf, k, beats_to_samples(i, bpm), 0.15)
    # Offbeat hats + a few opens on the "and"
    for i in range(32):
        if i % 2:
            mix_to(buf, hat(int(0.065 * SR), True), beats_to_samples(i, bpm), 0.05)
        if i % 8 == 5:
            mix_to(buf, hat(int(0.20 * SR), False), beats_to_samples(i, bpm), 0.045)
    # Phone-adjacent ticks (not the printer cluster)
    for beat in (2.25, 6.0, 14.5, 22.0, 29.75):
        mix_to(buf, tick_rng(int(0.045 * SR), rng), beats_to_samples(beat, bpm), 0.09)
    # Handshake bells — F5 / A5, twice a loop
    mix_to(buf, gold_bell(time_axis(int(1.6 * SR)), 698.46, 0.55), beats_to_samples(7, bpm), 0.14)
    mix_to(buf, gold_bell(time_axis(int(1.4 * SR)), 880.00, 0.40), beats_to_samples(8.5, bpm), 0.10)
    mix_to(buf, gold_bell(time_axis(int(1.6 * SR)), 698.46, 0.50), beats_to_samples(23, bpm), 0.12)
    mix_to(buf, gold_bell(time_axis(int(1.5 * SR)), 1046.50, 0.32), beats_to_samples(30, bpm), 0.09)
    return loop_crossfade(schroeder_verb(buf, 0.18))


def bed_exec() -> np.ndarray:
    """Floor 5 — The Nod. C# minor, 60 BPM. Mahogany, pulse, gold. Not Classic luxury-predator."""
    bpm = 60.0
    n = beats_to_samples(16, bpm)
    buf = np.zeros((n, 2))
    mix_to(buf, hvac(n, 40.0), 0, 0.35)
    mix_to(buf, pad_chord(n, [138.59, 207.65, 277.18, 329.63], 0.08), 0, 0.48)  # C# G# C# E
    # Heartbeat pulse on every 2 beats
    pulse = kick(int(0.42 * SR), 38.0)
    for i in range(0, 16, 2):
        mix_to(buf, pulse, beats_to_samples(i, bpm), 0.13)
    # Low piano octaves
    lows = [(0.0, 69.30), (4.0, 69.30), (8.0, 61.74), (12.0, 69.30)]
    for beat, f in lows:
        mix_to(buf, piano_low(time_axis(int(3.6 * SR)), f, 0.85), beats_to_samples(beat, bpm), 0.5)
        mix_to(buf, piano_low(time_axis(int(3.2 * SR)), f * 2, 0.45), beats_to_samples(beat, bpm), 0.22)
    # Gold motif — C#5, G#5, E5 — the nod, not a fanfare
    mix_to(buf, gold_bell(time_axis(int(2.8 * SR)), 554.37, 0.7), beats_to_samples(6, bpm), 0.22)
    mix_to(buf, gold_bell(time_axis(int(2.4 * SR)), 830.61, 0.5), beats_to_samples(7.5, bpm), 0.14)
    mix_to(buf, gold_bell(time_axis(int(3.2 * SR)), 659.25, 0.55), beats_to_samples(14, bpm), 0.16)
    return loop_crossfade(schroeder_verb(buf, 0.34))


# ─── Stingers / SFX ────────────────────────────────────────────


def sfx_door_open() -> np.ndarray:
    n = int(0.72 * SR)
    t = time_axis(n)
    rumble = one_pole_low(brown(n), 90.0) * env_adsr(n, 0.04, 0.18, 0.4, 0.28, 1.0)
    whoosh = one_pole_low(one_pole_high(noise(n), 400.0), 2800.0)
    whoosh *= np.clip(np.linspace(0.15, 1.0, n) ** 1.4, 0, 1) * np.exp(-t * 2.2)
    clank_n = int(0.22 * SR)
    clank = gold_bell(time_axis(clank_n), 188.0, 0.8)
    clank[: int(0.12 * SR)] += tick(int(0.12 * SR))
    buf = stereo(rumble * 0.55 + whoosh * 0.45)
    mix_to(buf, clank, int(0.48 * SR), 0.55)
    return schroeder_verb(buf, 0.12)


def sfx_door_close() -> np.ndarray:
    n = int(0.68 * SR)
    t = time_axis(n)
    whoosh = one_pole_low(one_pole_high(noise(n), 350.0), 2400.0)
    whoosh *= np.clip(np.linspace(1.0, 0.1, n) ** 1.1, 0, 1)
    rumble = one_pole_low(brown(n), 80.0) * env_adsr(n, 0.02, 0.2, 0.35, 0.2, 0.9)
    thunk_n = int(0.2 * SR)
    thunk = kick(thunk_n, 42.0) + one_pole_low(noise(thunk_n), 200.0) * env_adsr(thunk_n, 0.001, 0.03, 0.1, 0.08, 0.8)
    buf = stereo(whoosh * 0.5 + rumble * 0.4)
    mix_to(buf, thunk, int(0.42 * SR), 0.85)
    mix_to(buf, tick(int(0.08 * SR)), int(0.44 * SR), 0.35)
    return schroeder_verb(buf, 0.1)


def sfx_arrive_chime() -> np.ndarray:
    """Two-tone ding: F#5 then C#5. Cab plaque punch, not Classic up/down."""
    n = int(0.95 * SR)
    buf = np.zeros((n, 2))
    mix_to(buf, gold_bell(time_axis(int(0.85 * SR)), 739.99, 1.0), 0, 0.7)
    mix_to(buf, gold_bell(time_axis(int(0.75 * SR)), 554.37, 0.85), int(0.14 * SR), 0.62)
    return schroeder_verb(buf, 0.28)


def sfx_office_hit() -> np.ndarray:
    n = int(0.32 * SR)
    t = time_axis(n)
    slap = one_pole_high(noise(n), 900.0) * np.exp(-t * 42.0)
    thud = sine(t, 110.0) * np.exp(-t * 28.0) + sine(t, 55.0) * np.exp(-t * 22.0) * 0.6
    paper = one_pole_low(one_pole_high(noise(n), 1500.0), 5000.0) * np.exp(-t * 30.0)
    return stereo(saturate(thud * 0.7 + slap * 0.45 + paper * 0.25, 1.5))


def sfx_office_win() -> np.ndarray:
    n = int(0.98 * SR)
    buf = np.zeros((n, 2))
    mix_to(buf, saturate(kick(int(0.22 * SR), 62.0), 1.3), 0, 0.55)
    paper = one_pole_high(noise(int(0.18 * SR)), 1800.0) * env_adsr(int(0.18 * SR), 0.001, 0.04, 0.1, 0.08, 0.9)
    mix_to(buf, paper, int(0.02 * SR), 0.4)
    mix_to(buf, gold_bell(time_axis(int(0.7 * SR)), 523.25, 0.85), int(0.08 * SR), 0.45)  # C5
    mix_to(buf, gold_bell(time_axis(int(0.65 * SR)), 659.25, 0.7), int(0.18 * SR), 0.38)  # E5
    mix_to(buf, gold_bell(time_axis(int(0.7 * SR)), 783.99, 0.6), int(0.30 * SR), 0.32)  # G5
    return schroeder_verb(buf, 0.2)


def _stamp_body() -> np.ndarray:
    n = int(0.28 * SR)
    t = time_axis(n)
    impact = kick(n, 70.0)
    rubber = one_pole_low(noise(n), 900.0) * np.exp(-t * 26.0)
    paper = one_pole_high(noise(n), 2200.0) * np.exp(-t * 36.0)
    return saturate(impact * 0.7 + rubber * 0.45 + paper * 0.3, 1.45)


def sting_cleared() -> np.ndarray:
    n = int(1.15 * SR)
    buf = np.zeros((n, 2))
    mix_to(buf, _stamp_body(), 0, 0.95)
    mix_to(buf, gold_bell(time_axis(int(0.85 * SR)), 523.25, 0.8), int(0.10 * SR), 0.42)
    mix_to(buf, gold_bell(time_axis(int(0.8 * SR)), 659.25, 0.7), int(0.20 * SR), 0.36)
    mix_to(buf, gold_bell(time_axis(int(0.85 * SR)), 783.99, 0.65), int(0.32 * SR), 0.34)
    return schroeder_verb(buf, 0.22)


def sting_the_nod() -> np.ndarray:
    n = int(1.45 * SR)
    buf = np.zeros((n, 2))
    mix_to(buf, _stamp_body(), 0, 1.0)
    mix_to(buf, piano_low(time_axis(int(1.1 * SR)), 69.30, 0.7), int(0.04 * SR), 0.4)
    mix_to(buf, gold_bell(time_axis(int(1.15 * SR)), 554.37, 0.9), int(0.12 * SR), 0.5)
    mix_to(buf, gold_bell(time_axis(int(1.05 * SR)), 830.61, 0.7), int(0.28 * SR), 0.36)
    mix_to(buf, gold_bell(time_axis(int(1.2 * SR)), 1108.73, 0.55), int(0.46 * SR), 0.28)
    return schroeder_verb(buf, 0.3)


JOBS = [
    ("music_office_title_after_hours.mp3", bed_title),
    ("music_office_floor1_cubicle_hum.mp3", bed_floor1),
    ("music_office_floor2_operations.mp3", bed_floor2),
    ("music_office_floor3_product.mp3", bed_floor3),
    ("music_office_floor4_sales.mp3", bed_floor4),
    ("music_office_exec_the_nod.mp3", bed_exec),
    ("sfx_elevator_door_open.mp3", sfx_door_open),
    ("sfx_elevator_door_close.mp3", sfx_door_close),
    ("sfx_elevator_arrive_chime.mp3", sfx_arrive_chime),
    ("sfx_office_hit.mp3", sfx_office_hit),
    ("sfx_office_win.mp3", sfx_office_win),
    ("sting_cleared_stamp.mp3", sting_cleared),
    ("sting_the_nod_stamp.mp3", sting_the_nod),
]


def main() -> None:
    wanted = set(sys.argv[1:])
    print("Generating Office audio (original synthesis)…")
    for name, fn in JOBS:
        if wanted and name not in wanted:
            continue
        write_mp3(name, fn())
    print("done")


if __name__ == "__main__":
    main()
