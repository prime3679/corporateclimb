// ─── BACKGROUND MUSIC via HTMLAudioElement assets ─────────────
// Corporate Climb uses short loopable music beds in /public/audio.
// Playback is gated by user activation on browsers that block autoplay.

type TrackName = 'title' | 'battle' | 'boss' | 'event'

const TRACKS: Record<TrackName, string> = {
  title: '/audio/music_menu_corporate_lobby.mp3',
  battle: '/audio/music_gameplay_ladder_grind.mp3',
  boss: '/audio/music_executive_floor_luxury_predator.mp3',
  event: '/audio/music_gameplay_pressure_review.mp3',
}

let currentTrack: TrackName | null = null
let currentAudio: HTMLAudioElement | null = null
let _muted = false
let _volume = 1
let pendingTrack: TrackName | null = null
let unlockListenerRegistered = false

function hasUserActivation() {
  if (typeof navigator === 'undefined') return true
  if (!('userActivation' in navigator)) return true
  return navigator.userActivation.hasBeenActive
}

function applyGain() {
  if (!currentAudio) return
  currentAudio.muted = _muted
  currentAudio.volume = _muted ? 0 : _volume
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

function stopMusic() {
  pendingTrack = null
  currentTrack = null
  if (!currentAudio) return
  currentAudio.pause()
  currentAudio.currentTime = 0
  currentAudio = null
}

function playTrack(name: TrackName) {
  if (currentTrack === name && currentAudio && !currentAudio.paused) return
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
  applyGain()

  audio.play().catch(() => {
    if (currentTrack !== name) return
    pendingTrack = name
    registerUnlockListener()
  })
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
  stop() {
    stopMusic()
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
