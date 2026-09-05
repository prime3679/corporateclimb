// Frozen Floor 2 content — names match docs/rpg/floor-2-design.md §12.
//
// Tables only. map.ts keys these under `floor_02`; the paper-playtest test
// (src/__tests__/office/floor2-map.test.ts) checks the doc, the art and the
// engine against the same coordinates so none of them can drift.

import type { Facing, NpcId, PoiId, ZoneId } from './ids'

export const FLOOR_2_ID = 'floor_02' as const

/** 24×18, same frame as Floor 1. `@` is the arrival tile (rendered as floor). */
export const FLOOR_2_ART = [
  '########################',
  '#.EER.#.....BG#.ff.....#',
  '#..@..#.===b.G#......p.#',
  '#.....D..5....D..QQQ...#',
  '#...i.#......G#.....LL.#',
  '#p...p#......G#p.......#',
  '###D#####D##########D###',
  '#......................#',
  '#.....................w#',
  '###D####D##########D####',
  '#......#.SKKK..#ff....$#',
  '#......#.......#==.....#',
  '#c.....#k.....V#cc.6==.#',
  '#..7dd.#k.tt...#.......#',
  '#....c.#.......#==.....#',
  '#LL....#......j#cc.....#',
  '#p....p#p.....p#p.....m#',
  '########################',
] as const

export const FLOOR_2_SOLID_GLYPHS = new Set('#ERfwBGb=QLSKV$ckdtjmpi567'.split(''))

export function floor2GlyphAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= 24 || y >= 18) return '#'
  const raw = FLOOR_2_ART[y][x]
  return raw === '@' ? '.' : raw
}

export function floor2IsSolid(x: number, y: number): boolean {
  return FLOOR_2_SOLID_GLYPHS.has(floor2GlyphAt(x, y))
}

export const FLOOR_2_DIRECTORY_TEXT = [
  'FLOOR 2 — OPERATIONS. Help desk: through the glass. People Ops: far right.',
  'Director: down the hall, left. Facilities: middle. Finance: right.',
  "Elevator: you're standing at it.",
]

/** Same shaft as Floor 1: E at (2,1)/(3,1), reader at (4,1). Arrival mirrors POST_CELEBRATION. */
export const FLOOR_2_ARRIVAL = { x: 3, y: 2, facing: 's' as Facing }
export const FLOOR_2_DEFEAT_RESPAWN = { x: 11, y: 11, facing: 'n' as Facing }
export const FLOOR_2_DOOR_STEP_IN = { x: 3, y: 10, facing: 's' as Facing }
export const FLOOR_2_DOOR_STEP_BACK = { x: 3, y: 8, facing: 'n' as Facing }
export const FLOOR_2_DIRECTOR_DOOR = { x: 3, y: 9 }

export type Floor2ZoneId = Extract<
  ZoneId,
  | 'zone_landing'
  | 'zone_it'
  | 'zone_people'
  | 'zone_director'
  | 'zone_facilities'
  | 'zone_finance'
  | 'zone_hall_f2'
>

export const FLOOR_2_ZONE_LABEL: Record<Floor2ZoneId, string> = {
  zone_landing: 'LANDING',
  zone_it: 'HELP DESK',
  zone_people: 'PEOPLE OPS',
  zone_director: "DIRECTOR'S OFFICE",
  zone_facilities: 'FACILITIES',
  zone_finance: 'FINANCE',
  zone_hall_f2: 'HALL',
}

/** Carpet tint / chip bar / destination chip colour per zone (design §1.3). */
export const FLOOR_2_ZONE_ACCENT: Record<Floor2ZoneId, string> = {
  zone_landing: '#e0844d',
  zone_it: '#4d8fe0',
  zone_people: '#d178b8',
  zone_director: '#e0b34a',
  zone_facilities: '#5aa9b8',
  zone_finance: '#6fae5c',
  zone_hall_f2: '#8b98a8',
}

/** Floor material atlas cell per zone. Landing and hall reuse Floor 1 cells on purpose. */
export const FLOOR_2_ZONE_FLOOR: Record<Floor2ZoneId, string> = {
  zone_landing: 'floor_elevator',
  zone_it: 'floor_it',
  zone_people: 'floor_people',
  zone_director: 'floor_director',
  zone_facilities: 'floor_facilities',
  zone_finance: 'floor_finance',
  zone_hall_f2: 'floor_hall',
}

export function floor2ZoneAt(x: number, y: number): Floor2ZoneId {
  if (x >= 1 && x <= 5 && y >= 1 && y <= 5) return 'zone_landing'
  if (x >= 7 && x <= 13 && y >= 1 && y <= 5) return 'zone_it'
  if (x >= 15 && x <= 22 && y >= 1 && y <= 5) return 'zone_people'
  if (x >= 1 && x <= 6 && y >= 10 && y <= 16) return 'zone_director'
  if (x >= 8 && x <= 14 && y >= 10 && y <= 16) return 'zone_facilities'
  if (x >= 16 && x <= 22 && y >= 10 && y <= 16) return 'zone_finance'
  return 'zone_hall_f2'
}

