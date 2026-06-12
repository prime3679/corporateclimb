import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAct,
  getTypeMultiplier,
  TYPE_STRONG,
  TYPE_COLORS,
  getPromotion,
  PERKS,
  PLAYER_CLASSES,
  PROMOTION_TRACKS,
  ENEMIES,
  ENEMY_POOLS,
  TOTAL_FLOORS,
  rollFloorEnemies,
  getFloorEnemy,
  saveGame,
  loadGame,
  clearSave,
  checkAchievements,
  getUnlockedAchievements,
  getBestNgPlus,
  saveBestNgPlus,
  SAVE_KEY,
} from '@/data'
import { getEffectivePlayer, scaleEnemyForNgPlus } from '@/engine'
import type { Enemy, PerkId, PlayerClass, SaveData } from '@/types'

// ─── getAct ──────────────────────────────────────────────────

describe('getAct', () => {
  it('returns act 1 for floors 0-9', () => {
    for (let f = 0; f < 10; f++) {
      expect(getAct(f)).toBe(1)
    }
  })

  it('returns act 2 for floors 10-19', () => {
    for (let f = 10; f < 20; f++) {
      expect(getAct(f)).toBe(2)
    }
  })

  it('returns act 3 for floors 20+', () => {
    expect(getAct(20)).toBe(3)
    expect(getAct(25)).toBe(3)
    expect(getAct(29)).toBe(3)
  })
})

// ─── getTypeMultiplier ───────────────────────────────────────

describe('getTypeMultiplier', () => {
  it('returns neutral multiplier for normal attack type', () => {
    expect(getTypeMultiplier('normal', ['execution'])).toEqual({ mult: 1, label: null })
  })

  it('returns super effective when attacker is strong against one defender type', () => {
    expect(getTypeMultiplier('strategy', ['execution'])).toEqual({
      mult: 1.5,
      label: 'Super effective!',
    })
  })

  it('returns super effective when attacker is strong against multiple defender types', () => {
    expect(getTypeMultiplier('strategy', ['execution', 'influence'])).toEqual({
      mult: 1.5,
      label: 'Super effective!',
    })
  })

  it('returns not very effective when defender resists attacker type', () => {
    expect(getTypeMultiplier('execution', ['strategy'])).toEqual({
      mult: 0.67,
      label: 'Not very effective...',
    })
  })

  it('returns not very effective for one weak + one neutral defender type', () => {
    expect(getTypeMultiplier('execution', ['strategy', 'normal'])).toEqual({
      mult: 0.67,
      label: 'Not very effective...',
    })
  })

  it('returns neutral for mixed effectiveness (cancels out)', () => {
    expect(getTypeMultiplier('execution', ['technical', 'strategy'])).toEqual({
      mult: 1,
      label: null,
    })
    // analytics is strong vs strategy, but influence resists analytics → cancels
    expect(getTypeMultiplier('analytics', ['strategy', 'influence'])).toEqual({
      mult: 1,
      label: null,
    })
  })

  it('returns neutral for a completely neutral matchup', () => {
    expect(getTypeMultiplier('technical', ['analytics'])).toEqual({ mult: 1, label: null })
  })

  it('every type in TYPE_STRONG has at least one super-effective target', () => {
    for (const [, targets] of Object.entries(TYPE_STRONG)) {
      expect(targets.size).toBeGreaterThan(0)
    }
  })
})

// ─── scaleEnemyForNgPlus ─────────────────────────────────────

