import type { StatusId, StatusDef, PlayerClass, Enemy, HallwayEvent, MoveType, ItemId, ItemDef } from "./types";

// ─── STATUS DEFINITIONS ─────────────────────────────────────
export const STATUS_DEFS: Record<StatusId, StatusDef> = {
  motivated:     { id: "motivated",     name: "Motivated",     icon: "\u{1F525}", color: "#FF6F00", duration: 3, desc: "+ATK" },
  focused:       { id: "focused",       name: "Focused",       icon: "\u{1F3AF}", color: "#7B1FA2", duration: 3, desc: "+Crit" },
  caffeinated:   { id: "caffeinated",   name: "Caffeinated",   icon: "\u2615",    color: "#4E342E", duration: 3, desc: "+SPD -DEF" },
  micromanaged:  { id: "micromanaged",  name: "Micromanaged",  icon: "\u{1F441}\uFE0F",  color: "#B71C1C", duration: 2, desc: "-ATK" },
  demoralized:   { id: "demoralized",   name: "Demoralized",   icon: "\u{1F4C9}", color: "#4A148C", duration: 2, desc: "-DEF" },
  burned_out:    { id: "burned_out",    name: "Burned Out",    icon: "\u{1F6AB}", color: "#616161", duration: 3, desc: "DoT" },
};

// ─── TYPE SYSTEM ─────────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  strategy: "#E53935",
  influence: "#7B1FA2",
  execution: "#FF6F00",
  analytics: "#1565C0",
  technical: "#2E7D32",
  normal: "#616161",
};

export const TYPE_LABELS: Record<string, string> = {
  strategy: "STRAT",
  influence: "INFL",
  execution: "EXEC",
  analytics: "DATA",
  technical: "TECH",
  normal: "NORM",
};

// Type effectiveness: attacker type → set of types it's super effective against
export const TYPE_STRONG: Record<string, Set<string>> = {
  strategy:  new Set(["execution", "influence"]),
  execution: new Set(["technical", "analytics"]),
  technical: new Set(["strategy", "influence"]),
  analytics: new Set(["strategy", "execution"]),
  influence: new Set(["execution", "analytics"]),
};

export function getTypeMultiplier(atkType: string, defTypes: string[]): { mult: number; label: string | null } {
  if (atkType === "normal" || !TYPE_STRONG[atkType]) return { mult: 1, label: null };
  const strong = TYPE_STRONG[atkType];
  const superEffective = defTypes.some(t => strong.has(t));
  const notEffective = defTypes.some(t => TYPE_STRONG[t]?.has(atkType));
  if (superEffective && !notEffective) return { mult: 1.5, label: "Super effective!" };
  if (notEffective && !superEffective) return { mult: 0.67, label: "Not very effective..." };
  return { mult: 1, label: null };
}

// ─── PLAYER CLASSES ──────────────────────────────────────────
export const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: "pm",
    name: "Product Manager",
    emoji: "📋",
    spriteId: "product_manager",
    maxHp: 100,
    atk: 14,
    def: 10,
    spd: 12,
    types: ["strategy", "influence"],
    desc: "Balances roadmaps and stakeholders. High versatility.",
    moves: [
      { name: "Prioritize Backlog", dmg: 18, type: "strategy", desc: "Ruthlessly cuts scope. Hits hard.", pp: 15, status: { id: "focused", target: "self", chance: 0.4 } },
      { name: "Stakeholder Align", dmg: 12, type: "influence", desc: "Forces agreement through sheer will.", pp: 20, heal: 8, status: { id: "motivated", target: "self" } },
      { name: "Ship MVP", dmg: 28, type: "execution", desc: "80/20 strikes. Maximum impact.", pp: 8 },
      { name: "Data-Driven Roast", dmg: 35, type: "analytics", desc: "Destroys arguments with metrics.", pp: 5, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
    ],
  },
  {
    id: "eng",
    name: "Senior Engineer",
    emoji: "\u2328\uFE0F",
    spriteId: "eng",
    maxHp: 90,
    atk: 18,
    def: 8,
    spd: 14,
    types: ["technical", "execution"],
    desc: "Writes code and rewrites everything else. Glass cannon.",
    moves: [
      { name: "Refactor Everything", dmg: 22, type: "technical", desc: "Rewrites the opponent from scratch.", pp: 12, status: { id: "motivated", target: "self", chance: 0.4 } },
      { name: "Deploy to Prod", dmg: 30, type: "execution", desc: "YOLO push on Friday. Risky but devastating.", pp: 8, status: { id: "caffeinated", target: "self" } },
      { name: "Code Review Reject", dmg: 15, type: "technical", desc: "Nit-picks until they give up.", pp: 20, status: { id: "micromanaged", target: "enemy" } },
      { name: "Stack Overflow", dmg: 40, type: "analytics", desc: "Channels the collective wisdom. Huge damage.", pp: 4 },
    ],
  },
  {
    id: "design",
    name: "UX Designer",
    emoji: "🎨",
    spriteId: "design",
    maxHp: 85,
    atk: 12,
    def: 12,
    spd: 16,
    types: ["analytics", "technical"],
    desc: "Sees what others can't. Fast and balanced.",
    moves: [
      { name: "Pixel Perfect Punch", dmg: 20, type: "execution", desc: "That 1px misalignment? Fixed violently.", pp: 15, status: { id: "focused", target: "self", chance: 0.3 } },
      { name: "User Research Beam", dmg: 16, type: "analytics", desc: "\u201CActually, users said\u2026\u201D", pp: 18, heal: 6, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Figma Tornado", dmg: 26, type: "technical", desc: "200 frames of animated fury.", pp: 10 },
      { name: "Design System Slam", dmg: 38, type: "strategy", desc: "Enforces consistency. Crushing blow.", pp: 4, status: { id: "motivated", target: "self", chance: 0.5 } },
    ],
  },
];

