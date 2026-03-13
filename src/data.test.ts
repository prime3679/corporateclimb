import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkAchievements, getUnlockedAchievements, getClassWins } from './data';

describe('checkAchievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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

  it('unlocks triple_threat when 3 unique classes have been won with', () => {
    // Win with first class
    checkAchievements({ ...baseStats, classId: 'intern' });

    // Win with second class
    const unlocked2 = checkAchievements({ ...baseStats, classId: 'manager' });
    expect(unlocked2).not.toContain('triple_threat');

    // Win with third class
    const unlocked3 = checkAchievements({ ...baseStats, classId: 'ceo' });
    expect(unlocked3).toContain('triple_threat');
    expect(getUnlockedAchievements().has('triple_threat')).toBe(true);
  });

  it('unlocks speed_runner when totalTurns <= 50', () => {
    const unlocked = checkAchievements({ ...baseStats, totalTurns: 50 });
    expect(unlocked).toContain('speed_runner');
    expect(getUnlockedAchievements().has('speed_runner')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, totalTurns: 51 });
    expect(notUnlocked).not.toContain('speed_runner');
  });

  it('unlocks iron_will when itemsUsed === 0', () => {
    const unlocked = checkAchievements({ ...baseStats, itemsUsed: 0 });
    expect(unlocked).toContain('iron_will');
    expect(getUnlockedAchievements().has('iron_will')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, itemsUsed: 1 });
    expect(notUnlocked).not.toContain('iron_will');
  });

  it('unlocks glass_cannon when finalHp < 15', () => {
    const unlocked = checkAchievements({ ...baseStats, finalHp: 14 });
    expect(unlocked).toContain('glass_cannon');
    expect(getUnlockedAchievements().has('glass_cannon')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, finalHp: 15 });
    expect(notUnlocked).not.toContain('glass_cannon');
  });

  it('unlocks ng_plus_1 when ngLevel >= 1', () => {
    const unlocked = checkAchievements({ ...baseStats, ngLevel: 1 });
    expect(unlocked).toContain('ng_plus_1');
    expect(getUnlockedAchievements().has('ng_plus_1')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, ngLevel: 0 });
    expect(notUnlocked).not.toContain('ng_plus_1');
  });

  it('unlocks ng_plus_3 when ngLevel >= 3', () => {
    const unlocked = checkAchievements({ ...baseStats, ngLevel: 3 });
    expect(unlocked).toContain('ng_plus_3');
    expect(getUnlockedAchievements().has('ng_plus_3')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, ngLevel: 2 });
    expect(notUnlocked).not.toContain('ng_plus_3');
  });

  it('unlocks damage_dealer when totalDamageDealt >= 3000', () => {
    const unlocked = checkAchievements({ ...baseStats, totalDamageDealt: 3000 });
    expect(unlocked).toContain('damage_dealer');
    expect(getUnlockedAchievements().has('damage_dealer')).toBe(true);

    localStorage.clear();

    const notUnlocked = checkAchievements({ ...baseStats, totalDamageDealt: 2999 });
    expect(notUnlocked).not.toContain('damage_dealer');
  });

  it('does not return already unlocked achievements', () => {
    const firstRun = checkAchievements({ ...baseStats, totalTurns: 40 });
    expect(firstRun).toContain('first_climb');
    expect(firstRun).toContain('speed_runner');

    const secondRun = checkAchievements({ ...baseStats, totalTurns: 30 });
    expect(secondRun).not.toContain('first_climb');
    expect(secondRun).not.toContain('speed_runner');
  });

  it('can unlock multiple achievements at once', () => {
    const unlocked = checkAchievements({
      classId: 'intern',
      totalTurns: 40,        // unlocks speed_runner
      itemsUsed: 0,          // unlocks iron_will
      finalHp: 10,           // unlocks glass_cannon
      ngLevel: 3,            // unlocks ng_plus_1 and ng_plus_3
      totalDamageDealt: 3500 // unlocks damage_dealer
    });

    expect(unlocked).toEqual([
      'first_climb',
      'speed_runner',
      'iron_will',
      'glass_cannon',
      'ng_plus_1',
      'ng_plus_3',
      'damage_dealer'
    ]);
  });
});
