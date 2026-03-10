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
  type: 'alarm_clock' | 'freeloader' | 'midterm_stack' | 'party_invite' | 'resume_gap' | 'networking_crowd' | 'linkedin_swarm' | 'overachiever'
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
  // Resume gap
  gapWidth?: number
  // Networking crowd
  zoneWidth?: number
  zoneHeight?: number
  slowFactor?: number
  // LinkedIn swarm
  count?: number
  radius?: number
  // Overachiever
  targetX?: number // where they race to
}

export interface PowerUpConfig {
  type: 'espresso' | 'networking_card' | 'pto_day' | 'side_hustle' | 'linkedin_endorsement' | 'mentors_advice'
  x: number
  y: number
}

// Timed door that opens/closes on a cycle
export interface TimedDoorConfig {
  x: number
  y: number
  width: number
  height: number
  openDuration: number  // ms
  closeDuration: number // ms
  startOpen?: boolean
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
  timedDoors?: TimedDoorConfig[]
}
