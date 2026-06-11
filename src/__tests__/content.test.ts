// ─── CONTENT VALIDATION ──────────────────────────────────────
// Exhaustive checks over the content tables in data.ts. Typos in
// content (a sprite id that doesn't resolve, a promotion upgrading a
// move that doesn't exist) compile fine where the type system can't
// reach, so this suite is the backstop that keeps the tables honest.

import { describe, it, expect } from 'vitest'
import {
  PLAYER_CLASSES,
  PROMOTION_TRACKS,
  ENEMIES,
  ENEMY_POOLS,
  HALLWAY_EVENTS,
  ITEMS,
  ALL_ITEM_IDS,
  CLASS_STARTING_ITEMS,
  ACHIEVEMENTS,
  TOTAL_FLOORS,
} from '@/data'
import { buildSpriteUrls } from '@/sprites'
import type { Enemy, EnemyMove, Move } from '@/types'

const SPRITES = buildSpriteUrls()
const ALL_POOL_ENEMIES: Enemy[] = ENEMY_POOLS.flat()

function checkMoveNumbers(owner: string, m: Move | EnemyMove) {
  expect(m.dmg, `${owner} / ${m.name}: dmg`).toBeGreaterThanOrEqual(0)
  if (m.acc != null) {
    expect(m.acc, `${owner} / ${m.name}: acc`).toBeGreaterThan(0)
    expect(m.acc, `${owner} / ${m.name}: acc`).toBeLessThanOrEqual(100)
  }
  if (m.status?.chance != null) {
    expect(m.status.chance, `${owner} / ${m.name}: status chance`).toBeGreaterThan(0)
    expect(m.status.chance, `${owner} / ${m.name}: status chance`).toBeLessThanOrEqual(1)
  }
}

describe('player classes', () => {
  it('have unique ids', () => {
    const ids = PLAYER_CLASSES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every sprite id resolves to an asset', () => {
    for (const c of PLAYER_CLASSES) {
      expect(SPRITES[c.spriteId], `${c.id}: sprite ${c.spriteId}`).toBeTruthy()
    }
  })

  it('moves have positive PP and sane numbers', () => {
    for (const c of PLAYER_CLASSES) {
      expect(c.moves.length, `${c.id}: move count`).toBe(4)
      for (const m of c.moves) {
        expect(m.pp, `${c.id} / ${m.name}: pp`).toBeGreaterThan(0)
        checkMoveNumbers(c.id, m)
      }
    }
  })

  it('every class has a starting item that exists', () => {
    for (const c of PLAYER_CLASSES) {
      const item = CLASS_STARTING_ITEMS[c.id]
      expect(item, `${c.id}: starting item`).toBeTruthy()
      expect(ITEMS[item], `${c.id}: starting item def`).toBeTruthy()
    }
  })
})

describe('promotion tracks', () => {
  it('every class has a track with ascending floors', () => {
    for (const c of PLAYER_CLASSES) {
      const track = PROMOTION_TRACKS[c.id]
      expect(track?.length, `${c.id}: track`).toBeGreaterThan(0)
      for (let i = 1; i < track.length; i++) {
        expect(track[i].floor, `${c.id}: tier ${i} floor order`).toBeGreaterThan(track[i - 1].floor)
      }
    }
  })

  it('every move upgrade replaces a move that exists at that point', () => {
    for (const c of PLAYER_CLASSES) {
      // Replay upgrades in floor order against the evolving move set,
      // exactly as getEffectivePlayer applies them.
      const names = c.moves.map((m) => m.name)
      for (const tier of PROMOTION_TRACKS[c.id]) {
        for (const up of tier.moveUpgrades ?? []) {
          const idx = names.indexOf(up.fromName)
          expect(idx, `${c.id} @ floor ${tier.floor}: upgrades "${up.fromName}"`).toBeGreaterThan(
            -1,
          )
          names[idx] = up.to.name
          checkMoveNumbers(`${c.id} promo @ ${tier.floor}`, up.to)
        }
      }
    }
  })
})

describe('enemies', () => {
  it('there is a pool for every floor and none are empty', () => {
    expect(ENEMY_POOLS.length).toBe(TOTAL_FLOORS)
    ENEMY_POOLS.forEach((pool, i) => {
      expect(pool.length, `floor ${i}: pool`).toBeGreaterThan(0)
    })
  })

  it('enemy names are unique within a pool (names are the save key)', () => {
    ENEMY_POOLS.forEach((pool, i) => {
      const names = pool.map((e) => e.name)
      expect(new Set(names).size, `floor ${i}: duplicate names`).toBe(names.length)
    })
  })

  it('every enemy sprite id resolves to an asset', () => {
    for (const e of [...ENEMIES, ...ALL_POOL_ENEMIES]) {
      expect(SPRITES[e.spriteId], `${e.name}: sprite ${e.spriteId}`).toBeTruthy()
    }
  })

  it('enemy stats and moves are sane', () => {
    for (const e of ALL_POOL_ENEMIES) {
      expect(e.maxHp, `${e.name}: maxHp`).toBeGreaterThan(0)
      expect(e.moves.length, `${e.name}: moves`).toBeGreaterThan(0)
      for (const m of e.moves) checkMoveNumbers(e.name, m)
      if (e.phase2) {
        expect(e.phase2.maxHp, `${e.name}: phase2 maxHp`).toBeGreaterThan(0)
        expect(e.phase2.moves.length, `${e.name}: phase2 moves`).toBeGreaterThan(0)
        for (const m of e.phase2.moves) checkMoveNumbers(`${e.name} (p2)`, m)
      }
    }
  })
})

describe('hallway events', () => {
  it('have unique ids and at least two choices with result text', () => {
    const ids = HALLWAY_EVENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of HALLWAY_EVENTS) {
      expect(e.choices.length, `${e.id}: choices`).toBeGreaterThanOrEqual(2)
      for (const c of e.choices) {
        expect(c.result, `${e.id} / "${c.label}": result text`).toBeTruthy()
      }
    }
  })
})

describe('items and achievements', () => {
  it('item record keys match their ids and ALL_ITEM_IDS covers them', () => {
    for (const id of ALL_ITEM_IDS) {
      expect(ITEMS[id].id, `item ${id}`).toBe(id)
    }
    expect(ALL_ITEM_IDS.length).toBe(Object.keys(ITEMS).length)
  })

  it('achievements have unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
