import type { DailyModifier } from "./types";

/** Mulberry32 PRNG — deterministic, fast, good distribution */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Date → integer seed (YYYYMMDD) */
export function getDailySeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

// ─── MODIFIERS ──────────────────────────────────────────────

export const DAILY_MODIFIERS: DailyModifier[] = [
  {
    id: "crunch_time", name: "Crunch Time", desc: "Enemy ATK +50%. Your PP pools halved.", icon: "\u23F0",
    apply: (ctx) => { ctx.enemyAtkMult = 1.5; ctx.ppMult = 0.5; },
  },
  {
    id: "budget_cuts", name: "Budget Cuts", desc: "No items. No healing from events.", icon: "\u2702\uFE0F",
    apply: (ctx) => { ctx.itemsEnabled = false; ctx.eventsEnabled = false; },
  },
  {
    id: "all_hands", name: "All Hands", desc: "Enemies have +60% HP.", icon: "\uD83E\uDD1D",
    apply: (ctx) => { ctx.enemyHpMult = 1.6; },
  },
  {
    id: "performance_review", name: "Performance Review", desc: "Your DEF is halved.", icon: "\uD83D\uDCCB",
    apply: (ctx) => { ctx.playerDefMult = 0.5; },
  },
  {
    id: "death_march", name: "Death March", desc: "No hallway events. Just fights.", icon: "\uD83D\uDC80",
    apply: (ctx) => { ctx.eventsEnabled = false; },
  },
  {
    id: "scope_creep", name: "Scope Creep", desc: "Enemies have +40% HP and +30% ATK.", icon: "\uD83D\uDCC8",
    apply: (ctx) => { ctx.enemyHpMult = 1.4; ctx.enemyAtkMult = 1.3; },
  },
  {
    id: "reorg", name: "Reorg", desc: "Random class assigned. Adapt or die.", icon: "\uD83D\uDD00",
    apply: (ctx) => { ctx.assignedClassId = undefined; },
  },
];

/** Pick today's modifier deterministically from seed */
export function getDailyModifier(seed: number): DailyModifier {
  const rng = createSeededRandom(seed);
  const idx = Math.floor(rng() * DAILY_MODIFIERS.length);
  return DAILY_MODIFIERS[idx];
}
