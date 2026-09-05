import type { ClassId, ItemId, PlayerClass } from '@/types'
import { BASE_PERK_POOL, PLAYER_CLASSES } from '@/data'
import { newRun } from '../run'
import type { BattleState, RunState } from '../state'
import {
  COWORKER_KITS,
  PARTY_MAX,
  spawnForFloor,
  type AssignmentId,
  type CoworkerId,
  type EncounterId,
  type Facing,
  type FloorId,
  type KeyItemId,
  type PartySlot,
  type ReceiptId,
} from '@/content/office'
import type { Enemy } from '@/types'

export { PARTY_MAX }

export interface PartyMember {
  slot: PartySlot
  def: { kind: 'lead'; classId: ClassId } | { kind: 'coworker'; id: CoworkerId }
  hp: number
  pp: number[]
}

export interface EncounterContext {
  encounterId: EncounterId
  enemy: Enemy
  boss: boolean
  declinable: boolean
  rewards: { xp: number; options: number }
  party: PartyMember[]
  activeIndex: number
}

export interface BenchRecord {
  hp: number
  pp: number[]
}

export interface OfficeSave {
  version: 1 | 2
  run: RunState
  party: PartyMember[]
  hired: CoworkerId[]
  bench: Partial<Record<CoworkerId, BenchRecord>>
  floorId: FloorId
  player: { x: number; y: number; facing: Facing }
  assignments: Record<AssignmentId, string>
  encounters: Record<EncounterId, 'open' | 'won'>
  keyItems: Record<string, number>
  rewardsClaimed: string[]
  flags: string[]
  firedTriggers: string[]
  stats: { battlesWon: number; losses: number; switches: number; msOnFloor: number; rides: number }
}

export type OfficeScreenId = 'overworld' | 'battle' | 'promotion' | 'vending' | 'elevator_ride'

export type Overlay =
  | { kind: 'dialogue'; nodeId: string; line: number }
  | { kind: 'receipt'; receiptId: ReceiptId }
  | { kind: 'stakes'; encounterId: EncounterId }
  | { kind: 'recruit'; coworkerId: CoworkerId }
  | { kind: 'document'; docId: 'agenda' | 'directory' }
  | { kind: 'confirm'; prompt: 'take_five' | 'elevator' | 'door' | 'kessler_door' }
  | { kind: 'team'; mode?: 'default' | 'roster'; returnRecruit?: CoworkerId }
  | { kind: 'coach'; id: 'coach_move' | 'coach_interact' | 'coach_switch' | 'coach_roster' }
  | { kind: 'interstitial'; encounterId: EncounterId }
  | { kind: 'toast'; text: string }
  | { kind: 'handout' }
  | { kind: 'celebration' }
  | { kind: 'elevator_panel' }

export interface OfficeState extends OfficeSave {
  screen: OfficeScreenId
  overlay: Overlay | null
  overlayQueue: Overlay[]
  encounter: EncounterContext | null
  battle: BattleState | null
  lastLossEncounter: EncounterId | null
  benchOpen: boolean
  /** Session-only destination while `screen === 'elevator_ride'`. */
  rideTo: FloorId | null
}

export const OFFICE_VENDING_STOCK: ItemId[] = ['espresso', 'espresso', 'side_hustle']

export function classById(classId: string): PlayerClass {
  return PLAYER_CLASSES.find((c) => c.id === classId) ?? PLAYER_CLASSES[0]
}

export function makeLead(cls: PlayerClass): PartyMember {
  return {
    slot: 'party_slot_0',
    def: { kind: 'lead', classId: cls.id },
    hp: cls.maxHp,
    pp: cls.moves.map((m) => m.pp),
  }
}

export const FRESH_ASSIGNMENTS: Record<AssignmentId, string> = {
  asg_printer: 'not_started',
  asg_meeting_prep: 'not_started',
  asg_transfer: 'not_started',
  asg_audit: 'not_started',
}

export const FRESH_ENCOUNTERS: Record<EncounterId, 'open' | 'won'> = {
  enc_desk_challenger: 'open',
  enc_meeting_prepper: 'open',
  enc_supervisor_1on1: 'open',
  enc_help_desk_intern: 'open',
  enc_auditor: 'open',
  enc_director_review: 'open',
}

export function newOfficeCampaign(cls: PlayerClass): OfficeState {
  const run = {
    ...newRun(cls, { perkPool: BASE_PERK_POOL, relicPool: [] }, 0),
    shopStock: [...OFFICE_VENDING_STOCK],
    stockOptions: 10,
  }
  return {
    version: 2,
    run,
    party: [makeLead(cls)],
    hired: [],
    bench: {},
    floorId: 'floor_01',
    player: spawnForFloor('floor_01'),
    assignments: { ...FRESH_ASSIGNMENTS },
    encounters: { ...FRESH_ENCOUNTERS },
    keyItems: {},
    rewardsClaimed: ['rwd_start_options'],
    flags: [],
    firedTriggers: [],
    stats: { battlesWon: 0, losses: 0, switches: 0, msOnFloor: 0, rides: 0 },
    screen: 'overworld',
    overlay: { kind: 'receipt', receiptId: 'rcpt_signing_bonus' },
    overlayQueue: [{ kind: 'coach', id: 'coach_move' }],
    encounter: null,
    battle: null,
    lastLossEncounter: null,
    benchOpen: false,
    rideTo: null,
  }
}

