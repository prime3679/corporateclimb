// ─── TREASURE FLOORS (The Supply Closet) ────────────────────
// The fourth elevator: a scheduled raid — standard fight, half the
// Stock Options payout, and a pick-1-of-3 supply cache after the win.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ALL_ITEM_IDS,
  ITEMS,
  TREASURE_CONSOLATION_OPTIONS,
  TREASURE_LOOT_CHOICES,
  TREASURE_PAYOUT_MULT,
} from '@/data'
import { PLAYER_CLASSES } from '@/data'
import {
  GameRng,
  MAX_INVENTORY,
  SAVE_KEY,
  advanceFloor,
  applyVictory,
  awardTreasureCache,
  chooseElevator,
  chooseMysteryFloor,
  chooseTreasureFloor,
  chooseTreasureLoot,
  elevatorPending,
  getVictoryPayout,
  loadRun,
  newRun,
  nextStop,
  rollTreasureLoot,
  treasureAvailable,
  treasureOffered,
  type RunState,
} from '@/engine'
import { newDailyRun } from '@/engine'
import type { ItemId } from '@/types'

const cls = PLAYER_CLASSES[0]

/** A normal run parked on a treasure-scheduled floor. */
function treasureRun(overrides: Partial<RunState> = {}): RunState {
  return { ...newRun(cls), floor: 6, ...overrides }
}

const CTX = { actPending: false, eventsDone: false }

describe('the schedule', () => {
  it('opens the closet on exactly one floor per act', () => {
    const open = Array.from({ length: 30 }, (_, f) => f).filter(treasureAvailable)
    expect(open).toEqual([6, 16, 26])
  })

  it('never opens on a boss floor or before the Executive Track', () => {
    for (const floor of [0, 4, 8, 9, 18, 19, 28, 29]) {
      expect(treasureAvailable(floor), `floor ${floor}`).toBe(false)
    }
  })
})

describe('the elevator pick', () => {
  it('commits the raid and clears the other doors', () => {
    let run = treasureRun({ eliteFloor: true })
    run = chooseTreasureFloor(run)
    expect(run.treasureFloor).toBe(true)
    expect(run.eliteFloor).toBe(false)
    expect(run.mystery).toBeNull()
    expect(elevatorPending(run)).toBe(false)
  })

  it('is a no-op off the schedule', () => {
    const run = { ...newRun(cls), floor: 7 }
    expect(chooseTreasureFloor(run)).toBe(run)
  })

  it('is cleared again by picking any other elevator', () => {
    const raided = chooseTreasureFloor(treasureRun())
    expect(chooseElevator(raided, false).treasureFloor).toBe(false)
    expect(chooseElevator(raided, true).treasureFloor).toBe(false)
    const rng = new GameRng(7)
    expect(chooseMysteryFloor(raided, rng.next).treasureFloor).toBe(false)
  })

  it('is withheld when a daily modifier disables items', () => {
    const daily = { ...newDailyRun(cls, new Date('2026-07-04')), floor: 6 }
    const mode = daily.mode as Extract<RunState['mode'], { kind: 'daily' }>
    const withItems = (enabled: boolean): RunState => ({
      ...daily,
      mode: { ...mode, modifier: { ...mode.modifier, itemsEnabled: enabled } },
    })
    expect(treasureOffered(withItems(true))).toBe(true)
    expect(treasureOffered(withItems(false))).toBe(false)
    expect(chooseTreasureFloor(withItems(false))).toEqual(withItems(false))
  })
})

describe('the payout skim', () => {
  it('halves the Stock Options payout on a raid', () => {
    const base = treasureRun()
    const raid = chooseTreasureFloor(base)
    const normal = applyVictory(base, 100).optionsGained
    const skimmed = applyVictory(raid, 100).optionsGained
    expect(normal).toBe(getVictoryPayout(6))
    expect(skimmed).toBe(Math.round(getVictoryPayout(6) * TREASURE_PAYOUT_MULT))
  })
})

