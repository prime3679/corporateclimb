import { describe, it, expect } from 'vitest';
import { getTypeMultiplier } from './data';

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
    // strategy is strong against execution and influence
    const result = getTypeMultiplier('strategy', ['execution']);
    expect(result).toEqual({ mult: 1.5, label: 'Super effective!' });
  });

  it('returns super effective multiplier when attacker is strong against multiple defender types', () => {
    // strategy is strong against execution and influence
    const result = getTypeMultiplier('strategy', ['execution', 'influence']);
    expect(result).toEqual({ mult: 1.5, label: 'Super effective!' });
  });

  it('returns not very effective multiplier when defender is strong against attacker type', () => {
    // strategy is strong against execution and influence, meaning execution is weak against strategy
    // In TYPE_STRONG:
    // execution: ["technical", "analytics"]
    // strategy: ["execution", "influence"] -> strategy strong vs execution, meaning execution attacking strategy is not effective.
    const result = getTypeMultiplier('execution', ['strategy']);
    expect(result).toEqual({ mult: 0.67, label: 'Not very effective...' });
  });

  it('returns not very effective multiplier when one of the defender types is strong against attacker type and the other is neutral', () => {
    // execution is weak against strategy (which is strong against execution)
    // normal is neutral
    const result = getTypeMultiplier('execution', ['strategy', 'normal']);
    expect(result).toEqual({ mult: 0.67, label: 'Not very effective...' });
  });

  it('returns neutral multiplier for mixed effectiveness (super effective and not very effective)', () => {
    // Let's test mixed case:
    // execution is strong against technical.
    // execution is weak against strategy (strategy is strong against execution).
    // if defender has both ['technical', 'strategy']:
    // superEffective = true (execution strong vs technical)
    // notEffective = true (strategy strong vs execution)
    const result = getTypeMultiplier('execution', ['technical', 'strategy']);
    expect(result).toEqual({ mult: 1, label: null });
  });

  it('returns neutral multiplier when neither super effective nor not effective', () => {
    // strategy vs analytics
    // strategy is strong against ["execution", "influence"]
    // analytics is strong against ["strategy", "execution"]
    // So strategy attacking analytics is not super effective.
    // But is it not very effective? analytics is strong against strategy. So it IS not very effective.
    // Let's find a completely neutral matchup:
    // technical: ["strategy", "influence"]
    // execution: ["technical", "analytics"]
    // technical attacking analytics?
    // technical strong vs strategy, influence (not analytics)
    // analytics strong vs strategy, execution (not technical)
    // So technical vs analytics is neutral.
    const result = getTypeMultiplier('technical', ['analytics']);
    expect(result).toEqual({ mult: 1, label: null });
  });
});
