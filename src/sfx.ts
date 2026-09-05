// ─── CORPORATE CLIMB SOUND EFFECTS via audio assets ───────────
// Short office-world SFX live in /public/audio. Playback goes through
// a single AudioContext with a decoded buffer pool (created and warmed
// on the first user gesture) — per-play `new Audio()` had first-play
// fetch latency and hit iOS's concurrent-element throttle on rapid
// combos. Contexts without WebAudio (jsdom, ancient browsers) and
// samples not yet decoded fall back to the old HTMLAudio path.
// Volume is independent from music and falls back silently in
// test/non-browser contexts.

let _volume = 1

const SAMPLES = {
  uiHover: '/audio/sfx_ui_hover.mp3',
  uiSelect: '/audio/sfx_ui_select.mp3',
  email: '/audio/sfx_email_ding.mp3',
  calendarDoom: '/audio/sfx_calendar_doom.mp3',
  keyboard: '/audio/sfx_keyboard_clack.mp3',
  badge: '/audio/sfx_badge_swipe.mp3',
  elevatorUp: '/audio/sfx_elevator_chime_up.mp3',
  elevatorDown: '/audio/sfx_elevator_chime_down.mp3',
  printerJam: '/audio/sfx_printer_jam.mp3',
  coffee: '/audio/sfx_coffee_pickup.mp3',
  stockOption: '/audio/sfx_stock_option_shimmer.mp3',
  comboTick: '/audio/sfx_kpi_combo_tick.mp3',
  error: '/audio/sfx_error_buzz.mp3',
  stamp: '/audio/sfx_rubber_stamp.mp3',
  paper: '/audio/sfx_paper_shuffle.mp3',
  bossPulse: '/audio/sfx_boss_proximity_pulse.mp3',
  cash: '/audio/sfx_cash_bonus.mp3',
  glassDoor: '/audio/sfx_glass_door_open.mp3',
  reviewHit: '/audio/sfx_performance_review_hit.mp3',
  ladderStep: '/audio/sfx_ladder_step.mp3',
  promotion: '/audio/sting_promotion.mp3',
  fired: '/audio/sting_fired.mp3',
  record: '/audio/sting_new_record.mp3',
  multiplier: '/audio/sting_bonus_multiplier.mp3',
  executiveWarning: '/audio/sting_executive_warning.mp3',
} as const

type SampleName = keyof typeof SAMPLES

function canPlayAudio() {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

// ─── WebAudio engine ────────────────────────────────────────

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
const buffers = new Map<SampleName, AudioBuffer>()
let preloadStarted = false
let unlockRegistered = false

function audioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return (
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  )
}

