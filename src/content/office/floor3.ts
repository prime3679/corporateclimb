// Frozen Floor 3 content — names match docs/rpg/floor-3-5-design.md §2 / §8.
//
// Tables only. map.ts keys these under `floor_03`; the paper-playtest test
// (src/__tests__/office/floors-3-5-map.test.ts) checks the doc, the art and
// the renderer against the same coordinates.

import type { Facing, NpcId, PoiId, ZoneId } from './ids'

export const FLOOR_3_ID = 'floor_03' as const

/** 24×18, same frame as Floors 1–2. `@` is the arrival tile (rendered as floor). */
export const FLOOR_3_ART = [
  '########################',
  '#.EER.#.===..W#..f.....#',
  '#..@..#.ccc...#........#',
  '#.....D...8...D....9...#',
  '#...i.#.......#....N...#',
  '#p...p#p.....p#p.......#',
  '###D########D#####D#####',
  '#......................#',
  '#.....................w#',
  '#########D##############',
  '#......................#',
  '#..SKKK..........ydd...#',
  '#...............c......#',
  '#..tt..........c.......#',
  '#......................#',
  '#..............LL......#',
  '#p............p.......V#',
  '########################',
] as const

export const FLOOR_3_SOLID_GLYPHS = new Set('#ER=Wfipc89NwSKydtLV'.split(''))

export function floor3GlyphAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= 24 || y >= 18) return '#'
  const raw = FLOOR_3_ART[y][x]
  return raw === '@' ? '.' : raw
}

export function floor3IsSolid(x: number, y: number): boolean {
  return FLOOR_3_SOLID_GLYPHS.has(floor3GlyphAt(x, y))
}

export const FLOOR_3_DIRECTORY_TEXT = [
  'FLOOR 3 — PRODUCT. War room: through the glass. Intake: far right.',
  'Quincy: down the hall. The coffee is the good machine, still.',
  "Elevator: you're standing at it.",
]

export const FLOOR_3_ARRIVAL = { x: 3, y: 2, facing: 's' as Facing }
export const FLOOR_3_DEFEAT_RESPAWN = { x: 5, y: 12, facing: 'n' as Facing }

export type Floor3ZoneId = Extract<
  ZoneId,
  'zone_landing' | 'zone_war' | 'zone_intake' | 'zone_product' | 'zone_hall_f3'
>

export const FLOOR_3_ZONE_LABEL: Record<Floor3ZoneId, string> = {
  zone_landing: 'LANDING',
  zone_war: 'WAR ROOM',
  zone_intake: 'INTAKE',
  zone_product: 'PRODUCT',
  zone_hall_f3: 'HALL',
}

export const FLOOR_3_ZONE_ACCENT: Record<Floor3ZoneId, string> = {
  zone_landing: '#e0844d',
  zone_war: '#c47a3a',
  zone_intake: '#8a6bb8',
  zone_product: '#5a6a9a',
  zone_hall_f3: '#8b98a8',
}

export const FLOOR_3_ZONE_FLOOR: Record<Floor3ZoneId, string> = {
  zone_landing: 'floor_elevator',
  zone_war: 'floor_war',
  zone_intake: 'floor_intake',
  zone_product: 'floor_product',
  zone_hall_f3: 'floor_hall',
}

export function floor3ZoneAt(x: number, y: number): Floor3ZoneId {
  if (x >= 1 && x <= 5 && y >= 1 && y <= 5) return 'zone_landing'
  if (x >= 7 && x <= 13 && y >= 1 && y <= 5) return 'zone_war'
  if (x >= 15 && x <= 22 && y >= 1 && y <= 5) return 'zone_intake'
  if (x >= 1 && x <= 22 && y >= 10 && y <= 16) return 'zone_product'
  return 'zone_hall_f3'
}

export type Floor3NpcId = Extract<NpcId, 'npc_staff_pm' | 'npc_researcher' | 'npc_vp_product'>

export const FLOOR_3_NPC_GLYPH: Record<Floor3NpcId, string> = {
  npc_staff_pm: '8',
  npc_researcher: '9',
  npc_vp_product: 'y',
}

export const FLOOR_3_NPC_NAME: Record<Floor3NpcId, string> = {
  npc_staff_pm: 'Sloane',
  npc_researcher: 'Nico',
  npc_vp_product: 'Quincy',
}

