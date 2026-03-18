import { describe, it, expect, beforeEach } from "vitest";
import {
  getAct,
  getTypeMultiplier,
  TYPE_STRONG,
  PLAYER_CLASSES,
  ENEMIES,
  ENEMY_POOLS,
  TOTAL_FLOORS,
  getPromotion,
  getEffectivePlayer,
  PROMOTION_TRACKS,
  scaleEnemyForNgPlus,
  rollFloorEnemies,
  getFloorEnemy,
  saveGame,
  loadGame,
  clearSave,
  checkAchievements,
  getBestNgPlus,
  saveBestNgPlus,
} from "../data";
import type { SaveData } from "../types";

// ─── getAct ─────────────────────────────────────────────────

describe("getAct", () => {
  it("returns act 1 for floors 0-9", () => {
    for (let f = 0; f < 10; f++) {
      expect(getAct(f)).toBe(1);
    }
  });

  it("returns act 2 for floors 10-19", () => {
    for (let f = 10; f < 20; f++) {
      expect(getAct(f)).toBe(2);
    }
  });

  it("returns act 3 for floors 20+", () => {
    expect(getAct(20)).toBe(3);
    expect(getAct(25)).toBe(3);
    expect(getAct(29)).toBe(3);
  });
});

// ─── Type System ────────────────────────────────────────────

describe("getTypeMultiplier", () => {
  it("normal type is always neutral", () => {
    const result = getTypeMultiplier("normal", ["strategy"]);
    expect(result.mult).toBe(1);
    expect(result.label).toBeNull();
  });

  it("super effective matchups deal 1.5x", () => {
    // strategy beats execution
    const result = getTypeMultiplier("strategy", ["execution"]);
    expect(result.mult).toBe(1.5);
    expect(result.label).toBe("Super effective!");
  });

  it("not very effective matchups deal 0.67x", () => {
    // execution is weak against strategy (strategy beats execution, so execution attacking strategy is resisted)
    const result = getTypeMultiplier("execution", ["strategy"]);
    expect(result.mult).toBe(0.67);
    expect(result.label).toBe("Not very effective...");
  });

  it("neutral when no type advantage", () => {
    const result = getTypeMultiplier("strategy", ["normal"]);
    expect(result.mult).toBe(1);
    expect(result.label).toBeNull();
  });

  it("cancels out when both super and not effective (dual-type)", () => {
    // strategy is super effective vs execution, but execution resists strategy
    // Find a dual-type defender where attacker is both strong and weak
    // analytics beats strategy and execution. If defender has [strategy, influence]:
    // analytics strong vs strategy (yes), but influence strong vs analytics (yes)
    const result = getTypeMultiplier("analytics", ["strategy", "influence"]);
    expect(result.mult).toBe(1);
    expect(result.label).toBeNull();
  });

  it("every type in TYPE_STRONG has at least one super-effective target", () => {
    for (const [_type, targets] of Object.entries(TYPE_STRONG)) {
      expect(targets.size).toBeGreaterThan(0);
    }
  });
});

// ─── Promotions ─────────────────────────────────────────────

describe("getPromotion", () => {
  it("returns base title at floor 0", () => {
    const promo = getPromotion("pm", 0);
    expect(promo.title).toBe("Product Manager");
    expect(promo.statBoost).toBeUndefined();
  });

  it("returns correct tier at floor 10", () => {
    const promo = getPromotion("pm", 10);
    expect(promo.title).toBe("Director of Product");
  });

  it("returns highest tier at max floor", () => {
    const promo = getPromotion("pm", 25);
    expect(promo.title).toBe("Chief Product Officer");
  });

  it("returns base for unknown class", () => {
    const promo = getPromotion("nonexistent", 20);
    expect(promo).toBeUndefined();
  });
});

