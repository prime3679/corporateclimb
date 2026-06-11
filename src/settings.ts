// ─── PLAYER SETTINGS ─────────────────────────────────────────
// Audio volumes, text speed, and motion preference, persisted as one
// versionless blob. Loading tolerates missing/corrupt storage (private
// browsing must never crash the game).

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'

export interface Settings {
  musicVolume: number // 0..1
  sfxVolume: number // 0..1
  textSpeed: TextSpeed
  /** App-level reduced-motion override (OS preference also respected). */
  reduceMotion: boolean
}

export const SETTINGS_KEY = 'corporate-climb-settings'

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 1,
  sfxVolume: 1,
  textSpeed: 'normal',
  reduceMotion: false,
}

/** Typewriter delay per character. */
export const TEXT_SPEED_MS: Record<TextSpeed, number> = {
  slow: 32,
  normal: 18,
  fast: 6,
  instant: 0,
}

const clamp01 = (v: unknown, fallback: number) =>
  typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      musicVolume: clamp01(parsed.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      textSpeed:
        parsed.textSpeed && parsed.textSpeed in TEXT_SPEED_MS
          ? parsed.textSpeed
          : DEFAULT_SETTINGS.textSpeed,
      reduceMotion: parsed.reduceMotion === true,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable */
  }
}