export function coworkersInParty(party: PartyMember[]): CoworkerId[] {
  return party.flatMap((m) => (m.def.kind === 'coworker' ? [m.def.id] : []))
}

export function toOfficeSave(state: OfficeState): OfficeSave {
  return {
    version: 2,
    run: {
      ...state.run,
      hp: state.party[0]?.hp ?? state.run.hp,
      pp: state.party[0]?.pp ?? state.run.pp,
    },
    party: state.party,
    hired: state.hired ?? coworkersInParty(state.party),
    bench: state.bench ?? {},
    floorId: state.floorId,
    player: state.player,
    assignments: state.assignments,
    encounters: state.encounters,
    keyItems: state.keyItems,
    rewardsClaimed: state.rewardsClaimed,
    flags: state.flags,
    firedTriggers: state.firedTriggers,
    stats: { ...state.stats, rides: state.stats.rides ?? 0 },
  }
}

export function fromOfficeSave(save: OfficeSave): OfficeState {
  const lead = save.party[0]
  const hired = save.hired ?? coworkersInParty(save.party)
  return {
    ...save,
    version: 2,
    hired,
    bench: save.bench ?? {},
    // Saves written before Floor 2 existed lack its keys; they start fresh.
    assignments: { ...FRESH_ASSIGNMENTS, ...save.assignments },
    encounters: { ...FRESH_ENCOUNTERS, ...save.encounters },
    stats: { ...save.stats, rides: save.stats.rides ?? 0 },
    run: {
      ...save.run,
      hp: lead?.hp ?? save.run.hp,
      pp: lead?.pp ?? save.run.pp,
    },
    screen: save.run.pendingPerkOffer ? 'promotion' : 'overworld',
    overlay: null,
    overlayQueue: [],
    encounter: null,
    battle: null,
    lastLossEncounter: null,
    benchOpen: false,
    rideTo: null,
  }
}

export function hasFlag(state: OfficeSave, flag: string): boolean {
  return state.flags.includes(flag)
}

export function withFlag(state: OfficeState, flag: string): OfficeState {
  if (state.flags.includes(flag)) return state
  return { ...state, flags: [...state.flags, flag] }
}

export function keyCount(state: OfficeSave, id: KeyItemId | string): number {
  return state.keyItems[id] ?? 0
}

export function withKey(state: OfficeState, id: string, delta: number): OfficeState {
  const next = Math.max(0, keyCount(state, id) + delta)
  const keyItems = { ...state.keyItems }
  if (next === 0) delete keyItems[id]
  else keyItems[id] = id === 'key_offer_letter' ? Math.min(3, next) : next
  return { ...state, keyItems }
}

export function rewardClaimed(state: OfficeSave, id: string): boolean {
  return state.rewardsClaimed.includes(id)
}

export function inParty(state: OfficeSave, id: CoworkerId): boolean {
  return state.party.some((m) => m.def.kind === 'coworker' && m.def.id === id)
}

export function isHired(state: OfficeSave, id: CoworkerId): boolean {
  return (state.hired ?? []).includes(id)
}

export function directorGateOpen(state: OfficeSave): boolean {
  return (
    state.assignments.asg_transfer === 'complete' &&
    state.encounters.enc_help_desk_intern === 'won' &&
    state.encounters.enc_director_review !== 'won'
  )
}

export function lettersHeld(state: OfficeSave): number {
  return keyCount(state, 'key_offer_letter')
}

export function partyHasRoom(state: OfficeSave): boolean {
  return state.party.length < PARTY_MAX
}

export function supervisorGateOpen(state: OfficeSave): boolean {
  return (
    state.assignments.asg_printer === 'complete' && state.encounters.enc_desk_challenger === 'won'
  )
}

export function allFainted(party: PartyMember[]): boolean {
  return party.every((m) => m.hp <= 0)
}

export function standingBench(party: PartyMember[], activeIndex: number): boolean {
  return party.some((m, i) => i !== activeIndex && m.hp > 0)
}

export function firstStandingIndex(party: PartyMember[]): number {
  const idx = party.findIndex((m) => m.hp > 0)
  return idx < 0 ? 0 : idx
}

export function kitFor(member: PartyMember): PlayerClass {
  if (member.def.kind === 'lead') return classById(member.def.classId)
  return COWORKER_KITS[member.def.id]
}

export function memberName(member: PartyMember): string {
  return member.def.kind === 'lead'
    ? classById(member.def.classId).name
    : COWORKER_KITS[member.def.id].name
}

export function pushOverlay(state: OfficeState, overlay: Overlay): OfficeState {
  if (!state.overlay) return { ...state, overlay }
  return { ...state, overlayQueue: [...state.overlayQueue, overlay] }
}

export function enqueueOverlays(state: OfficeState, overlays: Overlay[]): OfficeState {
  if (overlays.length === 0) return state
  if (!state.overlay) {
    return {
      ...state,
      overlay: overlays[0],
      overlayQueue: [...state.overlayQueue, ...overlays.slice(1)],
    }
  }
  return { ...state, overlayQueue: [...state.overlayQueue, ...overlays] }
}

export function closeOverlay(state: OfficeState): OfficeState {
  const [next, ...rest] = state.overlayQueue
  return { ...state, overlay: next ?? null, overlayQueue: rest }
}

export function heldHandout(state: OfficeSave): KeyItemId | null {
  for (const id of [
    'key_handout_q3_summary',
    'key_handout_q3_deck',
    'key_handout_q2_summary',
  ] as const) {
    if (keyCount(state, id) > 0) return id
  }
  return null
}