export const FLOOR_3_NPC_TILE: Record<Floor3NpcId, { x: number; y: number; facing: Facing }> = {
  npc_staff_pm: { x: 10, y: 3, facing: 's' },
  npc_researcher: { x: 19, y: 3, facing: 'w' },
  npc_vp_product: { x: 17, y: 11, facing: 'w' },
}

export const FLOOR_3_NPC_SIGHT: Record<Floor3NpcId, { x: number; y: number }[]> = {
  npc_staff_pm: [
    { x: 10, y: 4 },
    { x: 10, y: 5 },
  ],
  npc_researcher: [
    { x: 18, y: 3 },
    { x: 17, y: 3 },
    { x: 16, y: 3 },
  ],
  npc_vp_product: [
    { x: 16, y: 11 },
    { x: 15, y: 11 },
    { x: 14, y: 11 },
  ],
}

export type Floor3PoiId = Extract<
  PoiId,
  | 'poi_elevator_door_f3'
  | 'poi_directory_sign_f3'
  | 'poi_roadmap_wall'
  | 'poi_intake_board'
  | 'poi_war_desk'
  | 'poi_filing_f3'
  | 'poi_water_cooler_f3'
  | 'poi_break_counter_f3'
  | 'poi_vending_machine_f3'
  | 'poi_break_table_f3'
  | 'poi_quincy_desk'
>

export type Floor3InteractTarget =
  | { kind: 'npc'; id: Floor3NpcId; label: string }
  | { kind: 'poi'; id: Floor3PoiId; label: string }

export interface Floor3InteractSpot {
  x: number
  y: number
  facing: Facing
  target: Floor3InteractTarget
}

const npc = (x: number, y: number, facing: Facing, id: Floor3NpcId): Floor3InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'npc', id, label: `Talk · ${FLOOR_3_NPC_NAME[id]}` },
})

const poi = (
  x: number,
  y: number,
  facing: Facing,
  id: Floor3PoiId,
  label: string,
): Floor3InteractSpot => ({ x, y, facing, target: { kind: 'poi', id, label } })

export const FLOOR_3_INTERACT_SPOTS: Floor3InteractSpot[] = [
  npc(10, 4, 'n', 'npc_staff_pm'),
  npc(9, 3, 'e', 'npc_staff_pm'),
  npc(11, 3, 'w', 'npc_staff_pm'),
  npc(18, 3, 'e', 'npc_researcher'),
  npc(19, 2, 's', 'npc_researcher'),
  npc(20, 3, 'w', 'npc_researcher'),
  npc(16, 11, 'e', 'npc_vp_product'),
  npc(17, 10, 's', 'npc_vp_product'),
  npc(17, 12, 'n', 'npc_vp_product'),
  poi(2, 2, 'n', 'poi_elevator_door_f3', 'Elevator'),
  poi(3, 2, 'n', 'poi_elevator_door_f3', 'Elevator'),
  poi(4, 2, 'n', 'poi_elevator_door_f3', 'Elevator'),
  poi(5, 1, 'w', 'poi_elevator_door_f3', 'Elevator'),
  poi(3, 4, 'e', 'poi_directory_sign_f3', 'Read · Directory'),
  poi(5, 4, 'w', 'poi_directory_sign_f3', 'Read · Directory'),
  poi(4, 3, 's', 'poi_directory_sign_f3', 'Read · Directory'),
  poi(4, 5, 'n', 'poi_directory_sign_f3', 'Read · Directory'),
  poi(13, 2, 'n', 'poi_roadmap_wall', 'Pull · Q4 card'),
  poi(12, 1, 'e', 'poi_roadmap_wall', 'Pull · Q4 card'),
  poi(7, 1, 'e', 'poi_war_desk', 'Inspect · War desk'),
  poi(11, 1, 'w', 'poi_war_desk', 'Inspect · War desk'),
  poi(19, 5, 'n', 'poi_intake_board', 'File · Intake'),
  poi(18, 4, 'e', 'poi_intake_board', 'File · Intake'),
  poi(20, 4, 'w', 'poi_intake_board', 'File · Intake'),
  poi(17, 2, 'n', 'poi_filing_f3', 'Inspect · Filing'),
  poi(21, 8, 'e', 'poi_water_cooler_f3', 'Inspect · Water cooler'),
  poi(22, 7, 's', 'poi_water_cooler_f3', 'Inspect · Water cooler'),
  poi(4, 12, 'n', 'poi_break_counter_f3', 'Take five · Coffee counter'),
  poi(5, 12, 'n', 'poi_break_counter_f3', 'Take five · Coffee counter'),
  poi(6, 12, 'n', 'poi_break_counter_f3', 'Take five · Coffee counter'),
  poi(7, 11, 'w', 'poi_break_counter_f3', 'Take five · Coffee counter'),
  poi(22, 15, 's', 'poi_vending_machine_f3', 'Buy · Vending'),
  poi(21, 16, 'e', 'poi_vending_machine_f3', 'Buy · Vending'),
  poi(3, 14, 'n', 'poi_break_table_f3', 'Inspect · Break table'),
  poi(4, 14, 'n', 'poi_break_table_f3', 'Inspect · Break table'),
  poi(3, 12, 's', 'poi_break_table_f3', 'Inspect · Break table'),
  poi(4, 12, 's', 'poi_break_table_f3', 'Inspect · Break table'),
  poi(18, 12, 'n', 'poi_quincy_desk', 'Inspect · Desk'),
  poi(19, 12, 'n', 'poi_quincy_desk', 'Inspect · Desk'),
  poi(20, 11, 'w', 'poi_quincy_desk', 'Inspect · Desk'),
]

