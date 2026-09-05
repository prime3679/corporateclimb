import { inBounds, isKnownFloorId } from '@/content/office'
import {
  coworkersInParty,
  fromOfficeSave,
  mergeVendingStock,
  toOfficeSave,
  type OfficeSave,
  type OfficeState,
} from './state'

export const OFFICE_SAVE_KEY = 'corporate-climb-office-save'
export const OFFICE_SAVE_VERSION = 2

function coworkersFromUnknown(party: OfficeSave['party']): OfficeSave['hired'] {
  return coworkersInParty(party)
}

export function migrateOfficeSave(
  raw: Partial<OfficeSave> & { version?: number },
): OfficeSave | null {
  if (!raw.run || !Array.isArray(raw.party) || raw.party.length < 1) return null
  if (!isKnownFloorId(raw.floorId)) return null
  if (
    !raw.player ||
    !inBounds(raw.player.x, raw.player.y) ||
    !['n', 'e', 's', 'w'].includes(raw.player.facing)
  )
    return null
  if (raw.version !== 1 && raw.version !== 2) return null
  const hired = raw.hired ?? coworkersFromUnknown(raw.party)
  const save = raw as OfficeSave
  return {
    ...save,
    version: 2,
    hired,
    bench: raw.bench ?? {},
    stats: { rides: 0, battlesWon: 0, losses: 0, switches: 0, msOnFloor: 0, ...raw.stats },
    vendingStock: mergeVendingStock(save.vendingStock, save.run.shopStock),
  }
}

export function saveOffice(state: OfficeState | OfficeSave) {
  try {
    const save = 'overlay' in state ? toOfficeSave(state) : state
    localStorage.setItem(OFFICE_SAVE_KEY, JSON.stringify({ ...save, version: OFFICE_SAVE_VERSION }))
  } catch {
    /* storage unavailable */
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
