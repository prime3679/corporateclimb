import { inBounds, isKnownFloorId } from '@/content/office'
import { fromOfficeSave, toOfficeSave, type OfficeSave, type OfficeState } from './state'

export const OFFICE_SAVE_KEY = 'corporate-climb-office-save'
export const OFFICE_SAVE_VERSION = 1

export function saveOffice(state: OfficeState | OfficeSave) {
  try {
    const save = 'overlay' in state ? toOfficeSave(state) : state
    localStorage.setItem(OFFICE_SAVE_KEY, JSON.stringify(save))
  } catch {
    /* storage unavailable */
  }
}

export function loadOfficeSave(): OfficeSave | null {
  try {
    const raw = localStorage.getItem(OFFICE_SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OfficeSave
    if (parsed?.version !== OFFICE_SAVE_VERSION) return null
    if (!parsed.run || !Array.isArray(parsed.party) || parsed.party.length < 1) return null
    if (!isKnownFloorId(parsed.floorId)) return null
    if (
      !parsed.player ||
      !inBounds(parsed.player.x, parsed.player.y) ||
      !['n', 'e', 's', 'w'].includes(parsed.player.facing)
    )
      return null
    return parsed
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
