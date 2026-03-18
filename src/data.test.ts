import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTypeMultiplier,
  scaleEnemyForNgPlus,
  getEffectivePlayer,
  PLAYER_CLASSES,
  PROMOTION_TRACKS,
  checkAchievements,
  getUnlockedAchievements,
  loadGame,
  ENEMY_POOLS,
} from './data';
import type { Enemy, PlayerClass, SaveData } from './types';

// ─── getTypeMultiplier ──────────────────────────────────────────

describe('getTypeMultiplier', () => {
  it('returns neutral multiplier for normal attack type', () => {
    const result = getTypeMultiplier('normal', ['execution']);
    expect(result).toEqual({ mult: 1, label: null });
  });

  it('returns neutral multiplier for unknown attack type', () => {
    const result = getTypeMultiplier('unknown', ['execution']);
    expect(result).toEqual({ mult: 1, label: null });
  });

  it('returns super effective multiplier when attacker is strong against one defender type', () => {
    const result = getTypeMultiplier('strategy', ['execution']);
    expect(result).toEqual({ mult: 1.5, label: 'Super effective!' });
  });

  it('returns super effective multiplier when attacker is strong against multiple defender types', () => {
    const result = getTypeMultiplier('strategy', ['execution', 'influence']);
    expect(result).toEqual({ mult: 1.5, label: 'Super effective!' });
  });

  it('returns not very effective multiplier when defender is strong against attacker type', () => {
    const result = getTypeMultiplier('execution', ['strategy']);
    expect(result).toEqual({ mult: 0.67, label: 'Not very effective...' });
  });

  it('returns not very effective for one weak + one neutral defender type', () => {
    const result = getTypeMultiplier('execution', ['strategy', 'normal']);
    expect(result).toEqual({ mult: 0.67, label: 'Not very effective...' });
  });

  it('returns neutral multiplier for mixed effectiveness (cancels out)', () => {
    const result = getTypeMultiplier('execution', ['technical', 'strategy']);
    expect(result).toEqual({ mult: 1, label: null });
  });

  it('returns neutral multiplier for completely neutral matchup', () => {
    const result = getTypeMultiplier('technical', ['analytics']);
    expect(result).toEqual({ mult: 1, label: null });
  });
});

// ─── scaleEnemyForNgPlus ────────────────────────────────────────

describe('scaleEnemyForNgPlus', () => {
  const baseEnemy: Enemy = {
    floor: 1,
    name: 'Test Enemy',
    emoji: '👾',
    spriteId: 'sprite_1',
    maxHp: 100,
    atk: 50,
    def: 25,
    types: ['normal'],
    moves: [
      { name: 'Attack 1', dmg: 20 },
      { name: 'Attack 2', dmg: 35, acc: 90 },
    ],
    defeat: 'Oh no!',
    title: 'Tester',
  };

  it('returns the enemy unmodified when ngLevel <= 0', () => {
    expect(scaleEnemyForNgPlus(baseEnemy, 0)).toBe(baseEnemy);
    expect(scaleEnemyForNgPlus(baseEnemy, -1)).toBe(baseEnemy);
  });

  it('scales stats and move damage correctly for ngLevel 1', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1);
    // mult = 1 + 1 * 0.3 = 1.3
    expect(result.maxHp).toBe(130);
    expect(result.atk).toBe(65);
    expect(result.def).toBe(33); // 25 * 1.3 = 32.5 → 33
    // dmgMult = 1 + 1 * 0.15 = 1.15
    expect(result.moves[0].dmg).toBe(23); // 20 * 1.15
    expect(result.moves[1].dmg).toBe(40); // 35 * 1.15 = 40.25 → 40
  });

  it('scales correctly for ngLevel 2', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 2);
    // mult = 1.6, dmgMult = 1.3
    expect(result.maxHp).toBe(160);
    expect(result.atk).toBe(80);
    expect(result.def).toBe(40);
    expect(result.moves[0].dmg).toBe(26);
    expect(result.moves[1].dmg).toBe(46); // 35 * 1.3 = 45.5 → 46
  });

  it('preserves other properties unmodified', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1);
    expect(result.floor).toBe(baseEnemy.floor);
    expect(result.name).toBe(baseEnemy.name);
    expect(result.types).toEqual(baseEnemy.types);
    expect(result.moves[1].acc).toBe(baseEnemy.moves[1].acc);
  });
});