export const FLOOR_3_POI_GLYPHS: Record<Floor3PoiId, string> = {
  poi_elevator_door_f3: 'ER',
  poi_directory_sign_f3: 'i',
  poi_roadmap_wall: 'W',
  poi_intake_board: 'N',
  poi_war_desk: '=',
  poi_filing_f3: 'f',
  poi_water_cooler_f3: 'w',
  poi_break_counter_f3: 'K',
  poi_vending_machine_f3: 'V',
  poi_break_table_f3: 't',
  poi_quincy_desk: 'd',
}

export const FLOOR_3_PROP_CELLS: Record<string, string[]> = {
  i: ['directory_f3'],
  W: ['roadmap_wall'],
  N: ['intake_board'],
  f: ['filing_closed', 'filing_open'],
  d: ['exec_desk_l', 'exec_desk_r'],
  L: ['sofa_l', 'sofa_r'],
  '=': ['desk_l_0', 'desk_m_0', 'desk_r'],
  c: ['chair_n', 'chair_s'],
  p: ['plant_a', 'plant_b'],
  E: ['elev_l_closed', 'elev_r_closed', 'elev_l_open', 'elev_r_open'],
  R: ['reader_red_0', 'reader_green_0'],
  S: ['cabinet_closed', 'cabinet_open'],
  K: ['counter_machine', 'counter_steam_0', 'counter_cups', 'counter_sink'],
  V: ['vending_idle', 'vending_lit_0'],
  w: ['water_cooler'],
  t: ['btable_f2_l', 'btable_f2_r'],
}

export const FLOOR_3_DOOR_CELLS: Record<string, string> = {
  '6,3': 'door_v_single',
  '14,3': 'door_v_single',
  '3,6': 'door_h',
  '12,6': 'door_h',
  '18,6': 'door_h',
  '9,9': 'door_h',
}

export const FLOOR_3_RUGS: {
  x0: number
  y0: number
  x1: number
  y1: number
  kind: 'red' | 'gold' | 'navy'
}[] = [
  { x0: 2, y0: 2, x1: 4, y1: 3, kind: 'red' },
  { x0: 1, y0: 8, x1: 21, y1: 8, kind: 'navy' },
  { x0: 16, y0: 11, x1: 20, y1: 13, kind: 'gold' },
]

export const FLOOR_3_WALL_DECOR: Record<string, string> = {
  '1,0': 'vent',
  '5,0': 'clock',
  '7,0': 'sign_war',
  '11,0': 'whiteboard_l',
  '12,0': 'whiteboard_r',
  '15,0': 'sign_intake',
  '18,0': 'pinboard',
  '21,0': 'window_l',
  '22,0': 'window_r',
  '1,6': 'extinguisher',
  '5,6': 'pinboard',
  '7,6': 'poster',
  '9,6': 'plaque_product_l',
  '10,6': 'plaque_product_m',
  '11,6': 'plaque_product_r',
  '14,6': 'vent',
  '16,6': 'clock',
  '20,6': 'poster',
  '22,6': 'vent',
  '1,9': 'window_l',
  '2,9': 'window_r',
  '4,9': 'shelf_mugs',
  '7,9': 'sign_kitchen',
  '16,9': 'nameplate_quincy',
  '18,9': 'whiteboard_l',
  '19,9': 'whiteboard_r',
  '21,9': 'window_l',
  '22,9': 'window_r',
}