export type Floor2NpcId = Extract<NpcId, 'npc_help_desk_intern' | 'npc_auditor' | 'npc_director'>

export const FLOOR_2_NPC_GLYPH: Record<Floor2NpcId, string> = {
  npc_help_desk_intern: '5',
  npc_auditor: '6',
  npc_director: '7',
}

export const FLOOR_2_NPC_NAME: Record<Floor2NpcId, string> = {
  npc_help_desk_intern: 'Teddy',
  npc_auditor: 'Whitlock',
  npc_director: 'Kessler',
}

export const FLOOR_2_NPC_TILE: Record<Floor2NpcId, { x: number; y: number; facing: Facing }> = {
  npc_help_desk_intern: { x: 9, y: 3, facing: 's' },
  npc_auditor: { x: 19, y: 12, facing: 'n' },
  npc_director: { x: 3, y: 13, facing: 'n' },
}

export const FLOOR_2_NPC_SIGHT: Record<Floor2NpcId, { x: number; y: number }[]> = {
  npc_help_desk_intern: [
    { x: 9, y: 4 },
    { x: 9, y: 5 },
    { x: 9, y: 6 },
  ],
  npc_auditor: [
    { x: 19, y: 11 },
    { x: 19, y: 10 },
    { x: 19, y: 9 },
  ],
  npc_director: [
    { x: 3, y: 12 },
    { x: 3, y: 11 },
    { x: 3, y: 10 },
  ],
}

export type Floor2PoiId = Extract<
  PoiId,
  | 'poi_elevator_door_f2'
  | 'poi_directory_sign_f2'
  | 'poi_photo_booth'
  | 'poi_badge_printer'
  | 'poi_server_rack'
  | 'poi_help_desk'
  | 'poi_people_tray'
  | 'poi_filing_cabinets'
  | 'poi_water_cooler_f2'
  | 'poi_director_door'
  | 'poi_director_desk'
  | 'poi_supply_cabinet_f2'
  | 'poi_break_counter_f2'
  | 'poi_vending_machine_f2'
  | 'poi_break_table_f2'
  | 'poi_lockers'
  | 'poi_janitor_cart'
  | 'poi_safe'
  | 'poi_shredder'
>

export type Floor2InteractTarget =
  | { kind: 'npc'; id: Floor2NpcId; label: string }
  | { kind: 'poi'; id: Floor2PoiId; label: string }

export interface Floor2InteractSpot {
  x: number
  y: number
  facing: Facing
  target: Floor2InteractTarget
}

const npc = (x: number, y: number, facing: Facing, id: Floor2NpcId): Floor2InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'npc', id, label: `Talk · ${FLOOR_2_NPC_NAME[id]}` },
})

const poi = (
  x: number,
  y: number,
  facing: Facing,
  id: Floor2PoiId,
  label: string,
): Floor2InteractSpot => ({ x, y, facing, target: { kind: 'poi', id, label } })

