import { ITEMS, PLAYER_CLASSES } from '@/data'
import {
  COWORKER_KITS,
  DIALOGUE,
  FLOOR_IDS,
  OFFICE_ENCOUNTERS,
  PARTY_MAX,
  RECEIPTS,
} from '@/content/office'
import { isCount, isRecord, isStringList, owns } from '../validation'
import { isValidRun } from '../save'
import type { OfficeSave } from './state'

function validOverlay(value: unknown): boolean {
  if (!isRecord(value)) return false
  switch (value.kind) {
    case 'receipt':
      return owns(RECEIPTS, value.receiptId)
    case 'dialogue':
      return (
        typeof value.nodeId === 'string' &&
        (owns(DIALOGUE, value.nodeId) || value.nodeId.startsWith('inspect:')) &&
        Number.isInteger(value.line) &&
        isCount(value.line)
      )
    case 'stakes':
    case 'interstitial':
      return owns(OFFICE_ENCOUNTERS, value.encounterId)
    case 'recruit':
      return owns(COWORKER_KITS, value.coworkerId)
    case 'document':
      return value.docId === 'agenda' || value.docId === 'directory'
    case 'confirm':
      return (
        ['take_five', 'elevator', 'door', 'kessler_door'].includes(String(value.prompt)) ||
        (value.prompt === 'send_to_desk' &&
          Number.isInteger(value.slot) &&
          isCount(value.slot) &&
          value.slot < PARTY_MAX)
      )
    case 'pause':
      return value.reason === 'badge_print'
    case 'team':
      return (
        (value.mode === undefined || value.mode === 'default' || value.mode === 'roster') &&
        (value.returnRecruit === undefined || owns(COWORKER_KITS, value.returnRecruit))
      )
    case 'coach':
      return [
        'coach_move',
        'coach_interact',
        'coach_pin',
        'coach_switch',
        'coach_roster',
        'coach_elevator',
      ].includes(String(value.id))
    case 'toast':
      return typeof value.text === 'string'
    case 'handout':
      return true
    case 'celebration':
      return [
        'screen_preview_complete',
        'screen_floor2_complete',
        'screen_floor3_complete',
        'screen_floor4_complete',
        'screen_floor5_complete',
      ].includes(String(value.screen))
    case 'elevator_panel':
      return value.denyNote === undefined || typeof value.denyNote === 'string'
    default:
      return false
  }
}

/** Validate before any UI/kit lookups. Older floor tables are merged on resume. */
export function validOfficeShape(raw: Partial<OfficeSave>): boolean {
  if (
    !isValidRun(raw.run) ||
    !Array.isArray(raw.party) ||
    raw.party.length < 1 ||
    raw.party.length > PARTY_MAX
  )
    return false
  const seen = new Set<string>()
  for (let i = 0; i < raw.party.length; i++) {
    const member = raw.party[i]
    if (!isRecord(member) || !isRecord(member.def)) return false
    if (
      member.slot !== `party_slot_${i}` ||
      !isCount(member.hp) ||
      !Array.isArray(member.pp) ||
      !member.pp.every(isCount)
    )
      return false
    if (i === 0) {
      if (member.def.kind !== 'lead' || member.def.classId !== raw.run.classId) return false
      if (member.pp.length !== PLAYER_CLASSES.find((c) => c.id === raw.run!.classId)!.moves.length)
        return false
    } else {
      if (
        member.def.kind !== 'coworker' ||
        !owns(COWORKER_KITS, member.def.id) ||
        seen.has(member.def.id)
      )
        return false
      seen.add(member.def.id)
      if (member.pp.length !== COWORKER_KITS[member.def.id].moves.length) return false
    }
  }
  if (
    raw.hired !== undefined &&
    (!isStringList(raw.hired) || !raw.hired.every((id) => owns(COWORKER_KITS, id)))
  )
    return false
  if (
    raw.bench !== undefined &&
    (!isRecord(raw.bench) ||
      !Object.entries(raw.bench).every(
        ([id, member]) =>
          owns(COWORKER_KITS, id) &&
          isRecord(member) &&
          isCount(member.hp) &&
          Array.isArray(member.pp) &&
          Object.entries(COWORKER_KITS).some(
            ([kitId, kit]) => id === kitId && member.pp.length === kit.moves.length,
          ) &&
          member.pp.every(isCount),
      ))
  )
    return false
  if (
    !isRecord(raw.assignments) ||
    !Object.values(raw.assignments).every((v) => typeof v === 'string')
  )
    return false
  if (
    !isRecord(raw.encounters) ||
    !Object.values(raw.encounters).every((v) => v === 'won' || v === 'open')
  )
    return false
  if (!isRecord(raw.keyItems) || !Object.values(raw.keyItems).every(isCount)) return false
  if (![raw.flags, raw.rewardsClaimed, raw.firedTriggers].every(isStringList)) return false
  if (raw.stats !== undefined && (!isRecord(raw.stats) || !Object.values(raw.stats).every(isCount)))
    return false
  if (
    raw.vendingStock !== undefined &&
    (!isRecord(raw.vendingStock) ||
      !Object.values(raw.vendingStock).every(
        (stock) => isStringList(stock) && stock.every((id) => owns(ITEMS, id)),
      ))
  )
    return false
  if (raw.continuation !== undefined) {
    const next = raw.continuation
    if (
      !isRecord(next) ||
      !Array.isArray(next.overlays) ||
      next.overlays.length > 32 ||
      !next.overlays.every(validOverlay)
    )
      return false
    if (next.rideTo !== null && !FLOOR_IDS.includes(next.rideTo)) return false
  }
  return true
}
