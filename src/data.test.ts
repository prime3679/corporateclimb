import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadGame, PLAYER_CLASSES, ENEMY_POOLS } from './data';

describe('loadGame', () => {
  const SAVE_KEY = 'corporate-climb-save';

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when no data is found in localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    expect(loadGame()).toBeNull();
  });

  it('should return null when localStorage contains invalid JSON', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');
    expect(loadGame()).toBeNull();
  });

  it('should return null when classId does not exist in PLAYER_CLASSES', () => {
    const invalidData = {
      classId: 'invalid-class',
      floor: 0,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(invalidData));
    expect(loadGame()).toBeNull();
  });

  it('should return null when floor is negative', () => {
    const invalidData = {
      classId: PLAYER_CLASSES[0].id,
      floor: -1,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(invalidData));
    expect(loadGame()).toBeNull();
  });

  it('should return null when floor is greater than or equal to ENEMY_POOLS.length', () => {
    const invalidData = {
      classId: PLAYER_CLASSES[0].id,
      floor: ENEMY_POOLS.length,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(invalidData));
    expect(loadGame()).toBeNull();
  });

  it('should return parsed data when valid data is found', () => {
    const validData = {
      classId: PLAYER_CLASSES[0].id,
      floor: 0,
      hp: 10,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(validData));
    const result = loadGame();
    expect(result).toEqual(validData);
  });
});
