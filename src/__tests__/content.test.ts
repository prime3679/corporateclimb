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
  ALL_PERK_IDS,
  ALL_RELIC_IDS,
  CLASS_STARTING_ITEMS,
  ACHIEVEMENTS,
  PERKS,
  RELICS,
  STATUS_DEFS,
  TOTAL_FLOORS,
} from '@/data'
import { SHOP_FLOORS } from '@/engine'
import { buildSpriteUrls } from '@/sprites'
import type { Enemy, EnemyMove, Move, PerkKind } from '@/types'

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

  it('every item has a positive shop price and a non-empty effect', () => {
    for (const id of ALL_ITEM_IDS) {
      const item = ITEMS[id]
      expect(item.price, `item ${id}: price`).toBeGreaterThan(0)
      expect(Object.keys(item.effect).length, `item ${id}: effect`).toBeGreaterThan(0)
    }
  })

  it('item statuses reference real status defs', () => {
    for (const id of ALL_ITEM_IDS) {
      const { status, enemyStatus } = ITEMS[id].effect
      if (status) expect(STATUS_DEFS[status.id], `item ${id}: status`).toBeTruthy()
      if (enemyStatus) expect(STATUS_DEFS[enemyStatus.id], `item ${id}: enemyStatus`).toBeTruthy()
    }
  })

  it('achievements have unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('perks', () => {
  it('perk record keys match their ids', () => {
    for (const id of ALL_PERK_IDS) {
      expect(PERKS[id].id, `perk ${id}`).toBe(id)
    }
  })

  it('every offer category is non-empty and stat packages are repeatable', () => {
    const byKind = (k: PerkKind) => ALL_PERK_IDS.filter((id) => PERKS[id].kind === k)
    expect(byKind('stat').length).toBeGreaterThan(0)
    expect(byKind('passive').length).toBeGreaterThan(0)
    expect(byKind('economy').length).toBeGreaterThan(0)
    for (const id of byKind('stat')) {
      expect(PERKS[id].repeatable, `perk ${id}: stat packages stack`).toBe(true)
      expect(PERKS[id].statBoost, `perk ${id}: statBoost`).toBeTruthy()
    }
  })

  it('perk start-battle statuses reference real status defs', () => {
    for (const id of ALL_PERK_IDS) {
      const s = PERKS[id].startBattleStatus
      if (s) expect(STATUS_DEFS[s], `perk ${id}: status`).toBeTruthy()
    }
  })

  it('every perk has a name, desc, and icon', () => {
    for (const id of ALL_PERK_IDS) {
      expect(PERKS[id].name, `perk ${id}: name`).toBeTruthy()
      expect(PERKS[id].desc, `perk ${id}: desc`).toBeTruthy()
      expect(PERKS[id].icon, `perk ${id}: icon`).toBeTruthy()
    }
  })
})

describe('status symbols (relics)', () => {
  it('relic record keys match their ids and each has display fields', () => {
    for (const id of ALL_RELIC_IDS) {
      const relic = RELICS[id]
      expect(relic.id, `relic ${id}`).toBe(id)
      expect(relic.name, `relic ${id}: name`).toBeTruthy()
      expect(relic.desc, `relic ${id}: desc`).toBeTruthy()
      expect(relic.icon, `relic ${id}: icon`).toBeTruthy()
    }
  })

  it('every relic does something', () => {
    for (const id of ALL_RELIC_IDS) {
      const { statBoost, dmgMult, critBonus, postBattleHeal, payoutMult, priceMult, burnGuard } =
        RELICS[id]
      expect(
        Boolean(
          statBoost ||
          dmgMult ||
          critBonus ||
          postBattleHeal ||
          payoutMult ||
          priceMult ||
          burnGuard,
        ),
        `relic ${id}: effect`,
      ).toBe(true)
    }
  })

  it('unlock gates reference real achievements', () => {
    const achievementIds = new Set(ACHIEVEMENTS.map((a) => a.id))
    for (const id of ALL_RELIC_IDS) {
      const gate = RELICS[id].unlockedBy
      if (gate) expect(achievementIds.has(gate), `relic ${id}: unlockedBy`).toBe(true)
    }
    for (const id of ALL_PERK_IDS) {
      const gate = PERKS[id].unlockedBy
      if (gate) expect(achievementIds.has(gate), `perk ${id}: unlockedBy`).toBe(true)
    }
  })
})

// ─── COPY QUALITY (satire & delight) ────────────────────────
// The tables above keep the data honest; these keep the *voice*
// honest. A boss that concedes with the same "Fine." as four others,
// or an item that reads like a tooltip, drains the satire. These are
// the backstop for recycled jokes and robotic flavor.
describe('copy quality: satire & delight', () => {
  const stripLead = (s: string) => s.replace(/^[^a-zA-Z]+/, '')

  it('enemies do not recycle the same "Fine." capitulation button', () => {
    const offenders = [...ENEMIES, ...ALL_POOL_ENEMIES]
      .filter((e) => /^(fine|okay fine)\b/i.test(stripLead(e.defeat)))
      .map((e) => e.name)
    // One stock concession is a running gag; five is a rerun.
    expect(offenders, `recycled "Fine" defeats: ${offenders.join(', ')}`).toHaveLength(0)
  })

  it('every item description carries voice, not a robotic stat dump', () => {
    for (const id of ALL_ITEM_IDS) {
      // "Enemy is X (Y down)" reads like a debug string, not a barb.
      expect(ITEMS[id].desc, `item ${id}: robotic phrasing`).not.toMatch(/enemy is /i)
    }
  })

  it('no two items share an identical flavor or effect sentence', () => {
    const seen = new Map<string, string>()
    for (const id of ALL_ITEM_IDS) {
      const sentences = ITEMS[id].desc
        .split(/[.!?]+/)
        .map((s) =>
          s
            .replace(/[^a-z0-9% ]/gi, '')
            .trim()
            .toLowerCase(),
        )
        .filter((s) => s.length > 3)
      for (const s of sentences) {
        const prev = seen.get(s)
        expect(prev, `items ${prev} and ${id} both say "${s}"`).toBeUndefined()
        seen.set(s, id)
      }
    }
  })
})

describe('shop placement', () => {
  it('shop floors land mid-act on promotion floors (normal mode)', () => {
    const tiers = PROMOTION_TRACKS.pm.map((t) => t.floor)
    for (const f of SHOP_FLOORS.normal) {
      expect(f, `shop floor ${f} in range`).toBeLessThan(TOTAL_FLOORS)
      expect(tiers, `shop floor ${f} follows a promotion`).toContain(f)
    }
  })
})
