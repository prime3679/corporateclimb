import type { MoveType } from '@/types'
import {
  OFFICE_ENCOUNTERS,
  SPEAKER_SPRITE,
  ZONE_LABEL,
  type DialogueId,
  type InteractTarget,
  type NpcId,
  type SpeakerId,
  type ZoneId,
} from '@/content/office'
import { kitFor, type OfficeSave, type PartyMember } from '@/engine/office'
import { CURRENCY_ICON } from '@/data'
import { ringColorFor } from './ringColor'

export function formatFloorTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** "Floor 1 · Team of 2 · 📈 28 · 11:42 in" — the title/start summary line. */
export function campaignSummary(save: OfficeSave): string {
  return [
    'Floor 1',
    `Team of ${save.party.length}`,
    `${CURRENCY_ICON} ${save.run.stockOptions}`,
    `${formatFloorTime(save.stats.msOnFloor)} in`,
  ].join(' · ')
}

/** Presentation facts about the four coworkers on the floor (design §2). */
export interface CastEntry {
  name: string
  role: string
  spriteId: string
  types: MoveType[]
}

export const NPC_CAST: Record<NpcId, CastEntry> = {
  npc_receptionist: {
    name: 'Renata',
    role: 'Front Desk',
    spriteId: SPEAKER_SPRITE.renata,
    types: ['normal'],
  },
  npc_desk_challenger: {
    name: 'Gavin',
    role: 'Senior Associate',
    spriteId: SPEAKER_SPRITE.gavin,
    types: OFFICE_ENCOUNTERS.enc_desk_challenger.types,
  },
  npc_meeting_prepper: {
    name: 'Priya',
    role: 'Ops',
    spriteId: SPEAKER_SPRITE.priya,
    types: OFFICE_ENCOUNTERS.enc_meeting_prepper.types,
  },
  npc_supervisor: {
    name: 'Holloway',
    role: 'Team Lead (Interim)',
    spriteId: SPEAKER_SPRITE.holloway,
    types: OFFICE_ENCOUNTERS.enc_supervisor_1on1.types,
  },
}

const SPEAKER_NPC: Record<Exclude<SpeakerId, null>, NpcId> = {
  renata: 'npc_receptionist',
  gavin: 'npc_desk_challenger',
  priya: 'npc_meeting_prepper',
  holloway: 'npc_supervisor',
}

/** Lines shouted across the room carry no headshot but still name the speaker. */
const ACROSS_THE_ROOM: Partial<Record<DialogueId, SpeakerId>> = {
  dlg_renata_callout: 'renata',
}

export function castForSpeaker(
  speaker: SpeakerId,
  nodeId?: string,
): { entry: CastEntry; npc: NpcId; acrossRoom: boolean } | null {
  const across = nodeId ? ACROSS_THE_ROOM[nodeId as DialogueId] : undefined
  const id = speaker ?? across ?? null
  if (!id) return null
  const npc = SPEAKER_NPC[id]
  return { entry: NPC_CAST[npc], npc, acrossRoom: !speaker && !!across }
}

export function memberSprite(member: PartyMember): string {
  return kitFor(member).spriteId
}

export function memberRing(member: PartyMember): string {
  return ringColorFor(kitFor(member).types, member.def.kind === 'lead')
}

export function memberRole(member: PartyMember): string {
  if (member.def.kind === 'lead') return kitFor(member).name
  return member.def.id === 'cw_desk_challenger' ? 'Senior Associate' : 'Ops'
}

/** `hud_nearby` copy per design §10.4: "Verb · Object", state-aware. */
export function promptText(target: InteractTarget, state: OfficeSave): string {
  if (target.kind === 'npc') return `Talk · ${NPC_CAST[target.id].name}`
  const badge = (state.keyItems.key_access_badge ?? 0) > 0
  const prep = state.assignments.asg_meeting_prep
  switch (target.id) {
    case 'poi_reception_desk':
      return 'Talk · Renata'
    case 'poi_printer':
      return state.assignments.asg_printer === 'toner_collected'
        ? 'Install toner · Printer'
        : 'Inspect · Printer'
    case 'poi_supply_cabinet':
      return 'Open · Supply cabinet'
    case 'poi_break_counter':
      return 'Take five · Coffee counter'
    case 'poi_vending_machine':
      return 'Buy · Vending'
    case 'poi_agenda':
      return 'Read · Agenda'
    case 'poi_handout_rack':
      return prep === 'accepted' || prep === 'handout_held'
        ? 'Pick · Handout'
        : 'Inspect · Handout rack'
    case 'poi_elevator_door':
      return badge ? 'Ride · Elevator' : 'Badge in · Elevator'
    case 'poi_directory_sign':
      return 'Read · Directory'
    case 'poi_exit_door':
      return 'Inspect · Exit'
    case 'poi_water_cooler':
      return 'Inspect · Water cooler'
    case 'poi_break_table':
      return 'Inspect · Break table'
    case 'poi_supervisor_door':
      return 'Inspect · Glass door'
  }
}

export function promptVerb(text: string): string {
  return text.split(' · ')[0]
}

/** Zone accents (one per room) — the carpet tint, chip bar and destination chip color. */
export const ZONE_ACCENT: Record<ZoneId, string> = {
  zone_reception: '#e0b34a',
  zone_desks: '#4d8fe0',
  zone_break: '#48b98a',
  zone_meeting: '#a86ee8',
  zone_elevator: '#e0844d',
  zone_hall: '#8b98a8',
}

export { ZONE_LABEL }
