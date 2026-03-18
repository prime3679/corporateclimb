import type { StatusId, StatusDef, PlayerClass, Enemy, EnemyPhase2, HallwayEvent, MoveType, ItemId, ItemDef, AchievementId, AchievementDef, PromotionTier, Move } from "./types";

// ─── CONSTANTS ──────────────────────────────────────────────
export const TOTAL_FLOORS = 30;

export function getAct(floor: number): 1 | 2 | 3 {
  if (floor < 10) return 1;
  if (floor < 20) return 2;
  return 3;
}

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
      { name: "Ship MVP", dmg: 28, type: "execution", desc: "80/20 strikes. Maximum impact.", pp: 6, acc: 90 },
      { name: "Data-Driven Roast", dmg: 35, type: "analytics", desc: "Destroys arguments with metrics.", pp: 3, acc: 80, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
    ],
    perk: { name: "Cross-Functional", desc: "Heals 5 HP after every battle", icon: "\u{1F91D}" },
    intro: "Armed with a roadmap and ruthless prioritization, you step into the lobby.",
    winText: "You didn't just climb the ladder — you redefined it.",
    winTitle: "Chief Product Officer",
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
      { name: "Deploy to Prod", dmg: 30, type: "execution", desc: "YOLO push on Friday. Risky but devastating.", pp: 5, acc: 85, status: { id: "caffeinated", target: "self" } },
      { name: "Code Review Reject", dmg: 15, type: "technical", desc: "Nit-picks until they give up.", pp: 15, status: { id: "micromanaged", target: "enemy" } },
      { name: "Stack Overflow", dmg: 40, type: "analytics", desc: "Channels the collective wisdom. Huge damage.", pp: 3, acc: 75 },
    ],
    perk: { name: "Optimization", desc: "+15% damage on all moves", icon: "\u{1F4A5}" },
    intro: "You crack your knuckles. Time to ship.",
    winText: "You refactored the entire org chart.",
    winTitle: "Chief Technology Officer",
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
      { name: "Figma Tornado", dmg: 26, type: "technical", desc: "200 frames of animated fury.", pp: 8, acc: 90 },
      { name: "Design System Slam", dmg: 38, type: "strategy", desc: "Enforces consistency. Crushing blow.", pp: 3, acc: 75, status: { id: "motivated", target: "self", chance: 0.5 } },
    ],
    perk: { name: "Eye for Detail", desc: "+15% crit chance on all moves", icon: "\u{1F3AF}" },
    intro: "You see what others can't. That's your edge.",
    winText: "You redesigned the company from the inside out.",
    winTitle: "Chief Design Officer",
  },
];

// ─── PROMOTION TRACKS ───────────────────────────────────────
export const PROMOTION_TRACKS: Record<string, PromotionTier[]> = {
  pm: [
    { floor: 0, title: "Product Manager" },
    { floor: 5, title: "Senior PM", statBoost: { maxHp: 10, atk: 2, def: 1 } },
    { floor: 10, title: "Director of Product", statBoost: { maxHp: 15, atk: 2, def: 2 }, moveUpgrades: [{ fromName: "Prioritize Backlog", to: { name: "Strategic Roadmap", dmg: 24, type: "strategy", desc: "Sees three quarters ahead.", pp: 15, status: { id: "focused", target: "self", chance: 0.5 } } }] },
    { floor: 15, title: "VP Product", statBoost: { maxHp: 15, atk: 3, def: 2 } },
    { floor: 20, title: "SVP Product", statBoost: { maxHp: 20, atk: 3, def: 3 }, moveUpgrades: [{ fromName: "Ship MVP", to: { name: "Launch Platform", dmg: 36, type: "execution", desc: "Ship the whole ecosystem.", pp: 6, acc: 90, status: { id: "motivated", target: "self", chance: 0.4 } } }] },
    { floor: 25, title: "Chief Product Officer", statBoost: { maxHp: 20, atk: 4, def: 3 } },
  ],
  eng: [
    { floor: 0, title: "Senior Engineer" },
    { floor: 5, title: "Staff Engineer", statBoost: { maxHp: 8, atk: 3, def: 1 } },
    { floor: 10, title: "Engineering Manager", statBoost: { maxHp: 12, atk: 3, def: 2 }, moveUpgrades: [{ fromName: "Refactor Everything", to: { name: "Architecture Review", dmg: 28, type: "technical", desc: "Redesigns the entire system.", pp: 12, status: { id: "motivated", target: "self", chance: 0.5 } } }] },
    { floor: 15, title: "VP Engineering", statBoost: { maxHp: 15, atk: 4, def: 2 } },
    { floor: 20, title: "SVP Engineering", statBoost: { maxHp: 18, atk: 4, def: 3 }, moveUpgrades: [{ fromName: "Deploy to Prod", to: { name: "Ship to Scale", dmg: 38, type: "execution", desc: "Multi-region deploy. Zero downtime.", pp: 5, acc: 85, status: { id: "caffeinated", target: "self" } } }] },
    { floor: 25, title: "Chief Technology Officer", statBoost: { maxHp: 20, atk: 5, def: 3 } },
  ],
  design: [
    { floor: 0, title: "UX Designer" },
    { floor: 5, title: "Senior Designer", statBoost: { maxHp: 8, atk: 2, def: 2 } },
    { floor: 10, title: "Design Lead", statBoost: { maxHp: 12, atk: 2, def: 3 }, moveUpgrades: [{ fromName: "Pixel Perfect Punch", to: { name: "Design Critique", dmg: 26, type: "execution", desc: "Your feedback cuts deep.", pp: 15, status: { id: "focused", target: "self", chance: 0.4 } } }] },
    { floor: 15, title: "VP Design", statBoost: { maxHp: 15, atk: 3, def: 3 } },
    { floor: 20, title: "SVP Design", statBoost: { maxHp: 18, atk: 3, def: 4 }, moveUpgrades: [{ fromName: "Figma Tornado", to: { name: "Design System Overhaul", dmg: 34, type: "technical", desc: "Rebuilds the entire visual language.", pp: 8, acc: 90, status: { id: "motivated", target: "self", chance: 0.4 } } }] },
    { floor: 25, title: "Chief Design Officer", statBoost: { maxHp: 20, atk: 4, def: 4 } },
  ],
};

