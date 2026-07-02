// The audio engines must be silent no-ops in environments without
// WebAudio/media playback (jsdom, private browsing) — these tests pin
// the facade surface and the volume/mute bookkeeping, not sound.
import { describe, expect, it } from 'vitest'
import { SFX } from '@/sfx'
import { Music } from '@/music'

describe('SFX facade', () => {
  it('clamps volume into 0..1', () => {
    SFX.setVolume(7)
    expect(SFX.volume).toBe(1)
    SFX.setVolume(-2)
    expect(SFX.volume).toBe(0)
    SFX.setVolume(0.5)
    expect(SFX.volume).toBe(0.5)
  })

  it('every effect is callable without WebAudio support', () => {
    SFX.setVolume(1)
    const methods = [
      'menuSelect',
      'menuConfirm',
      'menuBack',
      'textTick',
      'attackSwing',
      'hit',
      'critHit',
      'heal',
      'enemyAppear',
      'faint',
      'victory',
      'levelUp',
      'gameOver',
      'bossIntro',
      'eventGood',
      'eventBad',
      'eventNeutral',
      'coin',
      'miss',
      'superEffective',
      'notEffective',
      'achievementUnlock',
      'fanfare',
      'email',
      'coffee',
      'elevatorUp',
      'elevatorDown',
      'printerJam',
      'glassDoor',
    ] as const
    for (const m of methods) {
      expect(() => SFX[m](), m).not.toThrow()
    }
  })
})

describe('Music facade', () => {
  it('tracks volume/mute state and survives suspend/resume without audio', () => {
    Music.setVolume(0.3)
    expect(Music.volume).toBe(0.3)
    Music.setMuted(true)
    expect(Music.muted).toBe(true)
    expect(Music.toggleMute()).toBe(false)

    expect(() => {
      Music.suspend()
      Music.resume()
      Music.stop()
    }).not.toThrow()
    Music.setVolume(1)
  })
})
