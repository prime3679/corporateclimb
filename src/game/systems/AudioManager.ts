import { Howl, Howler } from 'howler'

/**
 * AudioManager — singleton for background music and sound effects.
 * Supports crossfade between tracks, SFX pooling, and volume controls.
 */

interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  muted: false,
}

// SFX definitions — will be generated procedurally or loaded from files
const SFX_DEFS: Record<string, { src?: string; volume?: number }> = {
  jump: { volume: 0.4 },
  land: { volume: 0.3 },
  dodge_whoosh: { volume: 0.5 },
  hurt: { volume: 0.6 },
  interact: { volume: 0.4 },
  power_up_collect: { volume: 0.5 },
  level_complete: { volume: 0.7 },
  projectile_fire: { volume: 0.3 },
  projectile_hit: { volume: 0.4 },
  boss_phase_change: { volume: 0.6 },
  boss_defeat: { volume: 0.8 },
  dialogue_open: { volume: 0.3 },
  dialogue_close: { volume: 0.2 },
  option_select: { volume: 0.3 },
  reorg_alarm: { volume: 0.6 },
  door_open: { volume: 0.3 },
}

class AudioManagerSingleton {
  private settings: AudioSettings
  private currentMusic: Howl | null = null
  private musicId: number | null = null
  private sfxPool: Map<string, Howl[]> = new Map()
  private initialized = false

  constructor() {
    // Load settings from localStorage
    const saved = localStorage.getItem('corporate_climb_audio')
    this.settings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS }
  }

  init() {
    if (this.initialized) return
    this.initialized = true
    Howler.volume(this.settings.masterVolume)
    if (this.settings.muted) Howler.mute(true)
  }

  // ── Music ──

  playMusic(key: string, _options?: { loop?: boolean; fadeIn?: number }) {
    // Music tracks will be generated/loaded later
    // For now, this is a no-op placeholder
    console.log(`[Audio] Music: ${key}`)
  }

  stopMusic(fadeOut: number = 1000) {
    if (this.currentMusic && this.musicId !== null) {
      this.currentMusic.fade(this.settings.musicVolume, 0, fadeOut, this.musicId)
      const music = this.currentMusic
      const id = this.musicId
      setTimeout(() => {
        music.stop(id)
      }, fadeOut)
      this.currentMusic = null
      this.musicId = null
    }
  }

  crossfadeTo(key: string, duration: number = 2000) {
    this.stopMusic(duration / 2)
    setTimeout(() => this.playMusic(key, { fadeIn: duration / 2 }), duration / 2)
  }

  // ── Sound Effects ──

  playSfx(key: string) {
    if (this.settings.muted) return
    if (!SFX_DEFS[key]) return

    // For now, use Web Audio API to generate simple procedural sounds
    this.playProceduralSfx(key)
  }

  private playProceduralSfx(key: string) {
    const ctx = Howler.ctx
    if (!ctx) return

    const vol = (SFX_DEFS[key]?.volume ?? 0.5) * this.settings.sfxVolume * this.settings.masterVolume
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(vol, now)

    switch (key) {
      case 'jump':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
        break
      case 'land':
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
        break
      case 'hurt':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.start(now)
        osc.stop(now + 0.3)
        break
      case 'power_up_collect':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15)
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.start(now)
        osc.stop(now + 0.3)
        break
      case 'interact':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(500, now)
        osc.frequency.setValueAtTime(700, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
        osc.start(now)
        osc.stop(now + 0.12)
        break
      case 'boss_defeat':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.5)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        osc.start(now)
        osc.stop(now + 0.8)
        break
      case 'boss_phase_change':
        osc.type = 'square'
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2)
        gain.gain.setValueAtTime(vol * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.start(now)
        osc.stop(now + 0.4)
        break
      default:
        // Generic click
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
        osc.start(now)
        osc.stop(now + 0.08)
    }
  }

  // ── Settings ──

  setMasterVolume(vol: number) {
    this.settings.masterVolume = vol
    Howler.volume(vol)
    this.saveSettings()
  }

  setMusicVolume(vol: number) {
    this.settings.musicVolume = vol
    if (this.currentMusic && this.musicId !== null) {
      this.currentMusic.volume(vol, this.musicId)
    }
    this.saveSettings()
  }

  setSfxVolume(vol: number) {
    this.settings.sfxVolume = vol
    this.saveSettings()
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted
    Howler.mute(this.settings.muted)
    this.saveSettings()
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  private saveSettings() {
    localStorage.setItem('corporate_climb_audio', JSON.stringify(this.settings))
  }
}

export const audioManager = new AudioManagerSingleton()
