import type { DialogueTree } from "./dialogueTypes";

export type PlatformType = "solid" | "one-way" | "moving";

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  /** For moving platforms: movement range in px */
  moveRange?: number;
  /** For moving platforms: speed in px/s */
  moveSpeed?: number;
  /** For moving platforms: "horizontal" | "vertical" */
  moveAxis?: "horizontal" | "vertical";
  /** Optional color override (hex number, e.g. 0x334155) */
  color?: number;
}

export interface BackgroundLayerConfig {
  color: string;
  scrollFactor: number;
  y: number;
  height: number;
}

/* ─── Enemies ─── */

export type EnemyType = "alarm_clock" | "freeloader" | "midterm_stack";

export interface EnemyConfig {
  type: EnemyType;
  x: number;
  y: number;
  /** For alarm_clock: patrol range. For midterm_stack: spawn zone width */
  range?: number;
  /** Movement speed override */
  speed?: number;
}

/* ─── Power-ups ─── */

export type PowerUpType = "double_espresso" | "networking_card" | "pto_day";

export interface PowerUpConfig {
  type: PowerUpType;
  x: number;
  y: number;
}

/* ─── NPCs (dialogue triggers with visuals) ─── */

export interface NPCConfig {
  id: string;
  x: number;
  y: number;
  dialogueId: string;
  startNodeId: string;
  tree: DialogueTree;
  oneShot?: boolean;
  /** NPC visual color (hex number) */
  color?: number;
  /** NPC label text shown above */
  label?: string;
}

/* ─── Boss ─── */

export interface BossConfig {
  type: string;
  x: number;
  y: number;
  /** Arena boundaries (left, right, floor y) */
  arenaLeft: number;
  arenaRight: number;
  arenaFloorY: number;
  /** Health points */
  health: number;
  /** Phase-specific dialogue trees for dialogue phases */
  dialogueTrees?: Record<string, DialogueTree>;
}

/* ─── Decorations ─── */

export type DecorationType =
  | "tree"
  | "lamppost"
  | "bench"
  | "building"
  | "dorm_interior"
  | "music_note"
  | "cloud"
  | "bush"
  | "steps"
  | "door";

export interface DecorationConfig {
  type: DecorationType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: number;
  /** Parallax scroll factor (defaults to 1 = normal) */
  scrollFactor?: number;
  /** Extra data (label text, etc) */
  data?: Record<string, unknown>;
}

/* ─── Tutorial prompts ─── */

export interface TutorialPromptConfig {
  /** Trigger x position (prompt shows when player passes this x) */
  triggerX: number;
  text: string;
  /** Which action dismisses this prompt */
  dismissOn: "move" | "jump" | "dodge" | "interact";
}

/* ─── Full level config ─── */

export interface LevelConfig {
  name: string;
  bounds: { width: number; height: number };
  spawn: { x: number; y: number };
  platforms: PlatformConfig[];
  backgroundLayers: BackgroundLayerConfig[];
  enemies?: EnemyConfig[];
  powerUps?: PowerUpConfig[];
  npcs?: NPCConfig[];
  boss?: BossConfig;
  decorations?: DecorationConfig[];
  tutorialPrompts?: TutorialPromptConfig[];
}