export const FLOOR_2_INTERACT_SPOTS: Floor2InteractSpot[] = [
  npc(8, 3, 'e', 'npc_help_desk_intern'),
  npc(10, 3, 'w', 'npc_help_desk_intern'),
  npc(9, 4, 'n', 'npc_help_desk_intern'),
  npc(19, 11, 's', 'npc_auditor'),
  npc(18, 12, 'e', 'npc_auditor'),
  npc(19, 13, 'n', 'npc_auditor'),
  npc(3, 12, 's', 'npc_director'),
  npc(2, 13, 'e', 'npc_director'),
  poi(2, 2, 'n', 'poi_elevator_door_f2', 'Elevator'),
  poi(3, 2, 'n', 'poi_elevator_door_f2', 'Elevator'),
  poi(4, 2, 'n', 'poi_elevator_door_f2', 'Elevator'),
  poi(5, 1, 'w', 'poi_elevator_door_f2', 'Elevator'),
  poi(3, 4, 'e', 'poi_directory_sign_f2', 'Read · Directory'),
  poi(5, 4, 'w', 'poi_directory_sign_f2', 'Read · Directory'),
  poi(4, 3, 's', 'poi_directory_sign_f2', 'Read · Directory'),
  poi(4, 5, 'n', 'poi_directory_sign_f2', 'Read · Directory'),
  poi(12, 2, 'n', 'poi_photo_booth', 'Take photo · Booth'),
  poi(11, 1, 'e', 'poi_photo_booth', 'Take photo · Booth'),
  poi(11, 3, 'n', 'poi_badge_printer', 'Inspect · Badge printer'),
  poi(12, 2, 'w', 'poi_badge_printer', 'Inspect · Badge printer'),
  poi(12, 4, 'e', 'poi_server_rack', 'Inspect · Server rack'),
  poi(12, 5, 'e', 'poi_server_rack', 'Inspect · Server rack'),
  poi(13, 3, 'n', 'poi_server_rack', 'Inspect · Server rack'),
  poi(13, 3, 's', 'poi_server_rack', 'Inspect · Server rack'),
  poi(8, 1, 's', 'poi_help_desk', 'Inspect · Help desk'),
  poi(9, 1, 's', 'poi_help_desk', 'Inspect · Help desk'),
  poi(10, 1, 's', 'poi_help_desk', 'Inspect · Help desk'),
  poi(17, 4, 'n', 'poi_people_tray', 'File · People Ops tray'),
  poi(18, 4, 'n', 'poi_people_tray', 'File · People Ops tray'),
  poi(19, 4, 'n', 'poi_people_tray', 'File · People Ops tray'),
  poi(16, 3, 'e', 'poi_people_tray', 'File · People Ops tray'),
  poi(20, 3, 'w', 'poi_people_tray', 'File · People Ops tray'),
  poi(16, 2, 'n', 'poi_filing_cabinets', 'Inspect · Filing cabinets'),
  poi(17, 2, 'n', 'poi_filing_cabinets', 'Inspect · Filing cabinets'),
  poi(21, 8, 'e', 'poi_water_cooler_f2', 'Inspect · Water cooler'),
  poi(22, 7, 's', 'poi_water_cooler_f2', 'Inspect · Water cooler'),
  poi(4, 12, 's', 'poi_director_desk', 'Inspect · Desk'),
  poi(5, 12, 's', 'poi_director_desk', 'Inspect · Desk'),
  poi(6, 13, 'w', 'poi_director_desk', 'Inspect · Desk'),
  poi(9, 11, 'n', 'poi_supply_cabinet_f2', 'Open · Supply cabinet'),
  poi(8, 10, 'e', 'poi_supply_cabinet_f2', 'Open · Supply cabinet'),
  poi(10, 11, 'n', 'poi_break_counter_f2', 'Take five · Coffee counter'),
  poi(11, 11, 'n', 'poi_break_counter_f2', 'Take five · Coffee counter'),
  poi(12, 11, 'n', 'poi_break_counter_f2', 'Take five · Coffee counter'),
  poi(13, 10, 'w', 'poi_break_counter_f2', 'Take five · Coffee counter'),
  poi(13, 12, 'e', 'poi_vending_machine_f2', 'Buy · Vending'),
  poi(14, 11, 's', 'poi_vending_machine_f2', 'Buy · Vending'),
  poi(14, 13, 'n', 'poi_vending_machine_f2', 'Buy · Vending'),
  poi(10, 12, 's', 'poi_break_table_f2', 'Inspect · Break table'),
  poi(11, 12, 's', 'poi_break_table_f2', 'Inspect · Break table'),
  poi(10, 14, 'n', 'poi_break_table_f2', 'Inspect · Break table'),
  poi(11, 14, 'n', 'poi_break_table_f2', 'Inspect · Break table'),
  poi(9, 12, 'w', 'poi_lockers', 'Inspect · Lockers'),
  poi(9, 13, 'w', 'poi_lockers', 'Inspect · Lockers'),
  poi(13, 15, 'e', 'poi_janitor_cart', 'Inspect · Janitor cart'),
  poi(14, 14, 's', 'poi_janitor_cart', 'Inspect · Janitor cart'),
  poi(21, 10, 'e', 'poi_safe', 'Inspect · Safe'),
  poi(22, 11, 'n', 'poi_safe', 'Inspect · Safe'),
  poi(21, 16, 'e', 'poi_shredder', 'Inspect · Shredder'),
  poi(22, 15, 's', 'poi_shredder', 'Inspect · Shredder'),
]

/** Which glyphs each POI occupies (used to check every spot faces its target). */
export const FLOOR_2_POI_GLYPHS: Record<Floor2PoiId, string> = {
  poi_elevator_door_f2: 'ER',
  poi_directory_sign_f2: 'i',
  poi_photo_booth: 'B',
  poi_badge_printer: 'b',
  poi_server_rack: 'G',
  poi_help_desk: '=',
  poi_people_tray: 'Q',
  poi_filing_cabinets: 'f',
  poi_water_cooler_f2: 'w',
  poi_director_door: 'D',
  poi_director_desk: 'd',
  poi_supply_cabinet_f2: 'S',
  poi_break_counter_f2: 'K',
  poi_vending_machine_f2: 'V',
  poi_break_table_f2: 't',
  poi_lockers: 'k',
  poi_janitor_cart: 'j',
  poi_safe: '$',
  poi_shredder: 'm',
}

