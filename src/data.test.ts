import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadGame, ENEMY_POOLS, PLAYER_CLASSES } from './data';
import type { SaveData } from './types';

const SAVE_KEY = "corporate-climb-save";

describe('loadGame', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when localStorage has no data', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const result = loadGame();
    expect(result).toBeNull();
    expect(localStorage.getItem).toHaveBeenCalledWith(SAVE_KEY);
  });

  it('should return null when data is invalid JSON', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json');
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('should return null when classId is not found', () => {
    const invalidClassData: SaveData = {
      classId: 'invalid_class',
      floor: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      playerHp: 100,
      playerPp: [10, 10, 10, 10],
      atkBuff: 0,
      defBuff: 0,
      usedEvents: [],
      inventory: []
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(invalidClassData));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('should return null when floor is less than 0', () => {
    const invalidFloorData: SaveData = {
      classId: PLAYER_CLASSES[0].id,
      floor: -1,
      level: 1,
      xp: 0,
      xpToNext: 100,
      playerHp: 100,
      playerPp: [10, 10, 10, 10],
      atkBuff: 0,
      defBuff: 0,
      usedEvents: [],
      inventory: []
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(invalidFloorData));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('should return null when floor is greater than or equal to ENEMY_POOLS length', () => {
    const invalidFloorData: SaveData = {
      classId: PLAYER_CLASSES[0].id,
      floor: ENEMY_POOLS.length,
      level: 1,
      xp: 0,
      xpToNext: 100,
      playerHp: 100,
      playerPp: [10, 10, 10, 10],
      atkBuff: 0,
      defBuff: 0,
      usedEvents: [],
      inventory: []
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(invalidFloorData));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('should return valid data when everything is perfectly valid', () => {
    const validData: SaveData = {
      classId: PLAYER_CLASSES[0].id,
      floor: 5,
      level: 1,
      xp: 0,
      xpToNext: 100,
      playerHp: 100,
      playerPp: [10, 10, 10, 10],
      atkBuff: 0,
      defBuff: 0,
      usedEvents: [],
      inventory: []
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(validData));
    const result = loadGame();
    expect(result).toEqual(validData);
  });

  it('should return null if accessing localStorage throws an error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });
    const result = loadGame();
    expect(result).toBeNull();
  });
});
