import { DialogueNode } from '../../../ui/stores/dialogueState'

export type CorporateTheme = 'campus' | 'mailroom' | 'cubicle_farm' | 'open_office' | 'middle_mgmt' | 'executive' | 'csuite' | 'garage' | 'boardroom'

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
  type: 'alarm_clock' | 'freeloader' | 'midterm_stack' | 'party_invite' | 'resume_gap' | 'networking_crowd' | 'linkedin_swarm' | 'overachiever' | 'coffee_run' | 'slack_barrage' | 'credit_thief' | 'scope_creep_blob' | 'golden_handcuffs'
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
  // Coffee run
  projectileSpeed?: number
  // Slack barrage
  bubbleCount?: number
  // Credit thief
  stolenPowerUps?: number
  // Scope creep blob
  baseSize?: number
  growthRate?: number
  maxSize?: number
}

// Reorg event config — platforms swap to alternate layout
export interface ReorgConfig {
  triggerX: number // player x position that triggers reorg
  preReorgPlatforms: PlatformConfig[] // platforms before reorg (indices into main array)
  postReorgPlatforms: PlatformConfig[] // replacement platforms after reorg
  narratorDialogue?: string
}

export interface PowerUpConfig {
  type: 'espresso' | 'networking_card' | 'pto_day' | 'side_hustle' | 'linkedin_endorsement' | 'mentors_advice' | 'energy_drink' | 'usb_drive' | 'business_card' | 'stress_ball'
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

export type NpcType = 'default' | 'intern' | 'manager' | 'executive' | 'it_guy' | 'hr'

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
  npcType?: NpcType
  meetingBattle?: boolean
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
  theme?: CorporateTheme
  platforms: PlatformConfig[]
  backgrounds: BackgroundLayer[]
  bounds: { left: number; right: number; top: number; bottom: number }
  enemies?: EnemyConfig[]
  powerUps?: PowerUpConfig[]
  dialogueTriggers?: DialogueTriggerConfig[]
  boss?: BossConfig
  pitZones?: { x: number; width: number; energyCost: number }[]
  timedDoors?: TimedDoorConfig[]
  reorg?: ReorgConfig
}
