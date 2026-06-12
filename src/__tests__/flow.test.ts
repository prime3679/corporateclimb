// ─── BETWEEN-FLOOR FLOW RESOLVER ────────────────────────────
// One function decides the interstitial order for every caller
// (victory continue, perk pick, shop leave, save resume). These tests
// pin the order and the per-stop entry conditions.

import { describe, it, expect } from 'vitest'
import { ENEMY_POOLS, PLAYER_CLASSES } from '@/data'
import {
  elevatorPending,
  eventsEnabled,
  newDailyRun,
  newRun,
  nextStop,
  type RunState,
} from '@/engine'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    ...newRun(PM),
    floorEnemyIds: ENEMY_POOLS.map((pool) => pool[0].name),
    ...overrides,
  }
}

const fresh = { actPending: false, eventsDone: false }

describe('nextStop ordering', () => {
  it('promotion outranks everything', () => {
    const run = makeRun({
      floor: 5,
      pendingPerkOffer: ['gym_membership', 'perfectionist', 'negotiator'],
      shopStock: ['espresso'],
    })
    expect(nextStop(run, { actPending: true, eventsDone: false })).toBe('promotion')
  })

  it('shop comes after the perk pick, before the act transition', () => {
    const run = makeRun({ floor: 5, shopStock: ['espresso'] })
    expect(nextStop(run, { actPending: true, eventsDone: false })).toBe('shop')
  })

  it('act transition precedes the hallway events', () => {
    expect(nextStop(makeRun({ floor: 10 }), { actPending: true, eventsDone: false })).toBe(
      'actTransition',
    )
  })

  it('events precede the elevator; the elevator precedes the intro', () => {
    const run = makeRun({ floor: 6 })
    expect(nextStop(run, fresh)).toBe('routeChoice')
    expect(nextStop(run, { actPending: false, eventsDone: true })).toBe('elevator')
    expect(nextStop({ ...run, eliteFloor: true }, { actPending: false, eventsDone: true })).toBe(
      'floorIntro',
    )
    expect(nextStop({ ...run, mystery: 'windfall' }, { actPending: false, eventsDone: true })).toBe(
      'floorIntro',
    )
  })

  it('floors without an elevator go straight to the intro after events', () => {
    expect(nextStop(makeRun({ floor: 2 }), { actPending: false, eventsDone: true })).toBe(
      'floorIntro',
    )
    expect(nextStop(makeRun({ floor: 9 }), { actPending: false, eventsDone: true })).toBe(
      'floorIntro',
    )
  })
})

describe('daily modifier handling', () => {
  it('skips the route choice when a modifier disables events', () => {
    const daily = newDailyRun(PM, new Date('2026-06-12T12:00:00'))
    if (daily.mode.kind !== 'daily') throw new Error('expected daily')
    const noEvents = {
      ...daily,
      floor: 6,
      mode: { ...daily.mode, modifier: { ...daily.mode.modifier, eventsEnabled: false } },
    }
    expect(eventsEnabled(noEvents)).toBe(false)
    expect(nextStop(noEvents, fresh)).toBe('elevator')
  })
})

describe('save resume (eventsDone semantics)', () => {
  it('resumes pending choices first, then the unpicked elevator', () => {
    const resume = { actPending: false, eventsDone: true }
    expect(
      nextStop(
        makeRun({ floor: 5, pendingPerkOffer: ['gym_membership', 'perfectionist', 'negotiator'] }),
        resume,
      ),
    ).toBe('promotion')
    expect(nextStop(makeRun({ floor: 5, shopStock: ['espresso'] }), resume)).toBe('shop')
    expect(nextStop(makeRun({ floor: 5 }), resume)).toBe('elevator')
    expect(elevatorPending(makeRun({ floor: 5 }))).toBe(true)
    expect(nextStop(makeRun({ floor: 5, eliteFloor: true }), resume)).toBe('floorIntro')
  })
})