describe("getEffectivePlayer", () => {
  const pm = PLAYER_CLASSES.find(c => c.id === "pm")!;

  it("returns base stats at floor 0", () => {
    const effective = getEffectivePlayer(pm, "pm", 0);
    expect(effective.maxHp).toBe(pm.maxHp);
    expect(effective.atk).toBe(pm.atk);
  });

  it("accumulates stat boosts through promotions", () => {
    const effective = getEffectivePlayer(pm, "pm", 25);
    expect(effective.maxHp).toBeGreaterThan(pm.maxHp);
    expect(effective.atk).toBeGreaterThan(pm.atk);
    expect(effective.def).toBeGreaterThan(pm.def);
  });

  it("upgrades moves at promotion tiers", () => {
    const effective = getEffectivePlayer(pm, "pm", 10);
    const hasUpgrade = effective.moves.some(m => m.name === "Strategic Roadmap");
    expect(hasUpgrade).toBe(true);
    const hasOriginal = effective.moves.some(m => m.name === "Prioritize Backlog");
    expect(hasOriginal).toBe(false);
  });

  it("does not mutate base player", () => {
    const origHp = pm.maxHp;
    getEffectivePlayer(pm, "pm", 25);
    expect(pm.maxHp).toBe(origHp);
  });
});

// ─── Enemy Scaling ──────────────────────────────────────────

describe("scaleEnemyForNgPlus", () => {
  const baseEnemy = ENEMIES[0]; // Intern

  it("returns unchanged enemy at NG+0", () => {
    const scaled = scaleEnemyForNgPlus(baseEnemy, 0);
    expect(scaled.maxHp).toBe(baseEnemy.maxHp);
    expect(scaled.atk).toBe(baseEnemy.atk);
  });

  it("scales HP/ATK/DEF by 30% per NG+ level", () => {
    const scaled = scaleEnemyForNgPlus(baseEnemy, 1);
    expect(scaled.maxHp).toBe(Math.round(baseEnemy.maxHp * 1.3));
    expect(scaled.atk).toBe(Math.round(baseEnemy.atk * 1.3));
    expect(scaled.def).toBe(Math.round(baseEnemy.def * 1.3));
  });

  it("scales move damage by 15% per NG+ level", () => {
    const scaled = scaleEnemyForNgPlus(baseEnemy, 2);
    const origDmg = baseEnemy.moves[0].dmg;
    expect(scaled.moves[0].dmg).toBe(Math.round(origDmg * 1.3));
  });

  it("does not mutate original enemy", () => {
    const origHp = baseEnemy.maxHp;
    scaleEnemyForNgPlus(baseEnemy, 3);
    expect(baseEnemy.maxHp).toBe(origHp);
  });
});

// ─── Floor Generation ───────────────────────────────────────

describe("rollFloorEnemies", () => {
  it("returns an array matching ENEMY_POOLS length", () => {
    const names = rollFloorEnemies();
    expect(names.length).toBe(ENEMY_POOLS.length);
  });

  it("returns valid enemy names from each pool", () => {
    const names = rollFloorEnemies();
    names.forEach((name, i) => {
      const poolNames = ENEMY_POOLS[i].map(e => e.name);
      expect(poolNames).toContain(name);
    });
  });
});

describe("getFloorEnemy", () => {
  it("returns the named enemy from the floor pool", () => {
    const pool = ENEMY_POOLS[0];
    const enemy = getFloorEnemy(0, pool[0].name);
    expect(enemy.name).toBe(pool[0].name);
  });

  it("falls back to first enemy if name not found", () => {
    const enemy = getFloorEnemy(0, "Nonexistent Boss");
    expect(enemy).toBeDefined();
    expect(enemy.name).toBe(ENEMY_POOLS[0][0].name);
  });
});

// ─── Save System ────────────────────────────────────────────

describe("save/load game", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips save data", () => {
    const data = { classId: "pm", floor: 5, hp: 80, enemyNames: ["Intern"], pp: [10, 10, 5, 3], inventory: [], totalTurns: 20, totalDamageDealt: 500, itemsUsed: 0, ngLevel: 0 };
    saveGame(data as unknown as SaveData);
    const loaded = loadGame();
    expect(loaded).toEqual(data);
  });

  it("returns null when no save exists", () => {
    expect(loadGame()).toBeNull();
  });

  it("returns null for invalid class", () => {
    const data = { classId: "invalid_class", floor: 5, hp: 80, enemyNames: [], pp: [], inventory: [], totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0, ngLevel: 0 };
    saveGame(data as unknown as SaveData);
    expect(loadGame()).toBeNull();
  });

  it("clearSave removes the save", () => {
    const data = { classId: "pm", floor: 0, hp: 100, enemyNames: [], pp: [], inventory: [], totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0, ngLevel: 0 };
    saveGame(data as unknown as SaveData);
    clearSave();
    expect(loadGame()).toBeNull();
  });
});

