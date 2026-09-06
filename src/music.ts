// ─── BACKGROUND MUSIC via HTMLAudioElement assets ─────────────
// Corporate Climb uses short loopable music beds in /public/audio.
// Playback is gated by user activation on browsers that block autoplay.
// Track changes crossfade (~450ms) instead of hard-cutting; volume
// ramps are per-element and cancellable, so a settings change or a
// rapid screen hop simply supersedes the in-flight fade.
//
// Classic keeps the four original Act-1 beds. Office plays its own
// title / Floor 1 / Operations / Exec loops — see docs/rpg/office-audio.md.

export type ClassicTrack = 'title' | 'battle' | 'boss' | 'event'
export type OfficeTrack = 'officeTitle' | 'officeFloor1' | 'officeFloor2' | 'officeExec'
export type TrackName = ClassicTrack | OfficeTrack

/** Classic tower beds. Filenames are a contract — do not retarget these keys. */
export const CLASSIC_TRACKS: Record<ClassicTrack, string> = {
  title: '/audio/music_menu_corporate_lobby.mp3',
  battle: '/audio/music_gameplay_ladder_grind.mp3',
  boss: '/audio/music_executive_floor_luxury_predator.mp3',
  event: '/audio/music_gameplay_pressure_review.mp3',
}

/** Office campaign beds. Distinct from Classic Act-1 wallpaper. */
export const OFFICE_TRACKS: Record<OfficeTrack, string> = {
  officeTitle: '/audio/music_office_title_after_hours.mp3',
  officeFloor1: '/audio/music_office_floor1_cubicle_hum.mp3',
  officeFloor2: '/audio/music_office_floor2_operations.mp3',
  officeExec: '/audio/music_office_exec_the_nod.mp3',
}

const TRACKS: Record<TrackName, string> = { ...CLASSIC_TRACKS, ...OFFICE_TRACKS }

/** Every bed, for the service worker's background warm-up. */
export const MUSIC_URLS: string[] = Object.values(TRACKS)

/** Floor 3/4 reuse Operations until dedicated Product/Sales beds exist. */
export function officeBedForFloor(floorId: string): OfficeTrack {
  if (floorId === 'floor_05') return 'officeExec'
  if (floorId === 'floor_01') return 'officeFloor1'
  return 'officeFloor2'
}

let currentTrack: TrackName | null = null
let currentAudio: HTMLAudioElement | null = null
let _muted = false
let _volume = 1
let pendingTrack: TrackName | null = null
let unlockListenerRegistered = false
/** App backgrounded: playback paused but the track selection kept. */
let suspended = false

function hasUserActivation() {
  if (typeof navigator === 'undefined') return true
  if (!('userActivation' in navigator)) return true
  return navigator.userActivation.hasBeenActive
}

const FADE_MS = 450

// Each element's active ramp id; starting a new ramp (or setting the
// volume directly) bumps the id, which cancels the superseded ramp.
const fadeIds = new WeakMap<HTMLAudioElement, number>()
let fadeSeq = 0

function cancelFade(audio: HTMLAudioElement) {
  fadeIds.set(audio, ++fadeSeq)
}

function fadeTo(audio: HTMLAudioElement, target: number, onDone?: () => void) {
  if (typeof requestAnimationFrame === 'undefined') {
    audio.volume = target
    onDone?.()
    return
  }
  const id = ++fadeSeq
  fadeIds.set(audio, id)
  const start = audio.volume
  let t0: number | null = null
  const tick = (t: number) => {
    if (fadeIds.get(audio) !== id) return // superseded
    if (t0 === null) t0 = t
    const k = Math.min(1, (t - t0) / FADE_MS)
    audio.volume = start + (target - start) * k
    if (k < 1) requestAnimationFrame(tick)
    else onDone?.()
  }
  requestAnimationFrame(tick)
}

function targetVolume() {
  return _muted ? 0 : _volume
}

function applyGain() {
  if (!currentAudio) return
  cancelFade(currentAudio)
  currentAudio.muted = _muted
  currentAudio.volume = targetVolume()
}

function registerUnlockListener() {
  if (unlockListenerRegistered || typeof window === 'undefined') return
  unlockListenerRegistered = true

  const unlock = () => {
    unlockListenerRegistered = false
    const nextTrack = pendingTrack
    pendingTrack = null
    currentTrack = null
    if (nextTrack) playTrack(nextTrack)
  }

  window.addEventListener('pointerdown', unlock, { once: true, capture: true })
  window.addEventListener('keydown', unlock, { once: true, capture: true })
}

/** Fade the outgoing bed to silence, then release it. */
function retireAudio(audio: HTMLAudioElement) {
  if (audio.paused) {
    audio.currentTime = 0
    return
  }
  fadeTo(audio, 0, () => {
    audio.pause()
    audio.currentTime = 0
  })
}

function stopMusic() {
  pendingTrack = null
  currentTrack = null
  if (!currentAudio) return
  retireAudio(currentAudio)
  currentAudio = null
}

function playTrack(name: TrackName) {
  if (currentTrack === name && currentAudio && (!currentAudio.paused || suspended)) return
  stopMusic()
  currentTrack = name

  if (!hasUserActivation()) {
    pendingTrack = name
    registerUnlockListener()
    return
  }

  const audio = new Audio(TRACKS[name])
  audio.loop = true
  audio.preload = 'auto'
  currentAudio = audio
  audio.muted = _muted
  audio.volume = 0 // crossfade in from silence

  if (suspended) return // resume() starts playback when the app returns

  const started = audio.play()
  if (started && typeof started.then === 'function') {
    started
      .then(() => {
        if (currentAudio === audio) fadeTo(audio, targetVolume())
      })
      .catch(() => {
        if (currentTrack !== name) return
        pendingTrack = name
        registerUnlockListener()
      })
  } else {
    fadeTo(audio, targetVolume())
  }
}

export const Music = {
  playTitle() {
    playTrack('title')
  },
  playBattle() {
    playTrack('battle')
  },
  playBoss() {
    playTrack('boss')
  },
  playEvent() {
    playTrack('event')
  },
  playOfficeTitle() {
    playTrack('officeTitle')
  },
  playOfficeFloor(floorId: string) {
    playTrack(officeBedForFloor(floorId))
  },
  stop() {
    stopMusic()
  },

  /** App went to the background: pause without losing the selection. */
  suspend() {
    suspended = true
    if (!currentAudio) return
    cancelFade(currentAudio)
    currentAudio.pause()
  },

  /** App is visible again: pick up where suspend() left off. */
  resume() {
    if (!suspended) return
    suspended = false
    if (!currentAudio) return
    applyGain()
    // jsdom's play() returns undefined — guard before chaining.
    currentAudio.play()?.catch(() => {
      /* autoplay refusal — the next user gesture restarts music */
    })
  },

  get muted() {
    return _muted
  },

  setMuted(muted: boolean) {
    _muted = muted
    applyGain()
  },

  get volume() {
    return _volume
  },

  /** Music volume 0..1, independent of the mute toggle. */
  setVolume(volume: number) {
    _volume = Math.min(1, Math.max(0, volume))
    applyGain()
  },

  toggleMute(): boolean {
    Music.setMuted(!_muted)
    return _muted
  },

  get currentTrack() {
    return currentTrack
  },
}

/** Playwright / debug read of the selected bed. Not a gameplay API. */
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__CC_MUSIC_TRACK', {
    get: () => currentTrack,
    configurable: true,
  })
}