// ─── ENEMIES ─────────────────────────────────────────────────
export const ENEMIES: Enemy[] = [
  {
    floor: 1, name: "Intern", emoji: "🥤", spriteId: "intern", maxHp: 50, atk: 6, def: 4, types: ["normal"] as MoveType[],
    moves: [{ name: "Eager Question", dmg: 8, type: "normal" as MoveType }, { name: "Coffee Run", dmg: 5, type: "normal" as MoveType, heal: 10 }],
    defeat: "The intern learned a valuable lesson today.",
    title: "THE EAGER INTERN",
  },
  {
    floor: 2, name: "Recruiter", emoji: "📞", spriteId: "recruiter", maxHp: 65, atk: 9, def: 5, types: ["influence"] as MoveType[],
    moves: [{ name: "LinkedIn Spam", dmg: 10, type: "influence" as MoveType }, { name: "Lowball Offer", dmg: 14, type: "strategy" as MoveType }],
    defeat: "\u201CLet\u2019s circle back when you have more budget.\u201D",
    title: "THE PERSISTENT RECRUITER",
  },
  {
    floor: 3, name: "The Overachiever", emoji: "🏆", spriteId: "overachiever", maxHp: 75, atk: 11, def: 6, types: ["execution"] as MoveType[],
    moves: [{ name: "Humble Brag", dmg: 14, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } }, { name: "Extra Credit", dmg: 18, type: "execution" as MoveType }, { name: "Volunteer as Tribute", dmg: 10, type: "strategy" as MoveType, heal: 12, status: { id: "motivated", target: "self" } }],
    defeat: "\"I guess even 110% wasn't enough today.\"",
    title: "THE OVERACHIEVER",
  },
  {
    floor: 4, name: "Scrum Master", emoji: "📝", spriteId: "scrum", maxHp: 80, atk: 10, def: 8, types: ["strategy", "execution"] as MoveType[],
    moves: [{ name: "Standup Ambush", dmg: 12, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy" } }, { name: "Sprint Overload", dmg: 16, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } }, { name: "Retro Guilt Trip", dmg: 10, type: "influence" as MoveType, heal: 8 }],
    defeat: "The daily standup has been cancelled. Forever.",
    title: "THE RELENTLESS SCRUM MASTER",
  },
  {
    floor: 5, name: "Middle Manager", emoji: "👔", spriteId: "manager", maxHp: 100, atk: 12, def: 10, types: ["influence", "strategy"] as MoveType[],
    moves: [{ name: "Unnecessary Meeting", dmg: 14, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Passive-Aggressive Email", dmg: 18, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "Take Credit", dmg: 8, type: "influence" as MoveType, heal: 15, status: { id: "motivated", target: "self" } }],
    defeat: "\u201CPer my last email\u2026 I resign.\u201D",
    title: "THE MIDDLE MANAGER",
  },
  {
    floor: 6, name: "VP of Synergy", emoji: "🎯", spriteId: "vp", maxHp: 130, atk: 15, def: 12, types: ["influence", "analytics"] as MoveType[],
    moves: [{ name: "Buzzword Barrage", dmg: 16, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.6 } }, { name: "Pivot Strategy", dmg: 22, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } }, { name: "Executive Presence", dmg: 12, type: "influence" as MoveType, heal: 12, status: { id: "motivated", target: "self" } }],
    defeat: "Synergy has been disrupted. The paradigm shifts.",
    title: "THE VP OF SYNERGY",
  },
  {
    floor: 7, name: "C-Suite Boss", emoji: "👑", spriteId: "boss", maxHp: 180, atk: 20, def: 15, types: ["strategy", "influence"] as MoveType[],
    moves: [{ name: "Golden Parachute", dmg: 10, type: "strategy" as MoveType, heal: 25, status: { id: "motivated", target: "self" } }, { name: "Hostile Takeover", dmg: 28, type: "execution" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.6 } }, { name: "Board Meeting Beam", dmg: 35, type: "analytics" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Layoff Wave", dmg: 22, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } }],
    defeat: "The corner office is yours. Was it worth it?",
    title: "THE C-SUITE FINAL BOSS",
  },
];

// ─── HALLWAY EVENTS ──────────────────────────────────────────
export const HALLWAY_EVENTS: HallwayEvent[] = [
  {
    id: "coffee_machine",
    title: "BREAK ROOM",
    desc: "You stumble upon an unattended coffee machine. The good stuff \u2014 not that instant garbage.",
    emoji: "\u2615",
    choices: [
      { label: "Grab a double shot", effect: { hp: 25 }, result: "The caffeine hits immediately. You feel alive again.", isGood: true },
      { label: "Take the whole pot", effect: { hp: 40, def: -1 }, result: "You chug the entire pot. Jittery but ENERGIZED. Your hands won't stop shaking though.", isGood: true },
      { label: "Pass \u2014 stay focused", effect: { atk: 1 }, result: "Discipline over comfort. Your resolve strengthens.", isGood: true },
    ],
  },
  {
    id: "office_gossip",
    title: "WATER COOLER",
    desc: "Two VPs are whispering by the water cooler. You could eavesdrop and learn about your next opponent...",
    emoji: "\uD83D\uDDE3\uFE0F",
    choices: [
      { label: "Eavesdrop carefully", effect: { atk: 2 }, result: "You overhear their weaknesses. Knowledge is power.", isGood: true },
      { label: "Join the conversation", effect: { def: 1, hp: -10 }, result: "They rope you into a 20-minute chat about golf. Draining, but they like you now.", isGood: true },
      { label: "Walk past quickly", effect: { hp: 10 }, result: "You avoid the drama. Peace of mind is its own reward.", isGood: true },
    ],
  },
  {
    id: "sensitivity_training",
    title: "MANDATORY TRAINING",
    desc: "HR ambushes you. \"We need you for a quick sensitivity training. It'll only take an hour.\"",
    emoji: "\uD83D\uDCCB",
    choices: [
      { label: "Attend willingly", effect: { def: 2, hp: -15 }, result: "It was NOT quick. But you learned about \"psychological safety\" which is... something.", isGood: true },
      { label: "Fake a meeting conflict", effect: { atk: 1 }, result: "\"Sorry, syncing with stakeholders!\" You dodge it smoothly. Confidence boost.", isGood: true },
      { label: "Actually engage", effect: { def: 3, hp: -20, ppRestore: 2 }, result: "You genuinely participate. HR is shocked. You feel weirdly refreshed.", isGood: true },
    ],
  },
  {
    id: "supply_closet",
    title: "SUPPLY CLOSET",
    desc: "The supply closet is unlocked. Inside: premium sticky notes, a Red Bull, and someone's hidden snack stash.",
    emoji: "\uD83D\uDCE6",
    choices: [
      { label: "Grab the Red Bull", effect: { hp: 30, atk: 1 }, result: "Wings acquired. You feel unstoppable (for about 45 minutes).", isGood: true },
      { label: "Raid the snack stash", effect: { hp: 20, ppRestore: 3 }, result: "Trail mix, protein bars, and... is that a full sleeve of Oreos? Jackpot.", isGood: true },
      { label: "Take the sticky notes", effect: { def: 2 }, result: "Premium 3M Super Sticky notes. Your organizational armor is now impenetrable.", isGood: true },
    ],
  },
  {
    id: "elevator_pitch",
    title: "ELEVATOR ENCOUNTER",
    desc: "You're stuck in the elevator with the CEO for 30 floors. They look at you expectantly.",
    emoji: "\uD83D\uDEBB",
    choices: [
      { label: "Pitch your idea", effect: { atk: 3, hp: -15 }, result: "\"Interesting. Send me a deck.\" Your heart is POUNDING but your confidence soars.", isGood: true },
      { label: "Make small talk", effect: { def: 1, hp: 10 }, result: "\"Nice weather, right?\" The CEO smiles. You survive. That's a win.", isGood: true },
      { label: "Stare at your phone", effect: { hp: -5 }, result: "The CEO notices. Noted. Literally \u2014 they wrote something down.", isGood: false },
    ],
  },
  {
    id: "printer_jam",
    title: "PRINTER CRISIS",
    desc: "The printer is jammed. A line of 6 people is forming. You're the only one who might know how to fix it.",
    emoji: "\uD83D\uDDA8\uFE0F",
    choices: [
      { label: "Fix it heroically", effect: { atk: 2, def: 1 }, result: "You clear the jam. The crowd applauds. You are now the Office Hero.", isGood: true },
      { label: "Pretend you didn't see", effect: { hp: 5 }, result: "Not your problem. You slip away with your sanity intact.", isGood: true },
      { label: "Kick it", effect: { atk: 3, hp: -10 }, result: "It... actually works? The printer whirs to life. Your foot hurts but respect is earned.", isGood: true },
    ],
  },
  {
    id: "birthday_cake",
    title: "BIRTHDAY PARTY",
    desc: "Someone you barely know is having a birthday in the break room. There's cake.",
    emoji: "\uD83C\uDF82",
    choices: [
      { label: "Eat cake, sing along", effect: { hp: 35, ppRestore: 2 }, result: "The cake is surprisingly good. Costco sheet cake never disappoints.", isGood: true },
      { label: "Take cake, skip singing", effect: { hp: 20 }, result: "You ninja a corner piece and disappear. Efficient.", isGood: true },
      { label: "Skip it entirely", effect: { atk: 1 }, result: "\"Too busy crushing it.\" You channel the grind energy.", isGood: true },
    ],
  },
  {
    id: "it_ticket",
    title: "IT HELP DESK",
    desc: "The IT desk has one spot open. You could get your laptop looked at \u2014 it's been running slow.",
    emoji: "\uD83D\uDCBB",
    choices: [
      { label: "Get a RAM upgrade", effect: { atk: 2, def: 1 }, result: "16GB \u2192 32GB. Your machine (and your mind) runs faster.", isGood: true },
      { label: "Clear the bloatware", effect: { ppRestore: 4 }, result: "They remove 14 startup programs. Everything feels fresh.", isGood: true },
      { label: "\"It's fine, actually\"", effect: { hp: 5 }, result: "You walk away. The slow laptop builds character. Allegedly.", isGood: true },
    ],
  },
];

// ─── ITEMS ───────────────────────────────────────────────────
export const ITEMS: Record<ItemId, ItemDef> = {
  espresso: {
    id: "espresso", name: "Espresso Shot", emoji: "\u2615",
    desc: "Instant energy. Restores 30 HP.",
    effect: { hp: 30 },
  },
  linkedin_endorsement: {
    id: "linkedin_endorsement", name: "LinkedIn Endorsement", emoji: "\uD83D\uDC4D",
    desc: "Someone endorsed you for \"Leadership\". +3 ATK this battle.",
    effect: { atk: 3 },
  },
  mentors_advice: {
    id: "mentors_advice", name: "Mentor's Advice", emoji: "\uD83E\uDDD1\u200D\uD83C\uDFEB",
    desc: "\"Play to your strengths.\" Grants Focused status.",
    effect: { status: { id: "focused", target: "self" } },
  },
  networking_card: {
    id: "networking_card", name: "Networking Card", emoji: "\uD83D\uDCBC",
    desc: "A powerful connection. +3 DEF this battle.",
    effect: { def: 3 },
  },
  pto_day: {
    id: "pto_day", name: "PTO Day", emoji: "\uD83C\uDFD6\uFE0F",
    desc: "Take a mental health day. Restores 50 HP.",
    effect: { hp: 50 },
  },
  side_hustle: {
    id: "side_hustle", name: "Side Hustle", emoji: "\uD83D\uDCB0",
    desc: "Extra income = extra confidence. Restores all PP.",
    effect: { ppRestore: 99 },
  },
};

export const ALL_ITEM_IDS: ItemId[] = Object.keys(ITEMS) as ItemId[];

// Starting item per class
export const CLASS_STARTING_ITEMS: Record<string, ItemId> = {
  pm: "networking_card",
  eng: "espresso",
  design: "mentors_advice",
};

// ─── ENEMY VARIANTS (per floor) ──────────────────────────────
// Each floor has a pool of enemies; one is randomly selected per run.
// Floors 6-7 are fixed (VP + C-Suite).
export const ENEMY_POOLS: Enemy[][] = [
  // Floor 1
  [
    ENEMIES[0], // Intern
    {
      floor: 1, name: "The Coffee Runner", emoji: "\u2615", spriteId: "intern", maxHp: 45, atk: 5, def: 6, types: ["normal"] as MoveType[],
      moves: [{ name: "Latte Splash", dmg: 10, type: "normal" as MoveType }, { name: "Oat Milk Shield", dmg: 4, type: "normal" as MoveType, heal: 12 }],
      defeat: "\"I just wanted to get the order right...\"",
      title: "THE COFFEE RUNNER",
    },
  ],
  // Floor 2
  [
    ENEMIES[1], // Recruiter
    {
      floor: 2, name: "The Ghosting Recruiter", emoji: "\uD83D\uDC7B", spriteId: "recruiter", maxHp: 60, atk: 10, def: 4, types: ["influence"] as MoveType[],
      moves: [{ name: "Read Receipt", dmg: 12, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "\"We'll Be In Touch\"", dmg: 8, type: "strategy" as MoveType }],
      defeat: "\"Let me check with my hiring manager and get back to you. (They won't.)\"",
      title: "THE GHOSTING RECRUITER",
    },
  ],
  // Floor 3
  [
    ENEMIES[2], // Overachiever
    {
      floor: 3, name: "The Credit Thief", emoji: "\uD83E\uDD78", spriteId: "overachiever", maxHp: 70, atk: 12, def: 5, types: ["influence"] as MoveType[],
      moves: [{ name: "Steal the Spotlight", dmg: 16, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "\"WE Did This\"", dmg: 12, type: "strategy" as MoveType, heal: 8, status: { id: "motivated", target: "self" } }],
      defeat: "\"Fine, I'll put your name on the deck. In size 8 font.\"",
      title: "THE CREDIT THIEF",
    },
  ],
  // Floor 4
  [
    ENEMIES[3], // Scrum Master
    {
      floor: 4, name: "The Scope Creeper", emoji: "\uD83D\uDC1B", spriteId: "scrum", maxHp: 85, atk: 11, def: 7, types: ["strategy", "execution"] as MoveType[],
      moves: [{ name: "\"One More Thing\"", dmg: 14, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Feature Bloat", dmg: 18, type: "execution" as MoveType }, { name: "Moving Goalposts", dmg: 8, type: "strategy" as MoveType, heal: 10 }],
      defeat: "\"I know we said MVP but what if we also added...\" No. Stop.",
      title: "THE SCOPE CREEPER",
    },
  ],
  // Floor 5
  [
    ENEMIES[4], // Middle Manager
    {
      floor: 5, name: "The Micromanager", emoji: "\uD83D\uDD0D", spriteId: "manager", maxHp: 95, atk: 11, def: 12, types: ["influence", "strategy"] as MoveType[],
      moves: [{ name: "Check-In Barrage", dmg: 12, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } }, { name: "Calendar Tetris", dmg: 16, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } }, { name: "Status Report Demand", dmg: 10, type: "influence" as MoveType, heal: 10, status: { id: "motivated", target: "self" } }],
      defeat: "\"But how will I know you're working if I can't see your screen?!\"",
      title: "THE MICROMANAGER",
    },
  ],
  // Floors 6-7: fixed (no variants)
  [ENEMIES[5]], // VP of Synergy
  [ENEMIES[6]], // C-Suite Boss
];

/** Pick a random enemy for each floor. Returns array of 7 enemy IDs (name used as key). */
export function rollFloorEnemies(): string[] {
  return ENEMY_POOLS.map(pool => {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked.name;
  });
}

/** Get the Enemy for a floor given the rolled enemy name. */
export function getFloorEnemy(floor: number, enemyName: string): Enemy {
  const pool = ENEMY_POOLS[floor] || [ENEMIES[floor]];
  return pool.find(e => e.name === enemyName) || pool[0];
}

// ─── SAVE SYSTEM ─────────────────────────────────────────────
const SAVE_KEY = "corporate-climb-save";

export function saveGame(data: import("./types").SaveData) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

export function loadGame(): import("./types").SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as import("./types").SaveData;
    if (!PLAYER_CLASSES.find(c => c.id === data.classId)) return null;
    if (data.floor < 0 || data.floor >= ENEMIES.length) return null;
    return data;
  } catch { return null; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

// ─── FONT ────────────────────────────────────────────────────
export const FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