describe('scaleEnemyForNgPlus', () => {
  const baseEnemy: Enemy = {
    floor: 1,
    name: 'Test Enemy',
    emoji: '👾',
    spriteId: 'boss',
    maxHp: 100,
    atk: 50,
    def: 25,
    types: ['normal'],
    moves: [
      { name: 'Attack 1', dmg: 20 },
      { name: 'Attack 2', dmg: 35, acc: 90 },
    ],
    phase2: {
      maxHp: 200,
      atk: 60,
      def: 30,
      moves: [{ name: 'Phase 2 Slam', dmg: 40 }],
      taunt: 'Round two!',
    },
    defeat: 'Oh no!',
    title: 'Tester',
  }

  it('returns the enemy unmodified when ngLevel <= 0', () => {
    expect(scaleEnemyForNgPlus(baseEnemy, 0)).toBe(baseEnemy)
    expect(scaleEnemyForNgPlus(baseEnemy, -1)).toBe(baseEnemy)
  })

  it('scales stats and move damage correctly for ngLevel 1', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1)
    // statMult = 1 + 1 * 0.3 = 1.3
    expect(result.maxHp).toBe(130)
    expect(result.atk).toBe(65)
    expect(result.def).toBe(33) // 25 * 1.3 = 32.5 → 33
    // dmgMult = 1 + 1 * 0.15 = 1.15
    expect(result.moves[0].dmg).toBe(23) // 20 * 1.15
    expect(result.moves[1].dmg).toBe(40) // 35 * 1.15 = 40.25 → 40
  })

  it('scales correctly for ngLevel 2', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 2)
    // statMult = 1.6, dmgMult = 1.3
    expect(result.maxHp).toBe(160)
    expect(result.atk).toBe(80)
    expect(result.def).toBe(40)
    expect(result.moves[0].dmg).toBe(26)
    expect(result.moves[1].dmg).toBe(46) // 35 * 1.3 = 45.5 → 46
  })

  it('preserves other properties unmodified', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1)
    expect(result.floor).toBe(baseEnemy.floor)
    expect(result.name).toBe(baseEnemy.name)
    expect(result.types).toEqual(baseEnemy.types)
    expect(result.moves[1].acc).toBe(baseEnemy.moves[1].acc)
  })

  it('does not mutate the original enemy', () => {
    const origHp = baseEnemy.maxHp
    const origDmg = baseEnemy.moves[0].dmg
    scaleEnemyForNgPlus(baseEnemy, 3)
    expect(baseEnemy.maxHp).toBe(origHp)
    expect(baseEnemy.moves[0].dmg).toBe(origDmg)
  })

  it('scales the phase 2 stats and move damage', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1)
    expect(result.phase2?.maxHp).toBe(260) // 200 * 1.3
    expect(result.phase2?.atk).toBe(78) // 60 * 1.3
    expect(result.phase2?.def).toBe(39) // 30 * 1.3
    expect(result.phase2?.moves[0].dmg).toBe(46) // 40 * 1.15 = 46
  })
})

// ─── getEffectivePlayer ──────────────────────────────────────

describe('getEffectivePlayer', () => {
  const pmBase = PLAYER_CLASSES.find((p) => p.id === 'pm')!

  it('returns unmodified base stats at floor 0', () => {
    const effective = getEffectivePlayer(pmBase, 'pm', 0)
    expect(effective.maxHp).toBe(pmBase.maxHp)
    expect(effective.atk).toBe(pmBase.atk)
    expect(effective.def).toBe(pmBase.def)
    expect(effective.moves).toEqual(pmBase.moves)
  })

  it('promotions no longer grant fixed stat boosts (perks replace them)', () => {
    const effective = getEffectivePlayer(pmBase, 'pm', 5)
    expect(effective.maxHp).toBe(pmBase.maxHp)
    expect(effective.atk).toBe(pmBase.atk)
    expect(effective.def).toBe(pmBase.def)
  })

  it('applies move upgrades at floor 10', () => {
    const effective = getEffectivePlayer(pmBase, 'pm', 10)
    expect(effective.moves.some((m) => m.name === 'Strategic Roadmap')).toBe(true)
    expect(effective.moves.some((m) => m.name === 'Prioritize Backlog')).toBe(false)
  })

  it('applies perk stat boosts (stacking repeatable packages)', () => {
    const effective = getEffectivePlayer(pmBase, 'pm', 5, [
      'gym_membership',
      'balanced_package',
      'balanced_package',
    ])
    const gym = PERKS.gym_membership.statBoost!
    const pkg = PERKS.balanced_package.statBoost!
    expect(effective.maxHp).toBe(pmBase.maxHp + gym.maxHp! + 2 * pkg.maxHp!)
    expect(effective.atk).toBe(pmBase.atk + 2 * pkg.atk!)
    expect(effective.def).toBe(pmBase.def + 2 * pkg.def!)
  })

  it('applies all move upgrades at max floor (Chief Product Officer)', () => {
    const effective = getEffectivePlayer(pmBase, 'pm', 25)
    expect(effective.moves.some((m) => m.name === 'Launch Platform')).toBe(true)
    expect(effective.moves.some((m) => m.name === 'Ship MVP')).toBe(false)
  })

  it('does not add a move upgrade if the base move is missing', () => {
    const missingMoveBase: PlayerClass = {
      ...pmBase,
      moves: pmBase.moves.filter((m) => m.name !== 'Prioritize Backlog'),
    }
    const effective = getEffectivePlayer(missingMoveBase, 'pm', 10)
    expect(effective.moves.some((m) => m.name === 'Strategic Roadmap')).toBe(false)
    expect(effective.moves.length).toBe(missingMoveBase.moves.length)
  })

  it('returns unmodified stats for an unknown classId', () => {
    const effective = getEffectivePlayer(pmBase, 'unknown_class', 30)
    expect(effective.maxHp).toBe(pmBase.maxHp)
    expect(effective.atk).toBe(pmBase.atk)
    expect(effective.def).toBe(pmBase.def)
  })

  it('does not mutate the base player', () => {
    const origHp = pmBase.maxHp
    getEffectivePlayer(pmBase, 'pm', 25)
    expect(pmBase.maxHp).toBe(origHp)
  })
})

