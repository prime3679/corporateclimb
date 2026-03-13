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
  acc?: number; // 0-100, default 100 (always hits)
  heal?: number;
  status?: StatusEffectOnMove;
}

export interface ClassPerk {
  name: string;
  desc: string;
  icon: string;
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
  perk: ClassPerk;
  intro?: string;
  winText?: string;
  winTitle?: string;
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
export type AchievementId =
  | "first_climb"
  | "triple_threat"
  | "speed_runner"
  | "iron_will"
  | "glass_cannon"
  | "ng_plus_1"
  | "ng_plus_3"
  | "damage_dealer";

export interface AchievementDef {
  id: AchievementId;
  name: string;
  desc: string;
  icon: string;
}

export type MoveType = "strategy" | "influence" | "execution" | "analytics" | "technical" | "normal";

export interface EnemyMove {
  name: string;
  dmg: number;
  type?: MoveType;
  acc?: number; // 0-100, default 100
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
  taunt?: string;
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
  label?: string; // "Super effective!" etc.
  labelColor?: string;
}

export type Screen = "title" | "classSelect" | "floorIntro" | "battle" | "victory" | "gameOver" | "win" | "hallwayEvent" | "routeChoice" | "promotion" | "actTransition";

// ─── PROMOTIONS ─────────────────────────────────────────────

export interface PromotionTier {
  floor: number;
  title: string;
  statBoost?: { maxHp?: number; atk?: number; def?: number };
  moveUpgrades?: { fromName: string; to: Move }[];
}

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