// ─── NG+ Persistence ────────────────────────────────────────

describe("NG+ persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 0", () => {
    expect(getBestNgPlus()).toBe(0);
  });

  it("saves and retrieves best NG+ level", () => {
    saveBestNgPlus(2);
    expect(getBestNgPlus()).toBe(2);
  });

  it("only saves if higher than current best", () => {
    saveBestNgPlus(3);
    saveBestNgPlus(1);
    expect(getBestNgPlus()).toBe(3);
  });
});

// ─── Achievements ───────────────────────────────────────────

describe("checkAchievements", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("always unlocks first_climb on first win", () => {
    const unlocked = checkAchievements({
      classId: "pm", totalTurns: 100, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 5, finalHp: 50,
    });
    expect(unlocked).toContain("first_climb");
  });

  it("unlocks speed_runner for ≤50 turns", () => {
    const unlocked = checkAchievements({
      classId: "pm", totalTurns: 45, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 0, finalHp: 50,
    });
    expect(unlocked).toContain("speed_runner");
  });

  it("unlocks iron_will for zero items used", () => {
    const unlocked = checkAchievements({
      classId: "pm", totalTurns: 100, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 0, finalHp: 50,
    });
    expect(unlocked).toContain("iron_will");
  });

  it("unlocks glass_cannon for <15 HP", () => {
    const unlocked = checkAchievements({
      classId: "pm", totalTurns: 100, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 0, finalHp: 5,
    });
    expect(unlocked).toContain("glass_cannon");
  });

  it("unlocks damage_dealer for 3000+ damage", () => {
    const unlocked = checkAchievements({
      classId: "pm", totalTurns: 100, totalDamageDealt: 3500,
      ngLevel: 0, itemsUsed: 0, finalHp: 50,
    });
    expect(unlocked).toContain("damage_dealer");
  });

  it("does not double-unlock achievements", () => {
    checkAchievements({
      classId: "pm", totalTurns: 45, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 0, finalHp: 50,
    });
    const second = checkAchievements({
      classId: "eng", totalTurns: 45, totalDamageDealt: 1000,
      ngLevel: 0, itemsUsed: 0, finalHp: 50,
    });
    expect(second).not.toContain("first_climb");
    expect(second).not.toContain("speed_runner");
  });
});

// ─── Data Integrity ─────────────────────────────────────────

describe("data integrity", () => {
  it("has exactly 3 player classes", () => {
    expect(PLAYER_CLASSES.length).toBe(3);
  });

  it("every player class has 4 moves", () => {
    for (const cls of PLAYER_CLASSES) {
      expect(cls.moves.length).toBe(4);
    }
  });

  it("every player class has a promotion track", () => {
    for (const cls of PLAYER_CLASSES) {
      expect(PROMOTION_TRACKS[cls.id]).toBeDefined();
      expect(PROMOTION_TRACKS[cls.id].length).toBeGreaterThan(0);
    }
  });

  it("ENEMY_POOLS covers all floors", () => {
    expect(ENEMY_POOLS.length).toBe(TOTAL_FLOORS);
  });

  it("every enemy pool has at least one enemy", () => {
    ENEMY_POOLS.forEach((pool, _i) => {
      expect(pool.length).toBeGreaterThan(0);
    });
  });

  it("every enemy has at least one move", () => {
    for (const enemy of ENEMIES) {
      expect(enemy.moves.length).toBeGreaterThan(0);
    }
  });

  it("all move types are valid", () => {
    const validTypes = new Set(["strategy", "influence", "execution", "analytics", "technical", "normal"]);
    for (const cls of PLAYER_CLASSES) {
      for (const move of cls.moves) {
        expect(validTypes.has(move.type)).toBe(true);
      }
    }
  });
});