// ─── getPromotion ────────────────────────────────────────────

describe('getPromotion', () => {
  it('returns base title at floor 0', () => {
    const promo = getPromotion('pm', 0)
    expect(promo?.title).toBe('Product Manager')
    expect(promo?.statBoost).toBeUndefined()
  })

  it('returns the correct tier at floor 10', () => {
    expect(getPromotion('pm', 10)?.title).toBe('Director of Product')
  })

  it('returns the highest tier at max floor', () => {
    expect(getPromotion('pm', 25)?.title).toBe('Chief Product Officer')
  })

  it('returns undefined for an unknown class', () => {
    expect(getPromotion('nonexistent', 20)).toBeUndefined()
  })
})

// ─── Floor generation ────────────────────────────────────────

describe('rollFloorEnemies', () => {
  it('returns an array matching ENEMY_POOLS length', () => {
    expect(rollFloorEnemies().length).toBe(ENEMY_POOLS.length)
  })

  it('returns valid enemy names from each pool', () => {
    rollFloorEnemies().forEach((name, i) => {
      const poolNames = ENEMY_POOLS[i].map((e) => e.name)
      expect(poolNames).toContain(name)
    })
  })
})

describe('getFloorEnemy', () => {
  it('returns the named enemy from the floor pool', () => {
    const pool = ENEMY_POOLS[0]
    expect(getFloorEnemy(0, pool[0].name).name).toBe(pool[0].name)
  })

  it('falls back to the first enemy if the name is not found', () => {
    const enemy = getFloorEnemy(0, 'Nonexistent Boss')
    expect(enemy).toBeDefined()
    expect(enemy.name).toBe(ENEMY_POOLS[0][0].name)
  })
})

// ─── Save / load game ────────────────────────────────────────

describe('save / load game', () => {
  const validSave: SaveData = {
    classId: PLAYER_CLASSES[0].id,
    floor: 5,
    level: 3,
    xp: 10,
    xpToNext: 100,
    playerHp: 80,
    playerPp: [10, 10, 5, 3],
    atkBuff: 0,
    defBuff: 0,
    usedEvents: [],
    inventory: [],
  }

  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns null when no save exists', () => {
    expect(loadGame()).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    localStorage.setItem(SAVE_KEY, 'invalid-json')
    expect(loadGame()).toBeNull()
  })

  it('returns null for an unknown classId', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validSave, classId: 'invalid_class' }))
    expect(loadGame()).toBeNull()
  })

  it('returns null for a negative floor', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validSave, floor: -1 }))
    expect(loadGame()).toBeNull()
  })

  it('returns null for floor >= ENEMY_POOLS length', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...validSave, floor: ENEMY_POOLS.length }))
    expect(loadGame()).toBeNull()
  })

  it('round-trips a valid save through saveGame/loadGame', () => {
    saveGame(validSave)
    expect(loadGame()).toEqual(validSave)
  })

  it('clearSave removes the save', () => {
    saveGame(validSave)
    clearSave()
    expect(loadGame()).toBeNull()
  })

  it('returns null if localStorage throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Access denied')
    })
    expect(loadGame()).toBeNull()
  })
})

// ─── NG+ persistence ─────────────────────────────────────────

describe('NG+ persistence', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to 0', () => {
    expect(getBestNgPlus()).toBe(0)
  })

  it('saves and retrieves the best NG+ level', () => {
    saveBestNgPlus(2)
    expect(getBestNgPlus()).toBe(2)
  })

  it('only saves if higher than the current best', () => {
    saveBestNgPlus(3)
    saveBestNgPlus(1)
    expect(getBestNgPlus()).toBe(3)
  })
})

// ─── checkAchievements ───────────────────────────────────────

