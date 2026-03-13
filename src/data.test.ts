import { describe, it, expect } from 'vitest';
import { getAct } from './data';

describe('getAct', () => {
  it('should return Act 1 for floors below 10', () => {
    expect(getAct(0)).toBe(1);
    expect(getAct(1)).toBe(1);
    expect(getAct(5)).toBe(1);
    expect(getAct(9)).toBe(1);
  });

  it('should return Act 2 for floors 10 to 19', () => {
    expect(getAct(10)).toBe(2);
    expect(getAct(15)).toBe(2);
    expect(getAct(19)).toBe(2);
  });

  it('should return Act 3 for floors 20 and above', () => {
    expect(getAct(20)).toBe(3);
    expect(getAct(25)).toBe(3);
    expect(getAct(30)).toBe(3);
    expect(getAct(100)).toBe(3);
  });
});
