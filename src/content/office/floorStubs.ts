// Walkable stub floors 3–5. Geometry is engine-owned so Fable can replace
// art, props and copy without changing arrival, boarding or FloorId keys.
// Contract: docs/rpg/floors-3-5-content-contract.md

import type { Facing } from './ids'

/** 24×18, same frame as Floors 1–2. `@` is the arrival tile (rendered as floor). */
export const STUB_ART = [
  '########################',
  '#.EER..................#',
  '#..@...................#',
  '#......................#',
  '#....i.................#',
  '#p.....................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#p...................p.#',
  '########################',
] as const

export const STUB_SOLID_GLYPHS = new Set('#ER'.split(''))

export const STUB_ARRIVAL = { x: 3, y: 2, facing: 's' as Facing }

export const STUB_BOARDING: ReadonlyArray<{ x: number; y: number; facing: Facing }> = [
  { x: 2, y: 2, facing: 'n' },
  { x: 3, y: 2, facing: 'n' },
]

export const STUB_DEFEAT_RESPAWN = { x: 6, y: 4, facing: 'n' as Facing }

export function stubZoneAt(x: number, y: number): 'zone_landing' | 'zone_hall_f2' {
  if (x >= 1 && x <= 8 && y >= 1 && y <= 5) return 'zone_landing'
  return 'zone_hall_f2'
}

export const STUB_DIRECTORY_TEXT = [
  'Unmapped floor. Elevator: you are standing at it.',
  'Fable fills rooms, NPCs and props. The shaft and arrival stay put.',
] as const