export function getPromotion(classId: string, floor: number): PromotionTier {
  const track = PROMOTION_TRACKS[classId] || [];
  return [...track].reverse().find(t => floor >= t.floor) || track[0];
}

export function getEffectivePlayer(base: PlayerClass, classId: string, currentFloor: number): PlayerClass {
  const track = PROMOTION_TRACKS[classId] || [];
  let maxHp = base.maxHp;
  let atk = base.atk;
  let def = base.def;
  const moves = [...base.moves];
  for (const tier of track) {
    if (currentFloor < tier.floor) break;
    if (tier.statBoost) {
      maxHp += tier.statBoost.maxHp || 0;
      atk += tier.statBoost.atk || 0;
      def += tier.statBoost.def || 0;
    }
    if (tier.moveUpgrades) {
      for (const up of tier.moveUpgrades) {
        const idx = moves.findIndex(m => m.name === up.fromName);
        if (idx >= 0) moves[idx] = up.to;
      }
    }
  }
  return { ...base, maxHp, atk, def, moves };
}

// ─── ENEMIES ─────────────────────────────────────────────────
export const ENEMIES: Enemy[] = [
  {
    floor: 1, name: "Intern", emoji: "🥤", spriteId: "intern", maxHp: 70, atk: 8, def: 5, types: ["normal"] as MoveType[],
    moves: [{ name: "Eager Question", dmg: 10, type: "normal" as MoveType }, { name: "Coffee Run", dmg: 6, type: "normal" as MoveType, heal: 12 }],
    defeat: "The intern learned a valuable lesson today.",
    title: "THE EAGER INTERN",
    taunt: "Oh great, another new hire who thinks they're special.",
  },
  {
    floor: 2, name: "Recruiter", emoji: "📞", spriteId: "recruiter", maxHp: 85, atk: 11, def: 6, types: ["influence"] as MoveType[],
    moves: [{ name: "LinkedIn Spam", dmg: 12, type: "influence" as MoveType }, { name: "Lowball Offer", dmg: 16, type: "strategy" as MoveType }],
    defeat: "\u201CLet\u2019s circle back when you have more budget.\u201D",
    title: "THE PERSISTENT RECRUITER",
    taunt: "I found your profile. Let's chat about an exciting opportunity.",
  },
  {
    floor: 3, name: "The Overachiever", emoji: "🏆", spriteId: "overachiever", maxHp: 95, atk: 13, def: 7, types: ["execution"] as MoveType[],
    moves: [{ name: "Humble Brag", dmg: 16, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } }, { name: "Extra Credit", dmg: 20, type: "execution" as MoveType }, { name: "Volunteer as Tribute", dmg: 12, type: "strategy" as MoveType, heal: 14, status: { id: "motivated", target: "self" } }],
    defeat: "\"I guess even 110% wasn't enough today.\"",
    title: "THE OVERACHIEVER",
    taunt: "I already finished my OKRs for next quarter. Have you?",
  },
  {
    floor: 4, name: "Scrum Master", emoji: "📝", spriteId: "scrum", maxHp: 105, atk: 13, def: 9, types: ["strategy", "execution"] as MoveType[],
    moves: [{ name: "Standup Ambush", dmg: 14, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy" } }, { name: "Sprint Overload", dmg: 18, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } }, { name: "Retro Guilt Trip", dmg: 12, type: "influence" as MoveType, heal: 10 }],
    defeat: "The daily standup has been cancelled. Forever.",
    title: "THE RELENTLESS SCRUM MASTER",
    taunt: "This isn't on the sprint board. I'm going to need a ticket.",
  },
  {
    floor: 5, name: "Middle Manager", emoji: "👔", spriteId: "manager", maxHp: 125, atk: 14, def: 11, types: ["influence", "strategy"] as MoveType[],
    moves: [{ name: "Unnecessary Meeting", dmg: 16, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Passive-Aggressive Email", dmg: 20, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "Take Credit", dmg: 10, type: "influence" as MoveType, heal: 18, status: { id: "motivated", target: "self" } }],
    defeat: "\u201CPer my last email\u2026 I resign.\u201D",
    title: "THE MIDDLE MANAGER",
    taunt: "I don't see this meeting on the calendar.",
  },
  {
    floor: 6, name: "VP of Synergy", emoji: "🎯", spriteId: "vp", maxHp: 155, atk: 17, def: 13, types: ["influence", "analytics"] as MoveType[],
    moves: [{ name: "Buzzword Barrage", dmg: 18, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.6 } }, { name: "Pivot Strategy", dmg: 24, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } }, { name: "Executive Presence", dmg: 14, type: "influence" as MoveType, heal: 14, status: { id: "motivated", target: "self" } }],
    defeat: "Synergy has been disrupted. The paradigm shifts.",
    title: "THE VP OF SYNERGY",
    taunt: "Let's take this offline. Actually, let's not.",
  },
  {
    floor: 7, name: "C-Suite Boss", emoji: "👑", spriteId: "boss", maxHp: 210, atk: 22, def: 16, types: ["strategy", "influence"] as MoveType[],
    moves: [{ name: "Golden Parachute", dmg: 12, type: "strategy" as MoveType, heal: 28, status: { id: "motivated", target: "self" } }, { name: "Hostile Takeover", dmg: 30, type: "execution" as MoveType, acc: 90, status: { id: "demoralized", target: "enemy", chance: 0.6 } }, { name: "Board Meeting Beam", dmg: 38, type: "analytics" as MoveType, acc: 85, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Layoff Wave", dmg: 24, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } }],
    defeat: "The corner office is yours. Was it worth it?",
    title: "THE C-SUITE FINAL BOSS",
    taunt: "Security, who let this person onto my floor?",
  },
  {
    floor: 8, name: "The Consultant", emoji: "💼", spriteId: "vp", maxHp: 175, atk: 18, def: 13, types: ["strategy", "analytics"] as MoveType[],
    moves: [
      { name: "Deck of Recommendations", dmg: 18, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Billable Hours Blast", dmg: 24, type: "analytics" as MoveType },
      { name: "Synergy Framework", dmg: 14, type: "strategy" as MoveType, heal: 10, status: { id: "micromanaged", target: "enemy", chance: 0.4 } },
      { name: "Out-of-Scope Notice", dmg: 32, type: "execution" as MoveType, acc: 85 },
    ],
    defeat: "Submits final invoice, disappears forever.",
    title: "THE CONSULTANT",
    taunt: "My rate is $400/hour. This fight is already on the clock.",
  },
  {
    floor: 9, name: "Head of HR", emoji: "📋", spriteId: "manager", maxHp: 185, atk: 16, def: 18, types: ["influence", "strategy"] as MoveType[],
    moves: [
      { name: "Mandatory Fun", dmg: 12, type: "influence" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.6 } },
      { name: "Performance Improvement Plan", dmg: 20, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy" } },
      { name: "Policy Override", dmg: 16, type: "influence" as MoveType, heal: 14 },
      { name: "Culture Fit Assessment", dmg: 28, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy" } },
    ],
    defeat: "Sends a mandatory training course as a parting gift.",
    title: "HEAD OF HR",
    taunt: "We need to talk. Close the door.",
  },
  {
    floor: 10, name: "The Founder", emoji: "🚀", spriteId: "boss", maxHp: 240, atk: 20, def: 16, types: ["strategy", "influence", "execution"] as MoveType[],
    moves: [
      { name: "Vision Statement", dmg: 20, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Move Fast", dmg: 28, type: "execution" as MoveType, status: { id: "caffeinated", target: "self" } },
      { name: "We're a Family", dmg: 12, type: "influence" as MoveType, heal: 20 },
      { name: "Disrupt the Market", dmg: 38, type: "strategy" as MoveType, acc: 85 },
    ],
    defeat: "The company is yours now. All of it.",
    title: "THE FOUNDER",
    taunt: "I built this company from nothing. You ARE nothing.",
    phase2: {
      name: "The Founder (Pivoting)",
      emoji: "🔥",
      maxHp: 120,
      atk: 22,
      def: 12,
      types: ["execution", "strategy", "technical"] as MoveType[],
      moves: [
        { name: "Pivot Everything", dmg: 22, type: "execution" as MoveType, status: { id: "micromanaged", target: "enemy" } },
        { name: "Blame the Market", dmg: 16, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.7 } },
        { name: "Emergency Board Call", dmg: 30, type: "strategy" as MoveType, heal: 15 },
        { name: "Going Dark", dmg: 45, type: "technical" as MoveType, acc: 80 },
      ],
      taunt: "The Founder grins. 'Time to pivot.'",
    } as EnemyPhase2,
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
      { label: "Take the whole pot", effect: { hp: 40, def: -2 }, result: "You chug the entire pot. Jittery but ENERGIZED. Your hands won't stop shaking though.", isGood: true },
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
      { label: "Attend willingly", effect: { def: 2, hp: -25 }, result: "It was NOT quick. But you learned about \"psychological safety\" which is... something.", isGood: true },
      { label: "Fake a meeting conflict", effect: { atk: 1 }, result: "\"Sorry, syncing with stakeholders!\" You dodge it smoothly. Confidence boost.", isGood: true },
      { label: "Actually engage", effect: { def: 3, hp: -30, ppRestore: 2 }, result: "You genuinely participate. HR is shocked. You feel weirdly refreshed.", isGood: true },
    ],
  },
  {
    id: "supply_closet",
    title: "SUPPLY CLOSET",
    desc: "The supply closet is unlocked. Inside: premium sticky notes, a Red Bull, and someone's hidden snack stash.",
    emoji: "\uD83D\uDCE6",
    choices: [
      { label: "Grab the Red Bull", effect: { hp: 20, atk: 1 }, result: "Wings acquired. You feel unstoppable (for about 45 minutes).", isGood: true },
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
      { label: "Stare at your phone", effect: { hp: -20, def: -1 }, result: "The CEO notices. Noted. Literally \u2014 they wrote something down. Your reputation takes a hit.", isGood: false },
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
      { label: "Eat cake, sing along", effect: { hp: 25, ppRestore: 2 }, result: "The cake is surprisingly good. Costco sheet cake never disappoints.", isGood: true },
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
  {
    id: "all_hands",
    title: "ALL-HANDS MEETING",
    desc: "The CEO is doing a surprise all-hands. Attendance is 'optional' (it's not optional).",
    emoji: "📢",
    choices: [
      { label: "Ask a tough question", effect: { atk: 3, hp: -30 }, result: "\"Great question.\" Dead silence. You're either a hero or unemployable. Either way — power move.", isGood: true },
      { label: "Clap at the right moments", effect: { def: 2, hp: 10 }, result: "You master the art of strategic applause. Leadership notices. You're 'aligned.'", isGood: true },
      { label: "Multitask through it", effect: { ppRestore: 3 }, result: "You clear 47 Slack messages. The CEO drones on. Efficient.", isGood: true },
    ],
  },
  {
    id: "team_lunch",
    title: "TEAM LUNCH",
    desc: "Someone organized a team lunch at that expensive sushi place. Your card is already on file.",
    emoji: "🍣",
    choices: [
      { label: "Order the omakase", effect: { hp: 30, def: -2 }, result: "Best meal in months. Your wallet screams. Your soul sings.", isGood: true },
      { label: "Just get the bento box", effect: { hp: 25, atk: 1 }, result: "Sensible and satisfying. You save money AND feel good. The rarest corporate combo.", isGood: true },
      { label: "Expense it", effect: { atk: 2, def: 1 }, result: "\"Business development lunch.\" You'll deal with finance later. Confidence surges.", isGood: true },
    ],
  },
  {
    id: "server_room",
    title: "SERVER ROOM",
    desc: "You hear frantic beeping from the server room. The door is propped open with a shoe.",
    emoji: "🖥️",
    choices: [
      { label: "Investigate", effect: { atk: 3, hp: -10 }, result: "You find and fix a runaway process. Nobody will ever know — except you. And that's enough.", isGood: true },
      { label: "Report it to IT", effect: { def: 2 }, result: "IT owes you one. They slip you a keyboard shortcut cheat sheet. +DEF from efficiency.", isGood: true },
      { label: "Close the door", effect: { hp: 15 }, result: "Not your problem. You walk away with the peace of a person who maintains boundaries.", isGood: true },
    ],
  },
  {
    id: "performance_review",
    title: "SURPRISE REVIEW",
    desc: "Your skip-level just scheduled a 1:1 in 10 minutes. Subject: 'Quick Chat.' Nothing quick is ever quick.",
    emoji: "😰",
    choices: [
      { label: "Prep talking points", effect: { atk: 2, def: 2 }, result: "You walk in armed with receipts. The 'quick chat' becomes a promotion conversation.", isGood: true },
      { label: "Wing it", effect: { atk: 4, hp: -25 }, result: "You speak from the heart. Raw. Unfiltered. They're either impressed or concerned. ATK goes way up.", isGood: true },
      { label: "Reschedule", effect: { hp: 20, ppRestore: 2 }, result: "\"Can we do Thursday?\" Bought yourself time and mental space.", isGood: true },
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
  standing_desk: {
    id: "standing_desk", name: "Standing Desk", emoji: "\uD83E\uDE91",
    desc: "Power posture. +4 DEF and restores 15 HP.",
    effect: { def: 4, hp: 15 },
  },
  noise_cancelling: {
    id: "noise_cancelling", name: "Noise-Cancelling", emoji: "\uD83C\uDFA7",
    desc: "Block out the chaos. Grants Focused status.",
    effect: { status: { id: "focused", target: "self" } },
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
      floor: 1, name: "The Coffee Runner", emoji: "\u2615", spriteId: "intern", maxHp: 65, atk: 7, def: 7, types: ["normal"] as MoveType[],
      moves: [{ name: "Latte Splash", dmg: 12, type: "normal" as MoveType }, { name: "Oat Milk Shield", dmg: 5, type: "normal" as MoveType, heal: 14 }],
      defeat: "\"I just wanted to get the order right...\"",
      title: "THE COFFEE RUNNER",
      taunt: "Venti oat milk latte with two pumps of ambition, coming up!",
    },
  ],
  // Floor 2
  [
    ENEMIES[1], // Recruiter
    {
      floor: 2, name: "The Ghosting Recruiter", emoji: "\uD83D\uDC7B", spriteId: "recruiter", maxHp: 80, atk: 12, def: 5, types: ["influence"] as MoveType[],
      moves: [{ name: "Read Receipt", dmg: 14, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "\"We'll Be In Touch\"", dmg: 10, type: "strategy" as MoveType }],
      defeat: "\"Let me check with my hiring manager and get back to you. (They won't.)\"",
      title: "THE GHOSTING RECRUITER",
      taunt: "I'll get back to you. Maybe.",
    },
  ],
  // Floor 3
  [
    ENEMIES[2], // Overachiever
    {
      floor: 3, name: "The Credit Thief", emoji: "\uD83E\uDD78", spriteId: "overachiever", maxHp: 90, atk: 14, def: 6, types: ["influence"] as MoveType[],
      moves: [{ name: "Steal the Spotlight", dmg: 18, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "\"WE Did This\"", dmg: 14, type: "strategy" as MoveType, heal: 10, status: { id: "motivated", target: "self" } }],
      defeat: "\"Fine, I'll put your name on the deck. In size 8 font.\"",
      title: "THE CREDIT THIEF",
      taunt: "Great work on that project. I'll present it to leadership.",
    },
  ],
  // Floor 4
  [
    ENEMIES[3], // Scrum Master
    {
      floor: 4, name: "The Scope Creeper", emoji: "\uD83D\uDC1B", spriteId: "scrum", maxHp: 100, atk: 13, def: 8, types: ["strategy", "execution"] as MoveType[],
      moves: [{ name: "\"One More Thing\"", dmg: 16, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Feature Bloat", dmg: 20, type: "execution" as MoveType }, { name: "Moving Goalposts", dmg: 10, type: "strategy" as MoveType, heal: 12 }],
      defeat: "\"I know we said MVP but what if we also added...\" No. Stop.",
      title: "THE SCOPE CREEPER",
      taunt: "Before we start, I just have one small addition...",
    },
  ],
  // Floor 5
  [
    ENEMIES[4], // Middle Manager
    {
      floor: 5, name: "The Micromanager", emoji: "\uD83D\uDD0D", spriteId: "manager", maxHp: 120, atk: 13, def: 13, types: ["influence", "strategy"] as MoveType[],
      moves: [{ name: "Check-In Barrage", dmg: 14, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } }, { name: "Calendar Tetris", dmg: 18, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } }, { name: "Status Report Demand", dmg: 12, type: "influence" as MoveType, heal: 12, status: { id: "motivated", target: "self" } }],
      defeat: "\"But how will I know you're working if I can't see your screen?!\"",
      title: "THE MICROMANAGER",
      taunt: "I noticed you were idle on Slack for 3 minutes. Everything okay?",
    },
  ],
  // Floor 6
  [
    ENEMIES[5], // VP of Synergy
    {
      floor: 6, name: "The Data Tyrant", emoji: "📊", spriteId: "vp", maxHp: 150, atk: 16, def: 15, types: ["analytics", "strategy"] as MoveType[],
      moves: [
        { name: "Dashboard Interrogation", dmg: 18, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.5 } },
        { name: "KPI Guillotine", dmg: 24, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
        { name: "Vanity Metrics", dmg: 10, type: "analytics" as MoveType, heal: 14, status: { id: "motivated", target: "self" } },
      ],
      defeat: "The dashboard goes dark. No more red numbers.",
      title: "THE DATA TYRANT",
      taunt: "Show me the numbers. ALL of them.",
    },
  ],
  // Floor 7
  [
    ENEMIES[6], // C-Suite Boss
    {
      floor: 7, name: "The Board Member", emoji: "🏛️", spriteId: "boss", maxHp: 200, atk: 20, def: 17, types: ["influence", "analytics"] as MoveType[],
      moves: [
        { name: "Shareholder Pressure", dmg: 20, type: "influence" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
        { name: "Fiduciary Fury", dmg: 30, type: "analytics" as MoveType },
        { name: "Stock Buyback", dmg: 8, type: "strategy" as MoveType, heal: 22, status: { id: "motivated", target: "self" } },
        { name: "Vote of No Confidence", dmg: 26, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy" } },
      ],
      defeat: "The board adjourns. Your motion carries.",
      title: "THE BOARD MEMBER",
      taunt: "This better be worth my time. I bill by the quarter.",
    },
  ],
  // Floor 8
  [
    ENEMIES[7], // The Consultant
    {
      floor: 8, name: "The Agency Creative", emoji: "🎬", spriteId: "vp", maxHp: 165, atk: 19, def: 12, types: ["execution", "technical"] as MoveType[],
      moves: [
        { name: "Mood Board Assault", dmg: 20, type: "execution" as MoveType, status: { id: "focused", target: "self", chance: 0.4 } },
        { name: "Brand Guidelines Bomb", dmg: 26, type: "technical" as MoveType },
        { name: "\"Trust the Process\"", dmg: 14, type: "influence" as MoveType, heal: 12, status: { id: "micromanaged", target: "enemy", chance: 0.3 } },
        { name: "Deliverable Dump", dmg: 34, type: "execution" as MoveType },
      ],
      defeat: "The retainer has been terminated. No more revisions.",
      title: "THE AGENCY CREATIVE",
      taunt: "This is just v1. Wait until you see the mood board.",
    },
  ],
  // Floor 9
  [
    ENEMIES[8], // Head of HR
    {
      floor: 9, name: "The Compliance Officer", emoji: "⚖️", spriteId: "manager", maxHp: 180, atk: 15, def: 20, types: ["strategy", "analytics"] as MoveType[],
      moves: [
        { name: "Regulatory Audit", dmg: 16, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy" } },
        { name: "Policy Violation Notice", dmg: 22, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.6 } },
        { name: "Risk Mitigation", dmg: 10, type: "strategy" as MoveType, heal: 16, status: { id: "motivated", target: "self" } },
        { name: "Legal Hold", dmg: 30, type: "analytics" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
      ],
      defeat: "Case dismissed. The paperwork dissolves.",
      title: "THE COMPLIANCE OFFICER",
      taunt: "I'm going to need that in writing. Notarized.",
    },
  ],
  // Floor 10: The Founder (Act 1 boss with phase 2)
  [ENEMIES[9]],

  // ═══ ACT 2: MANAGEMENT (Floors 11-20, 0-indexed 10-19) ═══

  // Floor 11
  [{
    floor: 11, name: "The Reorg Survivor", emoji: "🔄", spriteId: "manager", maxHp: 260, atk: 22, def: 17, types: ["strategy", "influence"] as MoveType[],
    moves: [
      { name: "Pivot Punch", dmg: 22, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Org Chart Shuffle", dmg: 18, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Survival Instinct", dmg: 14, type: "strategy" as MoveType, heal: 18, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"I've survived six reorgs. I can't survive you.\"",
    title: "THE REORG SURVIVOR",
    taunt: "I've been here longer than the mission statement.",
  }],
  // Floor 12
  [{
    floor: 12, name: "The Budget Gatekeeper", emoji: "🔒", spriteId: "vp", maxHp: 275, atk: 23, def: 18, types: ["analytics", "strategy"] as MoveType[],
    moves: [
      { name: "Budget Denied", dmg: 24, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Fiscal Audit", dmg: 18, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Cost Optimization", dmg: 12, type: "analytics" as MoveType, heal: 16 },
    ],
    defeat: "\"Fine. I'll approve the line item. This once.\"",
    title: "THE BUDGET GATEKEEPER",
    taunt: "Where's the ROI on you, exactly?",
  }],
  // Floor 13
  [{
    floor: 13, name: "The Skip-Level Politician", emoji: "🪜", spriteId: "vp", maxHp: 290, atk: 24, def: 18, types: ["influence", "strategy"] as MoveType[],
    moves: [
      { name: "Go Over Your Head", dmg: 26, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Political Maneuver", dmg: 20, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.4 } },
      { name: "Alliance Building", dmg: 14, type: "influence" as MoveType, heal: 16, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"I suppose going over YOUR head won't work either.\"",
    title: "THE SKIP-LEVEL POLITICIAN",
    taunt: "I already talked to your boss's boss about this.",
  }],
  // Floor 14
  [{
    floor: 14, name: "The OKR Fanatic", emoji: "📊", spriteId: "scrum", maxHp: 300, atk: 25, def: 19, types: ["analytics", "execution"] as MoveType[],
    moves: [
      { name: "KR Interrogation", dmg: 22, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Alignment Check", dmg: 26, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
      { name: "Metric Mastery", dmg: 16, type: "analytics" as MoveType, heal: 14, status: { id: "focused", target: "self" } },
    ],
    defeat: "\"My key results... they're all red...\"",
    title: "THE OKR FANATIC",
    taunt: "If it's not measurable, it doesn't exist.",
  }],
  // Floor 15
  [{
    floor: 15, name: "The Town Hall Heckler", emoji: "📢", spriteId: "overachiever", maxHp: 315, atk: 26, def: 20, types: ["influence", "execution"] as MoveType[],
    moves: [
      { name: "Public Callout", dmg: 28, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Disruptive Question", dmg: 22, type: "execution" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.4 } },
      { name: "Crowd Energy", dmg: 16, type: "influence" as MoveType, heal: 16, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"Okay fine, I'll hold my questions until the end.\"",
    title: "THE TOWN HALL HECKLER",
    taunt: "Quick question that's actually a 10-minute speech.",
  }],
  // Floor 16
  [{
    floor: 16, name: "The Offsite Facilitator", emoji: "🏕️", spriteId: "recruiter", maxHp: 330, atk: 27, def: 21, types: ["influence", "strategy"] as MoveType[],
    moves: [
      { name: "Trust Fall Attack", dmg: 24, type: "influence" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
      { name: "Breakout Session Blast", dmg: 28, type: "strategy" as MoveType },
      { name: "Team Building Exercise", dmg: 14, type: "influence" as MoveType, heal: 18, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"The real deliverable was the friends we made along the way.\"",
    title: "THE OFFSITE FACILITATOR",
    taunt: "Everyone find a partner. We're doing improv.",
  }],
  // Floor 17
  [{
    floor: 17, name: "The Headcount Freeze", emoji: "🧊", spriteId: "manager", maxHp: 345, atk: 28, def: 22, types: ["strategy", "analytics"] as MoveType[],
    moves: [
      { name: "Hiring Freeze", dmg: 26, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
      { name: "Attrition Wave", dmg: 30, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Backfill Denial", dmg: 18, type: "strategy" as MoveType, heal: 16 },
    ],
    defeat: "\"Fine. You can have ONE headcount. Junior level.\"",
    title: "THE HEADCOUNT FREEZE",
    taunt: "Do more with less. That's not a suggestion.",
  }],
  // Floor 18
  [{
    floor: 18, name: "The Cross-Functional Blocker", emoji: "🚧", spriteId: "scrum", maxHp: 360, atk: 29, def: 23, types: ["strategy", "execution"] as MoveType[],
    moves: [
      { name: "Scope Expansion", dmg: 28, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
      { name: "Dependency Lock", dmg: 24, type: "execution" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "RACI Confusion", dmg: 32, type: "strategy" as MoveType, acc: 85 },
      { name: "Process Shield", dmg: 14, type: "execution" as MoveType, heal: 18, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"I was just following the process...\"",
    title: "THE CROSS-FUNCTIONAL BLOCKER",
    taunt: "That's not in our team's charter. File a request.",
  }],
  // Floor 19
  [{
    floor: 19, name: "The Strategy Consultant", emoji: "💎", spriteId: "vp", maxHp: 380, atk: 30, def: 23, types: ["analytics", "strategy"] as MoveType[],
    moves: [
      { name: "Framework Overload", dmg: 30, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.5 } },
      { name: "2x2 Matrix", dmg: 26, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Engagement Extension", dmg: 18, type: "analytics" as MoveType, heal: 20, status: { id: "motivated", target: "self" } },
      { name: "McKinsey Slide", dmg: 36, type: "strategy" as MoveType, acc: 80 },
    ],
    defeat: "\"Per our analysis, I was wrong. Invoice still applies.\"",
    title: "THE STRATEGY CONSULTANT",
    taunt: "We've prepared a 200-slide deck. Let's begin.",
  }],
  // Floor 20: Act 2 boss (Chief of Staff) — with phase2
  [{
    floor: 20, name: "The Chief of Staff", emoji: "🗝️", spriteId: "boss", maxHp: 400, atk: 32, def: 24, types: ["strategy", "influence"] as MoveType[],
    moves: [
      { name: "Executive Agenda", dmg: 28, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Information Gatekeep", dmg: 24, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Calendar Control", dmg: 20, type: "strategy" as MoveType, heal: 22, status: { id: "motivated", target: "self" } },
      { name: "Boardroom Whisper", dmg: 36, type: "influence" as MoveType, acc: 85, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
    ],
    defeat: "\"You've earned your seat. The CEO will see you now.\"",
    title: "THE CHIEF OF STAFF",
    taunt: "Nobody gets to the top without going through me.",
    phase2: {
      name: "The Chief of Staff (Unleashed)",
      emoji: "⚡",
      maxHp: 180,
      atk: 34,
      def: 20,
      types: ["strategy", "influence", "execution"] as MoveType[],
      moves: [
        { name: "Full Authority", dmg: 32, type: "strategy" as MoveType, status: { id: "micromanaged", target: "enemy" } },
        { name: "Executive Override", dmg: 28, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
        { name: "Power Consolidation", dmg: 20, type: "influence" as MoveType, heal: 24 },
        { name: "Kill the Initiative", dmg: 42, type: "strategy" as MoveType, acc: 80 },
      ],
      taunt: "Gloves off. I didn't get here by being nice.",
    } as EnemyPhase2,
  }],

  // ═══ ACT 3: EXECUTIVE (Floors 21-30, 0-indexed 20-29) ═══

  // Floor 21
  [{
    floor: 21, name: "The Activist Investor", emoji: "📈", spriteId: "boss", maxHp: 420, atk: 34, def: 25, types: ["analytics", "influence"] as MoveType[],
    moves: [
      { name: "Shareholder Letter", dmg: 30, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Proxy Fight", dmg: 34, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy", chance: 0.4 } },
      { name: "Short Position", dmg: 20, type: "analytics" as MoveType, heal: 20, status: { id: "motivated", target: "self" } },
    ],
    defeat: "\"Fine. I'll liquidate my position. You win this round.\"",
    title: "THE ACTIVIST INVESTOR",
    taunt: "Your margins are a joke. I bought 12% of this company.",
  }],
  // Floor 22
  [{
    floor: 22, name: "The M&A Shark", emoji: "🦈", spriteId: "boss", maxHp: 435, atk: 35, def: 26, types: ["strategy", "execution"] as MoveType[],
    moves: [
      { name: "Hostile Bid", dmg: 34, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Due Diligence Strike", dmg: 28, type: "execution" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Poison Pill", dmg: 18, type: "strategy" as MoveType, heal: 22 },
      { name: "Leveraged Buyout", dmg: 40, type: "execution" as MoveType, acc: 80 },
    ],
    defeat: "\"The deal is dead. You've earned my respect.\"",
    title: "THE M&A SHARK",
    taunt: "I'm not here to negotiate. I'm here to acquire.",
  }],
  // Floor 23
  [{
    floor: 23, name: "The Regulatory Auditor", emoji: "⚖️", spriteId: "manager", maxHp: 450, atk: 34, def: 28, types: ["analytics", "strategy"] as MoveType[],
    moves: [
      { name: "Compliance Trap", dmg: 28, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Audit Finding", dmg: 32, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Remediation Plan", dmg: 18, type: "analytics" as MoveType, heal: 22, status: { id: "motivated", target: "self" } },
      { name: "Cease and Desist", dmg: 38, type: "strategy" as MoveType, acc: 85, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
    ],
    defeat: "\"No further findings. You're... clean.\"",
    title: "THE REGULATORY AUDITOR",
    taunt: "Section 14(a), subsection 3. You're in violation.",
  }],
  // Floor 24
  [{
    floor: 24, name: "The PR Crisis", emoji: "🔥", spriteId: "recruiter", maxHp: 465, atk: 36, def: 27, types: ["influence", "execution"] as MoveType[],
    moves: [
      { name: "Viral Scandal", dmg: 34, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.6 } },
      { name: "Media Frenzy", dmg: 30, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
      { name: "Crisis Comms", dmg: 18, type: "influence" as MoveType, heal: 22 },
      { name: "Reputation Nuke", dmg: 42, type: "execution" as MoveType, acc: 80 },
    ],
    defeat: "\"The news cycle moves on. You survived the headlines.\"",
    title: "THE PR CRISIS",
    taunt: "Trending #1. And not in the good way.",
  }],
  // Floor 25
  [{
    floor: 25, name: "The Board Observer", emoji: "👁️", spriteId: "boss", maxHp: 480, atk: 37, def: 29, types: ["analytics", "influence"] as MoveType[],
    moves: [
      { name: "Silent Judgment", dmg: 30, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Written Dissent", dmg: 34, type: "influence" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Abstain", dmg: 12, type: "analytics" as MoveType, heal: 26, status: { id: "motivated", target: "self" } },
      { name: "No-Confidence Vote", dmg: 44, type: "influence" as MoveType, acc: 80, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
    ],
    defeat: "\"I've seen enough. You have my vote.\"",
    title: "THE BOARD OBSERVER",
    taunt: "Don't mind me. I'm just... observing.",
  }],
  // Floor 26
  [{
    floor: 26, name: "The Whistleblower", emoji: "📣", spriteId: "overachiever", maxHp: 500, atk: 38, def: 28, types: ["execution", "technical"] as MoveType[],
    moves: [
      { name: "Leak to Press", dmg: 36, type: "execution" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Evidence Drop", dmg: 32, type: "technical" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Moral High Ground", dmg: 20, type: "execution" as MoveType, heal: 24, status: { id: "motivated", target: "self" } },
      { name: "Full Exposure", dmg: 46, type: "technical" as MoveType, acc: 75 },
    ],
    defeat: "\"The truth is out. I've done my part.\"",
    title: "THE WHISTLEBLOWER",
    taunt: "I know what you did last fiscal quarter.",
  }],
  // Floor 27
  [{
    floor: 27, name: "The PE Partner", emoji: "🏦", spriteId: "boss", maxHp: 520, atk: 39, def: 30, types: ["strategy", "analytics"] as MoveType[],
    moves: [
      { name: "Strip and Flip", dmg: 36, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
      { name: "Debt Load", dmg: 34, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Portfolio Synergy", dmg: 20, type: "strategy" as MoveType, heal: 24, status: { id: "motivated", target: "self" } },
      { name: "Exit Multiple", dmg: 48, type: "analytics" as MoveType, acc: 75 },
    ],
    defeat: "\"You're not for sale. Noted.\"",
    title: "THE PE PARTNER",
    taunt: "Everything has a price. Let's find yours.",
  }],
  // Floor 28
  [{
    floor: 28, name: "The SEC Investigator", emoji: "🔍", spriteId: "manager", maxHp: 540, atk: 40, def: 31, types: ["analytics", "strategy"] as MoveType[],
    moves: [
      { name: "Subpoena Storm", dmg: 36, type: "analytics" as MoveType, status: { id: "micromanaged", target: "enemy" } },
      { name: "Formal Inquiry", dmg: 34, type: "strategy" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Plea Bargain", dmg: 20, type: "analytics" as MoveType, heal: 24 },
      { name: "Federal Indictment", dmg: 50, type: "strategy" as MoveType, acc: 75, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
    ],
    defeat: "\"Case closed. You're free to go.\"",
    title: "THE SEC INVESTIGATOR",
    taunt: "We've been watching you for a long time.",
  }],
  // Floor 29
  [{
    floor: 29, name: "The Rival CEO", emoji: "⚔️", spriteId: "boss", maxHp: 560, atk: 42, def: 32, types: ["strategy", "influence", "execution"] as MoveType[],
    moves: [
      { name: "Talent Poaching", dmg: 36, type: "influence" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Market Disruption", dmg: 40, type: "execution" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.4 } },
      { name: "Strategic Alliance", dmg: 22, type: "strategy" as MoveType, heal: 26, status: { id: "motivated", target: "self" } },
      { name: "Corporate Espionage", dmg: 50, type: "strategy" as MoveType, acc: 80 },
    ],
    defeat: "\"Well played. See you at the next earnings call.\"",
    title: "THE RIVAL CEO",
    taunt: "Your company? I'll be buying it by Q4.",
  }],
  // Floor 30: The IPO (Final Boss) — with phase2
  [{
    floor: 30, name: "The IPO", emoji: "🔔", spriteId: "boss", maxHp: 600, atk: 44, def: 34, types: ["strategy", "influence", "execution"] as MoveType[],
    moves: [
      { name: "Roadshow Pressure", dmg: 38, type: "influence" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
      { name: "Valuation Crush", dmg: 42, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
      { name: "Quiet Period", dmg: 22, type: "strategy" as MoveType, heal: 28, status: { id: "motivated", target: "self" } },
      { name: "Price the Offering", dmg: 52, type: "strategy" as MoveType, acc: 80 },
    ],
    defeat: "The bell rings. The stock soars. It's yours.",
    title: "THE IPO",
    taunt: "The market doesn't care about your feelings.",
    phase2: {
      name: "The Market Correction",
      emoji: "📉",
      maxHp: 280,
      atk: 46,
      def: 28,
      types: ["analytics", "strategy", "execution"] as MoveType[],
      moves: [
        { name: "Bear Market", dmg: 40, type: "analytics" as MoveType, status: { id: "demoralized", target: "enemy", chance: 0.6 } },
        { name: "Margin Call", dmg: 36, type: "strategy" as MoveType, status: { id: "burned_out", target: "enemy", chance: 0.5 } },
        { name: "Dead Cat Bounce", dmg: 24, type: "execution" as MoveType, heal: 30 },
        { name: "Flash Crash", dmg: 58, type: "analytics" as MoveType, acc: 75 },
      ],
      taunt: "The market corrects. Can you?",
    } as EnemyPhase2,
  }],
];

/** Pick a random enemy for each floor. Returns array of enemy IDs (name used as key). */
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

// ─── NEW GAME+ ───────────────────────────────────────────────
const NG_PLUS_KEY = "corporate-climb-ng-best";

/** Scale an enemy's stats for NG+ (30% per NG+ level) */
export function scaleEnemyForNgPlus(e: Enemy, ngLevel: number): Enemy {
  if (ngLevel <= 0) return e;
  const mult = 1 + ngLevel * 0.3;
  const dmgMult = 1 + ngLevel * 0.15;
  return {
    ...e,
    maxHp: Math.round(e.maxHp * mult),
    atk: Math.round(e.atk * mult),
    def: Math.round(e.def * mult),
    moves: e.moves.map(m => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
    phase2: e.phase2 ? {
      ...e.phase2,
      maxHp: Math.round(e.phase2.maxHp * mult),
      atk: e.phase2.atk ? Math.round(e.phase2.atk * mult) : undefined,
      def: e.phase2.def ? Math.round(e.phase2.def * mult) : undefined,
      moves: e.phase2.moves.map(m => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
    } : undefined,
  };
}

export function getBestNgPlus(): number {
  try { return parseInt(localStorage.getItem(NG_PLUS_KEY) || "0", 10) || 0; } catch { return 0; }
}

export function saveBestNgPlus(level: number) {
  try {
    const current = getBestNgPlus();
    if (level > current) localStorage.setItem(NG_PLUS_KEY, String(level));
  } catch {}
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
    if (data.floor < 0 || data.floor >= ENEMY_POOLS.length) return null;
    return data;
  } catch { return null; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

// ─── ACHIEVEMENTS ────────────────────────────────────────────
const ACHIEVEMENT_KEY = "corporate-climb-achievements";

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_climb", name: "First Day", desc: "Beat the game for the first time", icon: "\u{1F3C6}" },
  { id: "triple_threat", name: "Triple Threat", desc: "Beat the game with all 3 classes", icon: "\u{1F451}" },
  { id: "speed_runner", name: "Speed Runner", desc: "Win in under 50 turns", icon: "\u26A1" },
  { id: "iron_will", name: "Iron Will", desc: "Win without using any items", icon: "\u{1F9CA}" },
  { id: "glass_cannon", name: "Glass Cannon", desc: "Win with less than 15 HP", icon: "\u{1F4A2}" },
  { id: "ng_plus_1", name: "Promoted", desc: "Beat NG+1", icon: "\u{1F4C8}" },
  { id: "ng_plus_3", name: "C-Suite Material", desc: "Beat NG+3 or higher", icon: "\u{1F48E}" },
  { id: "damage_dealer", name: "Damage Dealer", desc: "Deal 3000+ total damage in a run", icon: "\u{1F525}" },
];

export function getUnlockedAchievements(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    return raw ? new Set(JSON.parse(raw) as AchievementId[]) : new Set();
  } catch { return new Set(); }
}

export function unlockAchievement(id: AchievementId): boolean {
  const current = getUnlockedAchievements();
  if (current.has(id)) return false;
  current.add(id);
  try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify([...current])); } catch {}
  return true; // newly unlocked
}

export function getClassWins(): Set<string> {
  try {
    const raw = localStorage.getItem("corporate-climb-class-wins");
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

export function recordClassWin(classId: string) {
  const wins = getClassWins();
  wins.add(classId);
  try { localStorage.setItem("corporate-climb-class-wins", JSON.stringify([...wins])); } catch {}
}

/** Check and unlock all applicable achievements after a win */
export function checkAchievements(stats: {
  classId: string;
  totalTurns: number;
  totalDamageDealt: number;
  ngLevel: number;
  itemsUsed: number;
  finalHp: number;
}): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];

  if (unlockAchievement("first_climb")) newlyUnlocked.push("first_climb");

  recordClassWin(stats.classId);
  if (getClassWins().size >= 3) {
    if (unlockAchievement("triple_threat")) newlyUnlocked.push("triple_threat");
  }

  if (stats.totalTurns <= 50) {
    if (unlockAchievement("speed_runner")) newlyUnlocked.push("speed_runner");
  }

  if (stats.itemsUsed === 0) {
    if (unlockAchievement("iron_will")) newlyUnlocked.push("iron_will");
  }

  if (stats.finalHp < 15) {
    if (unlockAchievement("glass_cannon")) newlyUnlocked.push("glass_cannon");
  }

  if (stats.ngLevel >= 1) {
    if (unlockAchievement("ng_plus_1")) newlyUnlocked.push("ng_plus_1");
  }

  if (stats.ngLevel >= 3) {
    if (unlockAchievement("ng_plus_3")) newlyUnlocked.push("ng_plus_3");
  }

  if (stats.totalDamageDealt >= 3000) {
    if (unlockAchievement("damage_dealer")) newlyUnlocked.push("damage_dealer");
  }

  return newlyUnlocked;
}

// ─── FONT ────────────────────────────────────────────────────
export const FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
