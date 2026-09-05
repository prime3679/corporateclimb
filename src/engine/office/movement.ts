import {
  interactSpotsForFloor,
  npcSightForFloor,
  npcTilesForFloor,
  inBounds,
  isSolid,
  type InteractTarget,
} from '@/content/office'
import type { Facing, NpcId } from '@/content/office'
import type { OfficeState } from './state'

const DELTA: Record<Facing, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
}

export function stepDelta(dir: Facing) {
  return DELTA[dir]
}

export function tryStep(state: OfficeState, dir: Facing): { state: OfficeState; moved: boolean } {
  const dest = { x: state.player.x + DELTA[dir].x, y: state.player.y + DELTA[dir].y }
  const facingOnly = { ...state, player: { ...state.player, facing: dir } }
  if (!inBounds(dest.x, dest.y) || isSolid(dest.x, dest.y, state.floorId)) {
    return { state: facingOnly, moved: false }
  }
  if (occupiesNpc(state, dest.x, dest.y)) {
    return { state: facingOnly, moved: false }
  }
  return { state: { ...state, player: { x: dest.x, y: dest.y, facing: dir } }, moved: true }
}

export function occupiesNpc(state: OfficeState, x: number, y: number): boolean {
  return Object.values(npcTilesForFloor(state.floorId)).some(
    (tile) => tile && tile.x === x && tile.y === y,
  )
}

export function interactTarget(state: OfficeState): InteractTarget | null {
  const spot = interactSpotsForFloor(state.floorId).find(
    (s) => s.x === state.player.x && s.y === state.player.y && s.facing === state.player.facing,
  )
  if (spot) return spot.target
  const ahead = {
    x: state.player.x + DELTA[state.player.facing].x,
    y: state.player.y + DELTA[state.player.facing].y,
  }
  for (const [id, tile] of Object.entries(npcTilesForFloor(state.floorId)) as [
    NpcId,
    { x: number; y: number } | undefined,
  ][]) {
    if (!tile) continue
    if (tile.x === ahead.x && tile.y === ahead.y) {
      const names: Record<NpcId, string> = {
        npc_receptionist: 'Renata',
        npc_desk_challenger: 'Gavin',
        npc_meeting_prepper: 'Priya',
        npc_supervisor: 'Holloway',
        npc_floor2_contractor: 'Callie',
      }
      return { kind: 'npc', id, label: `Talk · ${names[id]}` }
    }
  }
  return null
}

export function sightlineNpc(state: OfficeState): NpcId | null {
  const { x, y } = state.player
  for (const [id, spots] of Object.entries(npcSightForFloor(state.floorId)) as [
    NpcId,
    { x: number; y: number }[] | undefined,
  ][]) {
    if (spots?.some((tile) => tile.x === x && tile.y === y)) return id
  }
  return null
}
