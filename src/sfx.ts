// ─── CORPORATE CLIMB SOUND EFFECTS via audio assets ───────────
// Short office-world SFX live in /public/audio. Volume is independent
// from music and falls back silently in test/non-browser contexts.

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

function playSample(name: SampleName, volume = 1, rateJitter = 0) {
  if (_volume <= 0 || !canPlayAudio()) return
  const audio = new Audio(SAMPLES[name])
  audio.preload = 'auto'
  audio.volume = Math.min(1, Math.max(0, _volume * volume))
  if (rateJitter > 0) audio.playbackRate = 1 + (Math.random() * 2 - 1) * rateJitter
  audio.play().catch(() => {})
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