describe('checkAchievements', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  const baseStats = {
    classId: 'pm',
    totalTurns: 100,
    totalDamageDealt: 1000,
    ngLevel: 0,
    itemsUsed: 5,
    finalHp: 50,
  }

  it('unlocks first_climb on first win and persists it', () => {
    const unlocked = checkAchievements(baseStats)
    expect(unlocked).toContain('first_climb')
    expect(getUnlockedAchievements().has('first_climb')).toBe(true)
  })

  it('unlocks triple_threat after 3 unique class wins', () => {
    checkAchievements({ ...baseStats, classId: 'pm' })
    expect(checkAchievements({ ...baseStats, classId: 'eng' })).not.toContain('triple_threat')
    expect(checkAchievements({ ...baseStats, classId: 'design' })).toContain('triple_threat')
  })

  // Each achievement at the exact threshold (unlocks) and one step past it (does not).
  it.each([
    { id: 'speed_runner', pass: { totalTurns: 50 }, fail: { totalTurns: 51 } },
    { id: 'iron_will', pass: { itemsUsed: 0 }, fail: { itemsUsed: 1 } },
    { id: 'glass_cannon', pass: { finalHp: 14 }, fail: { finalHp: 15 } },
    { id: 'ng_plus_1', pass: { ngLevel: 1 }, fail: { ngLevel: 0 } },
    { id: 'ng_plus_3', pass: { ngLevel: 3 }, fail: { ngLevel: 2 } },
    { id: 'damage_dealer', pass: { totalDamageDealt: 3000 }, fail: { totalDamageDealt: 2999 } },
    { id: 'diamond_hands', pass: { stockOptions: 250 }, fail: { stockOptions: 249 } },
    {
      id: 'hyperfocused',
      pass: { perks: ['gym_membership', 'gym_membership', 'gym_membership'] as PerkId[] },
      fail: { perks: ['gym_membership', 'gym_membership', 'balanced_package'] as PerkId[] },
    },
    {
      id: 'full_stack',
      pass: { perks: ['gym_membership', 'perfectionist', 'negotiator'] as PerkId[] },
      fail: { perks: ['gym_membership', 'perfectionist', 'morning_person'] as PerkId[] },
    },
  ])('unlocks $id at its boundary but not past it', ({ id, pass, fail }) => {
    expect(checkAchievements({ ...baseStats, ...pass })).toContain(id)
    localStorage.clear()
    expect(checkAchievements({ ...baseStats, ...fail })).not.toContain(id)
  })

  it('legacy callers without perk stats never see the perk achievements', () => {
    const unlocked = checkAchievements(baseStats)
    expect(unlocked).not.toContain('hyperfocused')
    expect(unlocked).not.toContain('diamond_hands')
    expect(unlocked).not.toContain('full_stack')
  })

  it('does not re-return already unlocked achievements', () => {
    const first = checkAchievements({ ...baseStats, totalTurns: 40 })
    expect(first).toContain('first_climb')
    expect(first).toContain('speed_runner')
    const second = checkAchievements({ ...baseStats, totalTurns: 30 })
    expect(second).not.toContain('first_climb')
    expect(second).not.toContain('speed_runner')
  })
})

// ─── Data integrity ──────────────────────────────────────────

describe('data integrity', () => {
  it('has exactly 3 player classes', () => {
    expect(PLAYER_CLASSES.length).toBe(3)
  })

  it('every player class has 4 moves', () => {
    for (const cls of PLAYER_CLASSES) {
      expect(cls.moves.length).toBe(4)
    }
  })

  it('every player class has a promotion track', () => {
    for (const cls of PLAYER_CLASSES) {
      expect(PROMOTION_TRACKS[cls.id]).toBeDefined()
      expect(PROMOTION_TRACKS[cls.id].length).toBeGreaterThan(0)
    }
  })

  it('ENEMY_POOLS covers all floors', () => {
    expect(ENEMY_POOLS.length).toBe(TOTAL_FLOORS)
  })

  it('every enemy pool has at least one enemy', () => {
    for (const pool of ENEMY_POOLS) {
      expect(pool.length).toBeGreaterThan(0)
    }
  })

  it('every enemy has at least one move', () => {
    for (const enemy of ENEMIES) {
      expect(enemy.moves.length).toBeGreaterThan(0)
    }
  })

  it('all class move types are valid', () => {
    const validTypes = new Set(Object.keys(TYPE_COLORS))
    for (const cls of PLAYER_CLASSES) {
      for (const move of cls.moves) {
        expect(validTypes.has(move.type)).toBe(true)
      }
    }
  })
})
