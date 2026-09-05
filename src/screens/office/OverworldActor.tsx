import type { CSSProperties } from 'react'
import { MOVE_MS, TILE_SIZE, type Facing, type NpcId } from '@/content/office'
import styles from './OverworldActor.module.css'

export const ACTOR_IDS = [
  'lead_eng',
  'lead_design',
  'lead_pm',
  'renata',
  'gavin',
  'priya',
  'holloway',
  // Floor 2 cast (docs/rpg/floor-2-design.md §2)
  'teddy',
  'kessler',
  'whitlock',
] as const

export type OfficeActorId = (typeof ACTOR_IDS)[number]

const SPRITE_TO_ACTOR: Record<string, OfficeActorId> = {
  eng: 'lead_eng',
  design: 'lead_design',
  product_manager: 'lead_pm',
  recruiter: 'renata',
  overachiever: 'gavin',
  scrum: 'priya',
  manager: 'holloway',
  intern: 'teddy',
  vp: 'kessler',
  boss: 'whitlock',
}

export const NPC_ACTOR: Record<NpcId, OfficeActorId> = {
  npc_receptionist: 'renata',
  npc_desk_challenger: 'gavin',
  npc_meeting_prepper: 'priya',
  npc_supervisor: 'holloway',
  npc_help_desk_intern: 'teddy',
  npc_auditor: 'whitlock',
  npc_director: 'kessler',
}

export function actorIdForSprite(spriteId: string): OfficeActorId {
  return SPRITE_TO_ACTOR[spriteId] ?? 'lead_eng'
}

export function leadActorId(classId: string): OfficeActorId {
  if (classId === 'design') return 'lead_design'
  if (classId === 'pm') return 'lead_pm'
  return 'lead_eng'
}

export function actorSheetUrl(id: OfficeActorId): string {
  return `/office/actors/${id}.png`
}

/**
 * Full-body overworld token. Facing selects a sheet row; a tile change
 * retriggers a one-shot 250ms walk (idle / stepL / idle / stepR).
 * Dialogue / party chips keep Headshot — this token does not mount one
 * (a map-token Headshot created a circular import crash).
 */
export default function OverworldActor({
  actorId,
  ring,
  facing,
  x,
  y,
  player = false,
  label,
}: {
  actorId: OfficeActorId
  ring: string
  facing: Facing
  x: number
  y: number
  player?: boolean
  label: string
}) {
  const tileKey = `${x},${y}`

  return (
    <div
      className={[styles.actor, player ? styles.player : '', styles[`face_${facing}`]]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          left: x * TILE_SIZE,
          top: y * TILE_SIZE - (40 - TILE_SIZE),
          '--walk-ms': `${MOVE_MS}ms`,
          '--actor-ring': ring,
        } as CSSProperties
      }
      aria-label={label}
      role="img"
    >
      <span className={styles.ground} aria-hidden />
      <span
        key={tileKey}
        className={`${styles.sheet} ${styles.walking}`}
        style={{ backgroundImage: `url(${actorSheetUrl(actorId)})` }}
        aria-hidden
      />
    </div>
  )
}
