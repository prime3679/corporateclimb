import { DialogueNode } from '../../../ui/stores/dialogueState'

export interface PlatformConfig {
  x: number
  y: number
  width: number
  height: number
  type: 'solid' | 'one-way' | 'moving'
  moveX?: number
  moveY?: number
  moveSpeed?: number
  color?: number
}

export interface BackgroundLayer {
  color: number
  scrollFactor: number
  rects: { x: number; y: number; width: number; height: number; color?: number }[]
}

export interface EnemyConfig {
  type: 'alarm_clock' | 'freeloader' | 'midterm_stack' | 'party_invite'
  x: number
  y: number
  // Alarm clock
  speed?: number
  direction?: number // 1 or -1
  patrolMin?: number
  patrolMax?: number
  // Midterm stack
  spawnInterval?: number
  spawnWidth?: number
}

export interface PowerUpConfig {
  type: 'espresso' | 'networking_card' | 'pto_day' | 'side_hustle'
  x: number
  y: number
}

export interface DialogueTriggerConfig {
  id: string
  x: number
  y: number
  width: number
  height: number
  dialogueId: string
  startNodeId: string
  dialogueTree: DialogueNode[]
  oneShot: boolean
  npcColor?: number
  npcWidth?: number
  npcHeight?: number
}

export interface BossConfig {
  type: string
  arenaStart: number
  arenaEnd: number
  arenaY: number
}

export interface LevelConfig {
  id: string
  name: string
  width: number
  height: number
  spawn: { x: number; y: number }
  platforms: PlatformConfig[]
  backgrounds: BackgroundLayer[]
  bounds: { left: number; right: number; top: number; bottom: number }
  enemies?: EnemyConfig[]
  powerUps?: PowerUpConfig[]
  dialogueTriggers?: DialogueTriggerConfig[]
  boss?: BossConfig
  pitZones?: { x: number; width: number; energyCost: number }[]
}