/**
 * Prop glyph → atlas cell(s). Multi-part props list every part; stateful props
 * list every state's frame 0 (the frame groups themselves are consecutive
 * sheet cells, checked by the tileset test). `c`, `=`, `p`, `E`, `R`, `K`,
 * `V`, `S`, `w` reuse the Floor 1 rules in src/screens/office/tiles.tsx.
 */
export const FLOOR_2_PROP_CELLS: Record<string, string[]> = {
  i: ['directory_f2'],
  B: ['photo_booth_idle', 'photo_booth_flash_0'],
  G: ['server_rack_0'],
  b: ['badge_printer_idle', 'badge_printer_printing_0', 'badge_printer_done'],
  f: ['filing_closed', 'filing_open'],
  Q: ['pcounter_l', 'pcounter_m', 'pcounter_r'],
  L: ['sofa_l', 'sofa_r'],
  d: ['exec_desk_l', 'exec_desk_r'],
  k: ['locker'],
  t: ['btable_f2_l', 'btable_f2_r'],
  j: ['janitor_cart'],
  $: ['safe'],
  m: ['shredder_idle', 'shredder_shredding_0'],
  '=': ['desk_l_0', 'desk_m_0', 'desk_r'],
  c: ['chair_n', 'chair_s'],
  p: ['plant_a', 'plant_b'],
  E: ['elev_l_closed', 'elev_r_closed', 'elev_l_open', 'elev_r_open'],
  R: ['reader_red_0', 'reader_green_0'],
  S: ['cabinet_closed', 'cabinet_open'],
  K: ['counter_machine', 'counter_steam_0', 'counter_cups', 'counter_sink'],
  V: ['vending_idle', 'vending_lit_0'],
  w: ['water_cooler'],
}

/** Doorway cells: the two single openings in vertical walls, and the horizontal-wall doors. */
export const FLOOR_2_DOOR_CELLS: Record<string, string> = {
  '6,3': 'door_v_single',
  '14,3': 'door_v_single',
  '3,6': 'door_h',
  '9,6': 'door_h',
  '20,6': 'door_h',
  '3,9': 'door_h',
  '8,9': 'door_h',
  '19,9': 'door_h',
}

/** Rugs (presentation only): rectangles that get a 9-patch. */
export const FLOOR_2_RUGS: {
  x0: number
  y0: number
  x1: number
  y1: number
  kind: 'red' | 'gold' | 'navy'
}[] = [
  { x0: 2, y0: 2, x1: 4, y1: 3, kind: 'red' }, // in front of the elevator, same as Floor 1
  { x0: 1, y0: 8, x1: 21, y1: 8, kind: 'navy' }, // hall runner, horizontal
  { x0: 2, y0: 11, x1: 5, y1: 14, kind: 'gold' }, // under Kessler and his desk
]

/** Wall-face decor keyed by `x,y` of the wall tile it hangs on. Every key must be a wall with an open tile south of it. */
export const FLOOR_2_WALL_DECOR: Record<string, string> = {
  // landing, north wall (x1 and x5 are the only faces not behind the elevator)
  '1,0': 'vent',
  '5,0': 'clock',
  // help desk, north wall
  '7,0': 'sign_helpdesk',
  '8,0': 'ticketboard_l',
  '9,0': 'ticketboard_r',
  '10,0': 'extinguisher',
  '11,0': 'server_status',
  // people ops, north wall
  '15,0': 'sign_people',
  '18,0': 'orgchart_l',
  '19,0': 'orgchart_r',
  '20,0': 'compliance_poster',
  '21,0': 'window_l',
  '22,0': 'window_r',
  // hall, north wall (seen from the hall)
  '1,6': 'extinguisher',
  '5,6': 'pinboard',
  '7,6': 'incident_l',
  '8,6': 'incident_r',
  '10,6': 'plaque_ops_l',
  '11,6': 'plaque_ops_m',
  '12,6': 'plaque_ops_r',
  '14,6': 'vent',
  '16,6': 'poster',
  '18,6': 'clock',
  '22,6': 'vent',
  // director's office, north wall
  '1,9': 'window_l',
  '2,9': 'window_r',
  '4,9': 'nameplate_kessler',
  '5,9': 'whiteboard_l',
  '6,9': 'whiteboard_r',
  // facilities, north wall (only high decor above the cabinet/counter run)
  '9,9': 'breaker_panel',
  '13,9': 'sign_pantry',
  '14,9': 'shelf_mugs',
  // finance, north wall (the safe at (22,10) is tall, so only a vent above it)
  '16,9': 'clock',
  '18,9': 'sign_finance',
  '20,9': 'window_l',
  '21,9': 'window_r',
  '22,9': 'vent',
}
