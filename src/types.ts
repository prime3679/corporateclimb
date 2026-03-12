// ─── TYPES ───────────────────────────────────────────────────

export type StatusId = "motivated" | "focused" | "caffeinated" | "micromanaged" | "demoralized" | "burned_out";

export interface StatusDef {
  id: StatusId;
  name: string;
  icon: string;
  color: string;
  duration: number;
  desc: string;
}

export interface StatusInstance {
  id: StatusId;
  turnsLeft: number;
}

export interface StatusEffectOnMove {
  id: StatusId;
  target: "self" | "enemy";
  chance?: number; // 0-1, default 1
}

export interface Move {
  name: string;
  dmg: number;
  type: string;
  desc: string;
  pp: number;
  heal?: number;
  status?: StatusEffectOnMove;
}

export interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  spriteId: string;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  types: MoveType[];
  desc: string;
  moves: Move[];
}

export type MoveType = "strategy" | "influence" | "execution" | "analytics" | "technical" | "normal";

export interface EnemyMove {
  name: string;
  dmg: number;
  type?: MoveType;
  heal?: number;
  status?: StatusEffectOnMove;
}

export interface EnemyPhase2 {
  name?: string;
  emoji?: string;
  maxHp: number;
  atk?: number;
  def?: number;
  types?: MoveType[];
  moves: EnemyMove[];
  taunt: string;
}

export interface Enemy {
  floor: number;
  name: string;
  emoji: string;
  spriteId: string;
  maxHp: number;
  atk: number;
  def: number;
  types: MoveType[];
  moves: EnemyMove[];
  defeat: string;
  title: string;
  phase2?: EnemyPhase2;
}

export interface HallwayEvent {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  choices: {
    label: string;
    effect: { hp?: number; atk?: number; def?: number; ppRestore?: number };
    result: string;
    isGood: boolean;
  }[];
}

// ─── ITEMS ───────────────────────────────────────────────────

export type ItemId = "espresso" | "linkedin_endorsement" | "mentors_advice" | "networking_card" | "pto_day" | "side_hustle" | "standing_desk" | "noise_cancelling";

export interface ItemDef {
  id: ItemId;
  name: string;
  emoji: string;
  desc: string;
  effect: { hp?: number; atk?: number; def?: number; ppRestore?: number; status?: { id: StatusId; target: "self" } };
}

export type AnimState = "idle" | "attacking" | "hit" | "faint";

export interface DamagePopup {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  isHeal: boolean;
}

export type Screen = "title" | "classSelect" | "floorIntro" | "battle" | "victory" | "gameOver" | "win" | "hallwayEvent";

export interface SaveData {
  classId: string;
  floor: number;
  level: number;
  xp: number;
  xpToNext: number;
  playerHp: number;
  playerPp: number[];
  atkBuff: number;
  defBuff: number;
  usedEvents: string[];
  inventory: ItemId[];
  floorEnemyIds?: string[]; // tracks which enemy variant was selected per floor
  ngPlus?: number; // New Game+ level (0 = first playthrough)
  totalTurns?: number;
  totalDamageDealt?: number;
  enemyPhase?: 1 | 2;
}
