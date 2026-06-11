import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  TEXT_SPEED_MS,
  loadSettings,
  saveSettings,
} from '../settings'

describe('settings persistence', () => {
  beforeEach(() => localStorage.clear())

  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips a saved settings object', () => {
    const s = {
      musicVolume: 0.4,
      sfxVolume: 0,
      textSpeed: 'instant' as const,
      reduceMotion: true,
    }
    saveSettings(s)
    expect(loadSettings()).toEqual(s)
  })

  it('returns defaults for corrupt JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps out-of-range volumes and rejects unknown text speeds', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ musicVolume: 7, sfxVolume: -2, textSpeed: 'warp', reduceMotion: 'yes' }),
    )
    expect(loadSettings()).toEqual({
      musicVolume: 1,
      sfxVolume: 0,
      textSpeed: 'normal',
      reduceMotion: false,
    })
  })

  it('survives a throwing storage (private browsing)', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow()
    vi.restoreAllMocks()
  })

  it('every text speed maps to a non-negative delay', () => {
    for (const ms of Object.values(TEXT_SPEED_MS)) {
      expect(ms).toBeGreaterThanOrEqual(0)
    }
    expect(TEXT_SPEED_MS.instant).toBe(0)
  })
})
