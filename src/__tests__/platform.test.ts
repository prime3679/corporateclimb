import { afterEach, describe, expect, it, vi } from 'vitest'
import { Haptics } from '@/platform/haptics'
import { WakeLock } from '@/platform/wakeLock'
import { share } from '@/platform/share'
import { canInstall, isStandalone, promptInstall } from '@/platform/install'
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, saveSettings } from '@/settings'

function defineOnNavigator(key: string, value: unknown) {
  Object.defineProperty(navigator, key, { value, configurable: true, writable: true })
  return () => {
    delete (navigator as unknown as Record<string, unknown>)[key]
  }
}

const cleanups: Array<() => void> = []

afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn())
  Haptics.setEnabled(true)
  localStorage.clear()
})

describe('Haptics', () => {
  it('is a silent no-op when the vibration API is missing (jsdom)', () => {
    expect(Haptics.supported).toBe(false)
    expect(() => {
      Haptics.selection()
      Haptics.impact('heavy')
      Haptics.success()
      Haptics.warning()
    }).not.toThrow()
  })

  it('vibrates when supported and enabled, stays quiet when disabled', () => {
    const vibrate = vi.fn()
    cleanups.push(defineOnNavigator('vibrate', vibrate))

    expect(Haptics.supported).toBe(true)
    Haptics.impact('light')
    expect(vibrate).toHaveBeenCalledWith(10)
    Haptics.warning()
    expect(vibrate).toHaveBeenCalledWith([30, 50, 30])

    Haptics.setEnabled(false)
    vibrate.mockClear()
    Haptics.selection()
    Haptics.impact('heavy')
    expect(vibrate).not.toHaveBeenCalled()
  })
})

describe('WakeLock', () => {
  it('is a silent no-op without the API', async () => {
    expect(WakeLock.supported).toBe(false)
    await expect(WakeLock.acquire()).resolves.toBeUndefined()
    await expect(WakeLock.release()).resolves.toBeUndefined()
    await expect(WakeLock.reacquire()).resolves.toBeUndefined()
  })

  it('requests and releases a screen lock when supported', async () => {
    const release = vi.fn().mockResolvedValue(undefined)
    const sentinel = { release, addEventListener: vi.fn() }
    const request = vi.fn().mockResolvedValue(sentinel)
    cleanups.push(defineOnNavigator('wakeLock', { request }))

    await WakeLock.acquire()
    expect(request).toHaveBeenCalledWith('screen')
    await WakeLock.release()
    expect(release).toHaveBeenCalled()
  })
})

describe('share', () => {
  it('prefers the native share sheet', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined)
    cleanups.push(defineOnNavigator('share', nativeShare))
    await expect(share('hello')).resolves.toBe('shared')
    expect(nativeShare).toHaveBeenCalledWith({ text: 'hello' })
  })

  it('reports a cancelled sheet without surprise-copying', async () => {
    cleanups.push(defineOnNavigator('share', vi.fn().mockRejectedValue(new Error('abort'))))
    await expect(share('hello')).resolves.toBe('failed')
  })

  it('falls back to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    cleanups.push(defineOnNavigator('clipboard', { writeText }))
    await expect(share('hello')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('fails soft when nothing is available', async () => {
    await expect(share('hello')).resolves.toBe('failed')
  })
})

describe('install', () => {
  it('degrades when no prompt was captured', async () => {
    expect(canInstall()).toBe(false)
    await expect(promptInstall()).resolves.toBe('unavailable')
    expect(isStandalone()).toBe(false)
  })
})

describe('settings haptics key', () => {
  it('defaults on and round-trips through storage', () => {
    expect(DEFAULT_SETTINGS.haptics).toBe(true)
    expect(loadSettings().haptics).toBe(true)

    saveSettings({ ...DEFAULT_SETTINGS, haptics: false })
    expect(loadSettings().haptics).toBe(false)
  })

  it('tolerates a pre-haptics settings blob', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ musicVolume: 0.5, sfxVolume: 0.5, textSpeed: 'fast', reduceMotion: true }),
    )
    const s = loadSettings()
    expect(s.haptics).toBe(true)
    expect(s.textSpeed).toBe('fast')
  })
})
