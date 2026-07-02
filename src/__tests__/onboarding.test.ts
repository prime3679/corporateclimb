import { beforeEach, describe, expect, it } from 'vitest'
import {
  INSTALL_NUDGE_COOLDOWN_MS,
  INSTALL_NUDGE_MAX,
  battleHintApplicable,
  markBattleHintSeen,
  markInstallNudgeShown,
  nudgeAllowed,
  shouldShowBattleHint,
  shouldShowInstallNudge,
} from '@/onboarding'
import { recordRunEnd } from '@/history'
import { newRun } from '@/engine'
import { PLAYER_CLASSES } from '@/data'

describe('first-battle hint', () => {
  beforeEach(() => localStorage.clear())

  it('shows only on a virgin profile', () => {
    expect(shouldShowBattleHint()).toBe(true)
    markBattleHintSeen()
    expect(shouldShowBattleHint()).toBe(false)
  })

  it('never shows to a player with run history', () => {
    recordRunEnd(newRun(PLAYER_CLASSES[0]), { won: false, floorReached: 3 })
    expect(shouldShowBattleHint()).toBe(false)
  })

  it('only applies to battles where a ▲ actually exists', () => {
    const pm = PLAYER_CLASSES.find((c) => c.id === 'pm')!
    // NORM-type Intern: every matchup is neutral — nothing to point at.
    expect(battleHintApplicable(pm.moves, ['normal'])).toBe(false)
    // Influence-type Recruiter: the PM's strategy move is super effective.
    expect(battleHintApplicable(pm.moves, ['influence'])).toBe(true)
  })
})

describe('install nudge frequency cap', () => {
  beforeEach(() => localStorage.clear())

  it('caps showings and enforces the cooldown', () => {
    const day = 24 * 60 * 60 * 1000
    const t0 = 100 * day

    expect(nudgeAllowed({ count: 0, last: 0 }, t0)).toBe(true)
    // Just shown: cooldown blocks.
    expect(nudgeAllowed({ count: 1, last: t0 }, t0 + day)).toBe(false)
    // Cooldown elapsed: one more showing allowed.
    expect(nudgeAllowed({ count: 1, last: t0 }, t0 + INSTALL_NUDGE_COOLDOWN_MS + 1)).toBe(true)
    // Cap reached: never again.
    expect(nudgeAllowed({ count: INSTALL_NUDGE_MAX, last: 0 }, t0 * 2)).toBe(false)
  })

  it('persists showings through storage', () => {
    const now = Date.now()
    markInstallNudgeShown(now)
    markInstallNudgeShown(now)
    // Cap of 2 reached — even far in the future the nudge stays quiet.
    // (jsdom has neither beforeinstallprompt nor iOS UA, so this exercises
    // the storage path via nudgeAllowed rather than shouldShowInstallNudge.)
    expect(shouldShowInstallNudge(now + INSTALL_NUDGE_COOLDOWN_MS * 10)).toBe(false)
  })
})
