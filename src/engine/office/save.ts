import { ENCOUNTER_RECEIPT, inBounds, isKnownFloorId, type EncounterId } from '@/content/office'
import { isRecord } from '../validation'
import { validOfficeShape } from './validate'
import {
  coworkersInParty,
  fromOfficeSave,
  mergeVendingStock,
  toOfficeSave,
  type OfficeSave,
  type OfficeState,
} from './state'

export const OFFICE_SAVE_KEY = 'corporate-climb-office-save'
export const OFFICE_SAVE_VERSION = 3

/** v2 → v3: a victory could be saved before its receipt awarded the promotion.
 * Recover only unclaimed promotions, without replaying XP or currency payouts.
 * Keep the ordered queue so even a save with several missed picks can recover. */
function recoverLegacyContinuation(save: OfficeSave): NonNullable<OfficeSave['continuation']> {
  const bosses: EncounterId[] = [
    'enc_supervisor_1on1',
    'enc_director_review',
    'enc_vp_product',
    'enc_vp_sales',
    'enc_ceo_review',
  ]
  return {
    overlays: bosses.flatMap((id, i) =>
      save.encounters?.[id] === 'won' && !save.rewardsClaimed?.includes(`rwd_promotion_f${i + 1}`)
        ? [{ kind: 'receipt' as const, receiptId: ENCOUNTER_RECEIPT[id] }]
        : [],
    ),
    rideTo: null,
  }
}

function coworkersFromUnknown(party: OfficeSave['party']): OfficeSave['hired'] {
  return coworkersInParty(party)
}

export function migrateOfficeSave(value: unknown): OfficeSave | null {
  if (!isRecord(value)) return null
  const raw = value as Partial<OfficeSave>
  if (!validOfficeShape(raw)) return null
  if (!isKnownFloorId(raw.floorId)) return null
  if (
    !raw.player ||
    !Number.isInteger(raw.player.x) ||
    !Number.isInteger(raw.player.y) ||
    !inBounds(raw.player.x, raw.player.y) ||
    !['n', 'e', 's', 'w'].includes(raw.player.facing)
  )
    return null
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3) return null
  const save = raw as OfficeSave
  const hired = raw.hired ?? coworkersFromUnknown(save.party)
  return {
    ...save,
    version: 3,
    hired,
    bench: raw.bench ?? {},
    stats: { rides: 0, battlesWon: 0, losses: 0, switches: 0, msOnFloor: 0, ...raw.stats },
    vendingStock: mergeVendingStock(save.vendingStock, save.run.shopStock),
    continuation: raw.version < 3 ? recoverLegacyContinuation(save) : save.continuation,
  }
}

export function saveOffice(state: OfficeState | OfficeSave) {
  try {
    const save = 'overlay' in state ? toOfficeSave(state) : state
    localStorage.setItem(OFFICE_SAVE_KEY, JSON.stringify({ ...save, version: OFFICE_SAVE_VERSION }))
    return true
  } catch {
    return false
  }
}

export function loadOfficeSave(): OfficeSave | null {
  try {
    const raw = localStorage.getItem(OFFICE_SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OfficeSave> & { version?: number }
    return migrateOfficeSave(parsed)
  } catch {
    return null
  }
}

export function loadOffice(): OfficeState | null {
  const save = loadOfficeSave()
  return save ? fromOfficeSave(save) : null
}

export function clearOfficeSave() {
  try {
    localStorage.removeItem(OFFICE_SAVE_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function hasOfficeSave(): boolean {
  return loadOfficeSave() !== null
}