// ─── getEffectivePlayer ─────────────────────────────────────────

describe('getEffectivePlayer', () => {
  it('returns unmodified base stats at floor 0', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 0);
    expect(effective.maxHp).toBe(pmBase.maxHp);
    expect(effective.atk).toBe(pmBase.atk);
    expect(effective.def).toBe(pmBase.def);
    expect(effective.moves).toEqual(pmBase.moves);
  });

  it('applies stat boosts at floor 5 (Senior PM)', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 5);
    expect(effective.maxHp).toBe(pmBase.maxHp + 10);
    expect(effective.atk).toBe(pmBase.atk + 2);
    expect(effective.def).toBe(pmBase.def + 1);
  });

  it('applies cumulative boosts + move upgrades at floor 10', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 10);
    expect(effective.maxHp).toBe(pmBase.maxHp + 10 + 15);
    expect(effective.atk).toBe(pmBase.atk + 2 + 2);
    expect(effective.def).toBe(pmBase.def + 1 + 2);
    expect(effective.moves.some(m => m.name === 'Strategic Roadmap')).toBe(true);
    expect(effective.moves.some(m => m.name === 'Prioritize Backlog')).toBe(false);
  });

  it('applies all boosts at max floor (Chief Product Officer)', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 25);
    const track = PROMOTION_TRACKS['pm'];
    let expectedHp = pmBase.maxHp, expectedAtk = pmBase.atk, expectedDef = pmBase.def;
    for (const tier of track) {
      if (tier.statBoost) {
        expectedHp += tier.statBoost.maxHp || 0;
        expectedAtk += tier.statBoost.atk || 0;
        expectedDef += tier.statBoost.def || 0;
      }
    }
    expect(effective.maxHp).toBe(expectedHp);
    expect(effective.atk).toBe(expectedAtk);
    expect(effective.def).toBe(expectedDef);
    expect(effective.moves.some(m => m.name === 'Launch Platform')).toBe(true);
    expect(effective.moves.some(m => m.name === 'Ship MVP')).toBe(false);
  });

  it('does not add move upgrade if base move is missing', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const missingMoveBase: PlayerClass = {
      ...pmBase,
      moves: pmBase.moves.filter(m => m.name !== 'Prioritize Backlog'),
    };
    const effective = getEffectivePlayer(missingMoveBase, 'pm', 10);
    expect(effective.moves.some(m => m.name === 'Strategic Roadmap')).toBe(false);
    expect(effective.moves.length).toBe(missingMoveBase.moves.length);
  });

  it('returns unmodified stats for unknown classId', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'unknown_class', 30);
    expect(effective.maxHp).toBe(pmBase.maxHp);
    expect(effective.atk).toBe(pmBase.atk);
    expect(effective.def).toBe(pmBase.def);
  });
});

// ─── checkAchievements ──────────────────────────────────────────

