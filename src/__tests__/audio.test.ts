// The audio engines must be silent no-ops in environments without
// WebAudio/media playback (jsdom, private browsing) — these tests pin
// the facade surface and the volume/mute bookkeeping, not sound.
import { afterEach, describe, expect, it } from 'vitest'
import { SFX } from '@/sfx'
import { CLASSIC_TRACKS, MUSIC_URLS, Music, OFFICE_TRACKS, officeBedForFloor } from '@/music'

afterEach(() => {
  SFX.setCampaign('classic')
  SFX.setVolume(1)
  Music.setVolume(1)
  Music.setMuted(false)
})

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
      'step',
      'bump',
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
      'badgeSwipe',
      'paper',
      'elevatorUp',
      'elevatorDown',
      'elevatorOpen',
      'elevatorClose',
      'elevatorChime',
      'stampCleared',
      'stampTheNod',
      'printerJam',
      'printerDone',
      'glassDoor',
    ] as const
    for (const m of methods) {
      expect(() => SFX[m](), m).not.toThrow()
    }
  })

  it('defaults to Classic and remaps hit/win when the Office campaign is armed', () => {
    expect(SFX.campaign).toBe('classic')
    SFX.setCampaign('office')
    expect(SFX.campaign).toBe('office')
    expect(() => {
      SFX.hit()
      SFX.critHit()
      SFX.victory()
    }).not.toThrow()
    SFX.setCampaign('classic')
    expect(SFX.campaign).toBe('classic')
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

  it('keeps Classic Act-1 filenames on the Classic keys', () => {
    expect(CLASSIC_TRACKS).toEqual({
      title: '/audio/music_menu_corporate_lobby.mp3',
      battle: '/audio/music_gameplay_ladder_grind.mp3',
      boss: '/audio/music_executive_floor_luxury_predator.mp3',
      event: '/audio/music_gameplay_pressure_review.mp3',
    })
  })

  it('maps Office floors to distinct beds, not the Classic lobby', () => {
    expect(officeBedForFloor('floor_01')).toBe('officeFloor1')
    expect(officeBedForFloor('floor_02')).toBe('officeFloor2')
    expect(officeBedForFloor('floor_03')).toBe('officeFloor2')
    expect(officeBedForFloor('floor_04')).toBe('officeFloor2')
    expect(officeBedForFloor('floor_05')).toBe('officeExec')
    expect(OFFICE_TRACKS.officeTitle).toBe('/audio/music_office_title_after_hours.mp3')
    expect(OFFICE_TRACKS.officeFloor1).not.toBe(CLASSIC_TRACKS.title)
    expect(OFFICE_TRACKS.officeFloor2).not.toBe(CLASSIC_TRACKS.battle)
    expect(OFFICE_TRACKS.officeExec).not.toBe(CLASSIC_TRACKS.boss)
    expect(MUSIC_URLS).toEqual(expect.arrayContaining(Object.values(CLASSIC_TRACKS)))
    expect(MUSIC_URLS).toEqual(expect.arrayContaining(Object.values(OFFICE_TRACKS)))
  })

  it('Office play helpers are callable without media', () => {
    expect(() => {
      Music.playOfficeTitle()
      Music.playOfficeFloor('floor_01')
      Music.playOfficeFloor('floor_05')
      Music.playTitle()
      Music.stop()
    }).not.toThrow()
  })
})
