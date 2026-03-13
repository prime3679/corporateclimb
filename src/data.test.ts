import { describe, it, expect } from 'vitest';
import { scaleEnemyForNgPlus } from './data';
import type { Enemy } from './types';

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
      { name: 'Attack 2', dmg: 35, acc: 90 }
    ],
    defeat: 'Oh no!',
    title: 'Tester'
  };

  it('should return the enemy unmodified when ngLevel is <= 0', () => {
    const result0 = scaleEnemyForNgPlus(baseEnemy, 0);
    expect(result0).toBe(baseEnemy);

    const resultNeg = scaleEnemyForNgPlus(baseEnemy, -1);
    expect(resultNeg).toBe(baseEnemy);
  });

  it('should correctly scale stats and move damage when ngLevel is 1', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1);

    // mult = 1 + 1 * 0.3 = 1.3
    expect(result.maxHp).toBe(130);
    expect(result.atk).toBe(65);
    // 25 * 1.3 = 32.5, rounds to 33
    expect(result.def).toBe(33);

    // dmgMult = 1 + 1 * 0.15 = 1.15
    // 20 * 1.15 = 23
    expect(result.moves[0].dmg).toBe(23);
    // 35 * 1.15 = 40.25, rounds to 40
    expect(result.moves[1].dmg).toBe(40);
  });

  it('should correctly scale stats and move damage when ngLevel is 2', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 2);

    // mult = 1 + 2 * 0.3 = 1.6
    expect(result.maxHp).toBe(160);
    expect(result.atk).toBe(80);
    expect(result.def).toBe(40);

    // dmgMult = 1 + 2 * 0.15 = 1.3
    // 20 * 1.3 = 26
    expect(result.moves[0].dmg).toBe(26);
    // 35 * 1.3 = 45.5, rounds to 46
    expect(result.moves[1].dmg).toBe(46);
  });

  it('should preserve other properties unmodified', () => {
    const result = scaleEnemyForNgPlus(baseEnemy, 1);
    expect(result.floor).toBe(baseEnemy.floor);
    expect(result.name).toBe(baseEnemy.name);
    expect(result.emoji).toBe(baseEnemy.emoji);
    expect(result.spriteId).toBe(baseEnemy.spriteId);
    expect(result.types).toEqual(baseEnemy.types);
    expect(result.defeat).toBe(baseEnemy.defeat);
    expect(result.title).toBe(baseEnemy.title);

    // Preserve other move properties
    expect(result.moves[0].name).toBe(baseEnemy.moves[0].name);
    expect(result.moves[1].acc).toBe(baseEnemy.moves[1].acc);
  });
});