describe('the cache', () => {
  it('rolls distinct, valid items', () => {
    const rng = new GameRng(42)
    const loot = rollTreasureLoot(rng.next)
    expect(loot).toHaveLength(TREASURE_LOOT_CHOICES)
    expect(new Set(loot).size).toBe(loot.length)
    for (const id of loot) expect(ITEMS[id]).toBeDefined()
  })

  it('rolls deterministically from the seed', () => {
    const a = rollTreasureLoot(new GameRng(1337).next)
    const b = rollTreasureLoot(new GameRng(1337).next)
    expect(a).toEqual(b)
  })

  it('is awarded only after a raid win, once', () => {
    const rng = new GameRng(5)
    const idle = awardTreasureCache(treasureRun(), rng.next)
    expect(idle.loot).toBeNull()
    expect(idle.run.treasureLoot).toBeNull()

    const raided = chooseTreasureFloor(treasureRun())
    const { run, loot } = awardTreasureCache(raided, rng.next)
    expect(loot).toHaveLength(TREASURE_LOOT_CHOICES)
    expect(run.treasureLoot).toEqual(loot)
    // A second award (e.g. a replayed handler) must not re-roll.
    expect(awardTreasureCache(run, rng.next).run).toBe(run)
  })

  it('survives the floor advance as a pending reward', () => {
    const raided = chooseTreasureFloor(treasureRun())
    const { run } = awardTreasureCache(raided, new GameRng(5).next)
    const advanced = advanceFloor(run, new GameRng(6).next)
    expect(advanced.treasureFloor).toBe(false)
    expect(advanced.treasureLoot).toEqual(run.treasureLoot)
    expect(nextStop(advanced, CTX)).toBe('treasure')
  })

  it('opens ahead of a pending promotion', () => {
    const run = treasureRun({
      treasureLoot: ['espresso'] as ItemId[],
      pendingPerkOffer: ['balanced_package'] as RunState['pendingPerkOffer'],
    })
    expect(nextStop(run, CTX)).toBe('treasure')
  })
})

describe('the pick', () => {
  const loot = rollTreasureLoot(new GameRng(9).next)

  it('takes an offered item into inventory', () => {
    const run = treasureRun({ treasureLoot: loot, inventory: [] })
    const { run: next, bonusOptions } = chooseTreasureLoot(run, loot[1])
    expect(next.inventory).toEqual([loot[1]])
    expect(next.treasureLoot).toBeNull()
    expect(bonusOptions).toBe(0)
  })

  it('pays petty cash for leaving it', () => {
    const run = treasureRun({ treasureLoot: loot, stockOptions: 10 })
    const { run: next, bonusOptions } = chooseTreasureLoot(run, null)
    expect(bonusOptions).toBe(TREASURE_CONSOLATION_OPTIONS)
    expect(next.stockOptions).toBe(10 + TREASURE_CONSOLATION_OPTIONS)
    expect(next.treasureLoot).toBeNull()
  })

  it('pays petty cash when pockets are full', () => {
    const inventory = ALL_ITEM_IDS.slice(0, MAX_INVENTORY)
    const run = treasureRun({ treasureLoot: loot, inventory, stockOptions: 0 })
    const { run: next, bonusOptions } = chooseTreasureLoot(run, loot[0])
    expect(next.inventory).toEqual(inventory)
    expect(bonusOptions).toBe(TREASURE_CONSOLATION_OPTIONS)
  })

  it('ignores a pick that was never offered', () => {
    const offered = loot.slice(0, 2)
    const notOffered = ALL_ITEM_IDS.find((id) => !offered.includes(id))!
    const run = treasureRun({ treasureLoot: offered })
    expect(chooseTreasureLoot(run, notOffered).run).toBe(run)
  })

  it('is a no-op with no cache pending', () => {
    const run = treasureRun()
    expect(chooseTreasureLoot(run, 'espresso').run).toBe(run)
  })
})

describe('save migration', () => {
  beforeEach(() => localStorage.clear())

  it('lifts a v7 save with no raid and no cache', () => {
    const { treasureFloor: _tf, treasureLoot: _tl, ...v7run } = newRun(cls)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 7, run: v7run }))
    const loaded = loadRun()
    expect(loaded).not.toBeNull()
    expect(loaded!.treasureFloor).toBe(false)
    expect(loaded!.treasureLoot).toBeNull()
  })

  it('round-trips a v8 save with a cache pending', () => {
    const run = treasureRun({ treasureLoot: ['espresso', 'pto_day'] as ItemId[] })
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 8, run }))
    expect(loadRun()!.treasureLoot).toEqual(['espresso', 'pto_day'])
  })

  it('rejects a save whose cache holds unknown items', () => {
    const run = treasureRun({ treasureLoot: ['company_car'] as unknown as ItemId[] })
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 8, run }))
    expect(loadRun()).toBeNull()
  })
})