describe('checkAchievements', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  const baseStats = {
    classId: 'intern',
    totalTurns: 100,
    totalDamageDealt: 1000,
    ngLevel: 0,
    itemsUsed: 5,
    finalHp: 50,
  };

  it('unlocks first_climb on first win', () => {
    const unlocked = checkAchievements(baseStats);
    expect(unlocked).toContain('first_climb');
    expect(getUnlockedAchievements().has('first_climb')).toBe(true);
  });

  it('unlocks triple_threat after 3 unique class wins', () => {
    checkAchievements({ ...baseStats, classId: 'intern' });
    const u2 = checkAchievements({ ...baseStats, classId: 'manager' });
    expect(u2).not.toContain('triple_threat');
    const u3 = checkAchievements({ ...baseStats, classId: 'ceo' });
    expect(u3).toContain('triple_threat');
  });

  it('unlocks speed_runner when totalTurns <= 50', () => {
    expect(checkAchievements({ ...baseStats, totalTurns: 50 })).toContain('speed_runner');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, totalTurns: 51 })).not.toContain('speed_runner');
  });

  it('unlocks iron_will when itemsUsed === 0', () => {
    expect(checkAchievements({ ...baseStats, itemsUsed: 0 })).toContain('iron_will');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, itemsUsed: 1 })).not.toContain('iron_will');
  });

  it('unlocks glass_cannon when finalHp < 15', () => {
    expect(checkAchievements({ ...baseStats, finalHp: 14 })).toContain('glass_cannon');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, finalHp: 15 })).not.toContain('glass_cannon');
  });

  it('unlocks ng_plus_1 when ngLevel >= 1', () => {
    expect(checkAchievements({ ...baseStats, ngLevel: 1 })).toContain('ng_plus_1');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, ngLevel: 0 })).not.toContain('ng_plus_1');
  });

  it('unlocks ng_plus_3 when ngLevel >= 3', () => {
    expect(checkAchievements({ ...baseStats, ngLevel: 3 })).toContain('ng_plus_3');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, ngLevel: 2 })).not.toContain('ng_plus_3');
  });

  it('unlocks damage_dealer when totalDamageDealt >= 3000', () => {
    expect(checkAchievements({ ...baseStats, totalDamageDealt: 3000 })).toContain('damage_dealer');
    localStorage.clear();
    expect(checkAchievements({ ...baseStats, totalDamageDealt: 2999 })).not.toContain('damage_dealer');
  });

  it('does not return already unlocked achievements', () => {
    const first = checkAchievements({ ...baseStats, totalTurns: 40 });
    expect(first).toContain('first_climb');
    expect(first).toContain('speed_runner');
    const second = checkAchievements({ ...baseStats, totalTurns: 30 });
    expect(second).not.toContain('first_climb');
    expect(second).not.toContain('speed_runner');
  });
});

// ─── loadGame ───────────────────────────────────────────────────

describe('loadGame', () => {
  const SAVE_KEY_INTERNAL = 'corporate-climb-save';
  afterEach(() => { localStorage.removeItem(SAVE_KEY_INTERNAL); });

  it('returns null when localStorage has no data', () => {
    localStorage.removeItem(SAVE_KEY_INTERNAL);
    expect(loadGame()).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem(SAVE_KEY_INTERNAL, 'invalid-json');
    expect(loadGame()).toBeNull();
  });

  it('returns null for unknown classId', () => {
    const data: SaveData = {
      classId: 'invalid_class', floor: 0, level: 1, xp: 0, xpToNext: 100,
      playerHp: 100, playerPp: [10, 10, 10, 10], atkBuff: 0, defBuff: 0,
      usedEvents: [], inventory: [],
    };
    localStorage.setItem(SAVE_KEY_INTERNAL, JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('returns null for negative floor', () => {
    const data: SaveData = {
      classId: PLAYER_CLASSES[0].id, floor: -1, level: 1, xp: 0, xpToNext: 100,
      playerHp: 100, playerPp: [10, 10, 10, 10], atkBuff: 0, defBuff: 0,
      usedEvents: [], inventory: [],
    };
    localStorage.setItem(SAVE_KEY_INTERNAL, JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('returns null for floor >= ENEMY_POOLS length', () => {
    const data: SaveData = {
      classId: PLAYER_CLASSES[0].id, floor: ENEMY_POOLS.length, level: 1, xp: 0, xpToNext: 100,
      playerHp: 100, playerPp: [10, 10, 10, 10], atkBuff: 0, defBuff: 0,
      usedEvents: [], inventory: [],
    };
    localStorage.setItem(SAVE_KEY_INTERNAL, JSON.stringify(data));
    expect(loadGame()).toBeNull();
  });

  it('returns valid save data', () => {
    const data: SaveData = {
      classId: PLAYER_CLASSES[0].id, floor: 5, level: 1, xp: 0, xpToNext: 100,
      playerHp: 100, playerPp: [10, 10, 10, 10], atkBuff: 0, defBuff: 0,
      usedEvents: [], inventory: [],
    };
    localStorage.setItem(SAVE_KEY_INTERNAL, JSON.stringify(data));
    expect(loadGame()).toEqual(data);
  });

  it('returns null if localStorage throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('Access denied'); });
    expect(loadGame()).toBeNull();
    vi.restoreAllMocks();
  });
});