function ensureContext(): AudioContext | null {
  const Ctor = audioContextCtor()
  if (!Ctor) return null
  if (!ctx) {
    try {
      ctx = new Ctor()
      masterGain = ctx.createGain()
      masterGain.gain.value = _volume
      masterGain.connect(ctx.destination)
    } catch {
      ctx = null
      masterGain = null
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Fetch + decode every sample into the pool (off the critical path). */
async function preloadAll() {
  const c = ensureContext()
  if (!c || preloadStarted) return
  preloadStarted = true
  await Promise.all(
    (Object.keys(SAMPLES) as SampleName[]).map(async (name) => {
      try {
        const res = await fetch(SAMPLES[name])
        if (!res.ok) return
        buffers.set(name, await c.decodeAudioData(await res.arrayBuffer()))
      } catch {
        /* sample stays on the HTMLAudio fallback */
      }
    }),
  )
}

// Autoplay policies gate AudioContexts on user activation, so the
// engine warms up on the first gesture (same pattern as music.ts).
function registerUnlockListener() {
  if (unlockRegistered || typeof window === 'undefined') return
  unlockRegistered = true
  const unlock = () => {
    void preloadAll()
  }
  window.addEventListener('pointerdown', unlock, { once: true, capture: true })
  window.addEventListener('keydown', unlock, { once: true, capture: true })
}
registerUnlockListener()

function playSample(name: SampleName, volume = 1, rateJitter = 0) {
  if (_volume <= 0) return

  const buf = buffers.get(name)
  if (buf && ctx && masterGain) {
    try {
      const source = ctx.createBufferSource()
      source.buffer = buf
      if (rateJitter > 0) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJitter
      const gain = ctx.createGain()
      gain.gain.value = Math.min(1, Math.max(0, volume))
      source.connect(gain)
      gain.connect(masterGain)
      source.start()
      return
    } catch {
      /* fall through to the element path */
    }
  }

  if (!canPlayAudio()) return
  const audio = new Audio(SAMPLES[name])
  audio.preload = 'auto'
  audio.volume = Math.min(1, Math.max(0, _volume * volume))
  if (rateJitter > 0) audio.playbackRate = 1 + (Math.random() * 2 - 1) * rateJitter
  // jsdom's play() returns undefined — guard before chaining.
  audio.play()?.catch(() => {})
}

function playSequence(samples: Array<[SampleName, number, number?]>) {
  samples.forEach(([name, delay, volume]) => {
    window.setTimeout(() => playSample(name, volume ?? 1), delay)
  })
}

export const SFX = {
  get volume() {
    return _volume
  },

  /** Sound-effect volume 0..1. 0 silences all SFX. */
  setVolume(volume: number) {
    _volume = Math.min(1, Math.max(0, volume))
    if (masterGain) masterGain.gain.value = _volume
  },

  // Menu / UI
  menuSelect() {
    playSample('uiHover', 0.75)
  },

  menuConfirm() {
    playSample('uiSelect', 0.9)
  },

  menuBack() {
    playSample('elevatorDown', 0.65)
  },

  textTick() {
    playSample('keyboard', 0.35, 0.05)
  },

  /** Overworld cadence while walking the office floor. */
  step() {
    playSample('ladderStep', 0.32, 0.05)
  },

  /** Soft invalid-move thunk when walking into a wall. */
  bump() {
    playSample('keyboard', 0.24, 0.02)
  },

  // Battle
  attackSwing() {
    playSample('ladderStep', 0.85, 0.04)
  },

  hit() {
    playSample('reviewHit', 0.95)
  },

  critHit() {
    playSample('reviewHit', 1)
    window.setTimeout(() => playSample('comboTick', 0.9), 80)
  },

  heal() {
    playSample('coffee', 0.9)
  },

  enemyAppear() {
    playSample('badge', 0.75)
  },

  faint() {
    playSample('stamp', 1)
    window.setTimeout(() => playSample('fired', 0.75), 180)
  },

  // Progression
  victory() {
    playSample('promotion', 0.9)
  },

  levelUp() {
    playSample('promotion', 1)
  },

  gameOver() {
    playSample('fired', 1)
  },

  bossIntro() {
    playSample('executiveWarning', 0.9)
    window.setTimeout(() => playSample('bossPulse', 0.9), 500)
  },

  // Events
  eventGood() {
    playSample('stockOption', 0.9)
  },

  eventBad() {
    playSample('calendarDoom', 0.9)
  },

  eventNeutral() {
    playSample('paper', 0.75)
  },

  coin() {
    playSample('cash', 0.9)
  },

  miss() {
    playSample('error', 0.55)
  },

  // Type effectiveness
  superEffective() {
    playSequence([
      ['comboTick', 0, 0.8],
      ['comboTick', 80, 0.85],
      ['multiplier', 160, 0.9],
    ])
  },

  notEffective() {
    playSample('error', 0.65)
  },

  achievementUnlock() {
    playSample('record', 0.95)
  },

  // Win fanfare
  fanfare() {
    playSample('record', 1)
    window.setTimeout(() => playSample('promotion', 0.9), 650)
  },

  // Asset-specific hooks for newer UI/gameplay screens.
  email() {
    playSample('email', 0.9)
  },

  coffee() {
    playSample('coffee', 0.9)
  },

  badgeSwipe() {
    playSample('badge', 0.78)
  },

  paper() {
    playSample('paper', 0.76)
  },

  elevatorUp() {
    playSample('elevatorUp', 0.85)
  },

  elevatorDown() {
    playSample('elevatorDown', 0.85)
  },

  printerJam() {
    playSample('printerJam', 0.8)
  },

  glassDoor() {
    playSample('glassDoor', 0.75)
  },
}
