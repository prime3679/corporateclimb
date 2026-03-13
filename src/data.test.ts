import { describe, it, expect } from 'vitest';
import { getEffectivePlayer, PLAYER_CLASSES, PROMOTION_TRACKS } from './data';
import type { PlayerClass } from './types';

describe('getEffectivePlayer', () => {
  it('should return unmodified base stats at floor 0', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 0);

    expect(effective.maxHp).toBe(pmBase.maxHp);
    expect(effective.atk).toBe(pmBase.atk);
    expect(effective.def).toBe(pmBase.def);
    expect(effective.moves).toEqual(pmBase.moves);
  });

  it('should apply stat boosts correctly for floor 5 (Senior PM)', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 5);

    expect(effective.maxHp).toBe(pmBase.maxHp + 10);
    expect(effective.atk).toBe(pmBase.atk + 2);
    expect(effective.def).toBe(pmBase.def + 1);
  });

  it('should apply stat boosts correctly for floor 10 (Director of Product) and apply move upgrades', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 10);

    // Accumulated stats from floor 5 and floor 10
    expect(effective.maxHp).toBe(pmBase.maxHp + 10 + 15);
    expect(effective.atk).toBe(pmBase.atk + 2 + 2);
    expect(effective.def).toBe(pmBase.def + 1 + 2);

    // "Prioritize Backlog" should be upgraded to "Strategic Roadmap"
    const hasPrioritizeBacklog = effective.moves.some(m => m.name === 'Prioritize Backlog');
    const hasStrategicRoadmap = effective.moves.some(m => m.name === 'Strategic Roadmap');

    expect(hasPrioritizeBacklog).toBe(false);
    expect(hasStrategicRoadmap).toBe(true);
    const updatedMove = effective.moves.find(m => m.name === 'Strategic Roadmap')!;
    expect(updatedMove.dmg).toBe(24);
  });

  it('should apply all cumulative boosts correctly for max floor (Chief Product Officer)', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'pm', 25);

    // Summing all stats from PROMOTION_TRACKS['pm']
    const track = PROMOTION_TRACKS['pm'];
    let expectedMaxHp = pmBase.maxHp;
    let expectedAtk = pmBase.atk;
    let expectedDef = pmBase.def;

    for (const tier of track) {
      if (tier.statBoost) {
        expectedMaxHp += tier.statBoost.maxHp || 0;
        expectedAtk += tier.statBoost.atk || 0;
        expectedDef += tier.statBoost.def || 0;
      }
    }

    expect(effective.maxHp).toBe(expectedMaxHp);
    expect(effective.atk).toBe(expectedAtk);
    expect(effective.def).toBe(expectedDef);

    // Check move upgrades: "Ship MVP" -> "Launch Platform" (at floor 20)
    const hasShipMvp = effective.moves.some(m => m.name === 'Ship MVP');
    const hasLaunchPlatform = effective.moves.some(m => m.name === 'Launch Platform');

    expect(hasShipMvp).toBe(false);
    expect(hasLaunchPlatform).toBe(true);
  });

  it('should not upgrade a move if the original move is missing from the base moves', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    // Create a base without "Prioritize Backlog"
    const missingMoveBase: PlayerClass = {
      ...pmBase,
      moves: pmBase.moves.filter(m => m.name !== 'Prioritize Backlog')
    };

    const effective = getEffectivePlayer(missingMoveBase, 'pm', 10);

    // "Strategic Roadmap" should not be added because "Prioritize Backlog" was not found
    const hasStrategicRoadmap = effective.moves.some(m => m.name === 'Strategic Roadmap');
    expect(hasStrategicRoadmap).toBe(false);
    // Ensure we didn't accidentally add "undefined" or something else to moves list
    expect(effective.moves.length).toBe(missingMoveBase.moves.length);
  });

  it('should return unmodified base stats if the classId is not found in PROMOTION_TRACKS', () => {
    const pmBase = PLAYER_CLASSES.find(p => p.id === 'pm')!;
    const effective = getEffectivePlayer(pmBase, 'unknown_class', 30);

    expect(effective.maxHp).toBe(pmBase.maxHp);
    expect(effective.atk).toBe(pmBase.atk);
    expect(effective.def).toBe(pmBase.def);
    expect(effective.moves).toEqual(pmBase.moves);
  });
});
