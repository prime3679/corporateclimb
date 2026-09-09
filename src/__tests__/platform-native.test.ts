import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true),
  impact: vi.fn().mockResolvedValue(undefined),
  notification: vi.fn().mockResolvedValue(undefined),
  selectionChanged: vi.fn().mockResolvedValue(undefined),
  share: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  keepAwake: vi.fn().mockResolvedValue(undefined),
  allowSleep: vi.fn().mockResolvedValue(undefined),
  setBackgroundColor: vi.fn().mockResolvedValue(undefined),
  setStyle: vi.fn().mockResolvedValue(undefined),
  setOverlaysWebView: vi.fn().mockResolvedValue(undefined),
  hideSplash: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

vi.mock('@capacitor/haptics', () => ({
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
  Haptics: {
    impact: mocks.impact,
    notification: mocks.notification,
    selectionChanged: mocks.selectionChanged,
  },
}))

vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}))

vi.mock('@capacitor/app', () => ({
  App: { addListener: mocks.addListener },
}))

vi.mock('@capacitor-community/keep-awake', () => ({
  KeepAwake: { keepAwake: mocks.keepAwake, allowSleep: mocks.allowSleep },
}))

vi.mock('@capacitor/status-bar', () => ({
  Style: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
  StatusBar: {
    setBackgroundColor: mocks.setBackgroundColor,
    setStyle: mocks.setStyle,
    setOverlaysWebView: mocks.setOverlaysWebView,
  },
}))

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: mocks.hideSplash },
}))

import { Music } from '@/music'
import {
  bootstrapNativeChrome,
  canInstall,
  isNative,
  isStandalone,
  promptInstall,
  registerInstallCapture,
  registerLifecycle,
  share,
} from '@/platform'
import { Haptics } from '@/platform/haptics'
import { BOOT_COLOR } from '@/platform/native'
import { WakeLock } from '@/platform/wakeLock'
import { fetchDailyLeaderboard, submitDailyScore } from '@/leaderboard'

const ENTRY = {
  seed: 20260612,
  name: 'Climber',
  classId: 'pm',
  floorsCleared: 12,
  won: false,
  score: 2500,
}

beforeEach(() => {
  mocks.isNativePlatform.mockReturnValue(true)
  localStorage.clear()
})

afterEach(() => {
  Haptics.setEnabled(true)
  vi.clearAllMocks()
  mocks.isNativePlatform.mockReturnValue(true)
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('isNative branching', () => {
  it('is true when Capacitor reports a native platform', () => {
    expect(isNative()).toBe(true)
  })

  it('is false when Capacitor reports web', () => {
    mocks.isNativePlatform.mockReturnValue(false)
    expect(isNative()).toBe(false)
  })
})

describe('bootstrapNativeChrome', () => {
  it('sets status-bar chrome and hides splash on native', async () => {
    await bootstrapNativeChrome()
    expect(mocks.setOverlaysWebView).toHaveBeenCalledWith({ overlay: true })
    expect(mocks.setBackgroundColor).toHaveBeenCalledWith({ color: BOOT_COLOR })
    expect(mocks.setStyle).toHaveBeenCalledWith({ style: 'DARK' })
    expect(mocks.hideSplash).toHaveBeenCalled()
  })

  it('still hides the splash when the status-bar plugin rejects', async () => {
    mocks.setOverlaysWebView.mockRejectedValueOnce(new Error('not implemented'))
    await bootstrapNativeChrome()
    expect(mocks.hideSplash).toHaveBeenCalled()
  })

  it('skips plugins on web', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    await bootstrapNativeChrome()
    expect(mocks.setOverlaysWebView).not.toHaveBeenCalled()
    expect(mocks.setStyle).not.toHaveBeenCalled()
    expect(mocks.hideSplash).not.toHaveBeenCalled()
  })
})

describe('native haptics', () => {
  it('routes selection, impact, and notifications through Capacitor', async () => {
    Haptics.selection()
    Haptics.impact('medium')
    Haptics.success()
    Haptics.warning()
    await Promise.resolve()
    expect(mocks.selectionChanged).toHaveBeenCalled()
    expect(mocks.impact).toHaveBeenCalledWith({ style: 'MEDIUM' })
    expect(mocks.notification).toHaveBeenCalledWith({ type: 'SUCCESS' })
    expect(mocks.notification).toHaveBeenCalledWith({ type: 'WARNING' })
  })

  it('stays quiet when disabled', async () => {
    Haptics.setEnabled(false)
    Haptics.selection()
    Haptics.impact('heavy')
    await Promise.resolve()
    expect(mocks.selectionChanged).not.toHaveBeenCalled()
    expect(mocks.impact).not.toHaveBeenCalled()
  })

  it('reports supported on native even without navigator.vibrate', () => {
    expect(Haptics.supported).toBe(true)
  })
})

describe('native wake lock', () => {
  it('keeps the screen awake through KeepAwake', async () => {
    expect(WakeLock.supported).toBe(true)
    await WakeLock.acquire()
    expect(mocks.keepAwake).toHaveBeenCalled()
    mocks.keepAwake.mockClear()
    await WakeLock.reacquire()
    expect(mocks.keepAwake).not.toHaveBeenCalled()
    await WakeLock.release()
    expect(mocks.allowSleep).toHaveBeenCalled()
  })
})

describe('native share', () => {
  it('uses the Capacitor share sheet', async () => {
    await expect(share('hello')).resolves.toBe('shared')
    expect(mocks.share).toHaveBeenCalledWith({ text: 'hello' })
  })

  it('does not clipboard-fallback on cancel', async () => {
    mocks.share.mockRejectedValueOnce(new Error('abort'))
    await expect(share('hello')).resolves.toBe('failed')
  })
})

describe('native install', () => {
  it('treats the shell as already installed and not promptable', async () => {
    registerInstallCapture()
    expect(canInstall()).toBe(false)
    expect(isStandalone()).toBe(true)
    await expect(promptInstall()).resolves.toBe('unavailable')
  })
})

describe('native lifecycle', () => {
  it('fans appStateChange out to music + wake lock', async () => {
    const suspend = vi.spyOn(Music, 'suspend').mockImplementation(() => {})
    const resume = vi.spyOn(Music, 'resume').mockImplementation(() => {})
    registerLifecycle()
    expect(mocks.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function))
    const handler = mocks.addListener.mock.calls[0][1] as (state: { isActive: boolean }) => void
    handler({ isActive: false })
    expect(suspend).toHaveBeenCalled()
    handler({ isActive: true })
    expect(resume).toHaveBeenCalled()
  })
})

describe('native leaderboard URL', () => {
  it('posts and fetches the production HTTPS origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [] }),
      }),
    )
    expect(await submitDailyScore(ENTRY)).toBe(true)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://corporateclimb.vercel.app/api/daily-leaderboard',
      expect.objectContaining({ method: 'POST' }),
    )
    await fetchDailyLeaderboard(ENTRY.seed)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `https://corporateclimb.vercel.app/api/daily-leaderboard?seed=${ENTRY.seed}`,
      expect.anything(),
    )
    vi.unstubAllGlobals()
  })
})
