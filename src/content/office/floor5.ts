// Frozen Floor 5 content — names match docs/rpg/floor-3-5-design.md §4 / §8.

import type { Facing, NpcId, PoiId, ZoneId } from './ids'

export const FLOOR_5_ID = 'floor_05' as const

export const FLOOR_5_ART = [
  '########################',
  '#.EER.#................#',
  '#..@..#................#',
  '#.....D...4............#',
  '#...i.#..........U.....#',
  '#p...p#p..............p#',
  '###D####################',
  '#......................#',
  '#.....................w#',
  '#########D##############',
  '#......................#',
  '#..SKKK....TTTT...0dd..#',
  '#..........cccc.....c..#',
  '#..tt..................#',
  '#......................#',
  '#..............LL......#',
  '#p............p.......V#',
  '########################',
] as const

export const FLOOR_5_SOLID_GLYPHS = new Set('#ERipcwSKTtLVdU40'.split(''))

export function floor5GlyphAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= 24 || y >= 18) return '#'
  const raw = FLOOR_5_ART[y][x]
  return raw === '@' ? '.' : raw
}

export function floor5IsSolid(x: number, y: number): boolean {
  return FLOOR_5_SOLID_GLYPHS.has(floor5GlyphAt(x, y))
}

export const FLOOR_5_DIRECTORY_TEXT = [
  'FLOOR 5 — EXEC. Antechamber: through the glass. Boardroom: down the hall.',
  'Marlowe has the calendar. Caldwell has the nod.',
  "Elevator: you're standing at it. There is no 6.",
]

export const FLOOR_5_ARRIVAL = { x: 3, y: 2, facing: 's' as Facing }
export const FLOOR_5_DEFEAT_RESPAWN = { x: 5, y: 12, facing: 'n' as Facing }

export type Floor5ZoneId = Extract<
  ZoneId,
  'zone_landing' | 'zone_ante' | 'zone_board' | 'zone_hall_f5'
>

export const FLOOR_5_ZONE_LABEL: Record<Floor5ZoneId, string> = {
  zone_landing: 'LANDING',
  zone_ante: 'ANTECHAMBER',
  zone_board: 'BOARDROOM',
  zone_hall_f5: 'HALL',
}

export const FLOOR_5_ZONE_ACCENT: Record<Floor5ZoneId, string> = {
  zone_landing: '#e0844d',
  zone_ante: '#6a5a48',
  zone_board: '#2a2438',
  zone_hall_f5: '#8b98a8',
}

export const FLOOR_5_ZONE_FLOOR: Record<Floor5ZoneId, string> = {
  zone_landing: 'floor_elevator',
  zone_ante: 'floor_director',
  zone_board: 'floor_board',
  zone_hall_f5: 'floor_hall',
}

export function floor5ZoneAt(x: number, y: number): Floor5ZoneId {
  if (x >= 1 && x <= 5 && y >= 1 && y <= 5) return 'zone_landing'
  if (x >= 7 && x <= 22 && y >= 1 && y <= 5) return 'zone_ante'
  if (x >= 1 && x <= 22 && y >= 10 && y <= 16) return 'zone_board'
  return 'zone_hall_f5'
}

export type Floor5NpcId = Extract<NpcId, 'npc_exec_assistant' | 'npc_ceo'>

export const FLOOR_5_NPC_GLYPH: Record<Floor5NpcId, string> = {
  npc_exec_assistant: '4',
  npc_ceo: '0',
}

export const FLOOR_5_NPC_NAME: Record<Floor5NpcId, string> = {
  npc_exec_assistant: 'Marlowe',
  npc_ceo: 'Caldwell',
}

export const FLOOR_5_NPC_TILE: Record<Floor5NpcId, { x: number; y: number; facing: Facing }> = {
  npc_exec_assistant: { x: 10, y: 3, facing: 's' },
  npc_ceo: { x: 18, y: 11, facing: 'w' },
}

export const FLOOR_5_NPC_SIGHT: Record<Floor5NpcId, { x: number; y: number }[]> = {
  npc_exec_assistant: [
    { x: 10, y: 4 },
    { x: 10, y: 5 },
  ],
  npc_ceo: [
    { x: 17, y: 11 },
    { x: 16, y: 11 },
    { x: 15, y: 11 },
  ],
}

export type Floor5PoiId = Extract<
  PoiId,
  | 'poi_elevator_door_f5'
  | 'poi_directory_sign_f5'
  | 'poi_sideboard'
  | 'poi_water_cooler_f5'
  | 'poi_break_counter_f5'
  | 'poi_vending_machine_f5'
  | 'poi_break_table_f5'
  | 'poi_board_table'
  | 'poi_caldwell_desk'
  | 'poi_supply_cabinet_upper'
>

export type Floor5InteractTarget =
  | { kind: 'npc'; id: Floor5NpcId; label: string }
  | { kind: 'poi'; id: Floor5PoiId; label: string }

export interface Floor5InteractSpot {
  x: number
  y: number
  facing: Facing
  target: Floor5InteractTarget
}

const npc = (x: number, y: number, facing: Facing, id: Floor5NpcId): Floor5InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'npc', id, label: `Talk · ${FLOOR_5_NPC_NAME[id]}` },
})

const poi = (
  x: number,
  y: number,
  facing: Facing,
  id: Floor5PoiId,
  label: string,
): Floor5InteractSpot => ({ x, y, facing, target: { kind: 'poi', id, label } })

export const FLOOR_5_INTERACT_SPOTS: Floor5InteractSpot[] = [
  npc(10, 4, 'n', 'npc_exec_assistant'),
  npc(9, 3, 'e', 'npc_exec_assistant'),
  npc(11, 3, 'w', 'npc_exec_assistant'),
  npc(17, 11, 'e', 'npc_ceo'),
  npc(18, 10, 's', 'npc_ceo'),
  npc(18, 12, 'n', 'npc_ceo'),
  poi(2, 2, 'n', 'poi_elevator_door_f5', 'Elevator'),
  poi(3, 2, 'n', 'poi_elevator_door_f5', 'Elevator'),
  poi(4, 2, 'n', 'poi_elevator_door_f5', 'Elevator'),
  poi(5, 1, 'w', 'poi_elevator_door_f5', 'Elevator'),
  poi(3, 4, 'e', 'poi_directory_sign_f5', 'Read · Directory'),
  poi(5, 4, 'w', 'poi_directory_sign_f5', 'Read · Directory'),
  poi(4, 3, 's', 'poi_directory_sign_f5', 'Read · Directory'),
  poi(4, 5, 'n', 'poi_directory_sign_f5', 'Read · Directory'),
  poi(17, 5, 'n', 'poi_sideboard', 'Take · Board packet'),
  poi(16, 4, 'e', 'poi_sideboard', 'Take · Board packet'),
  poi(18, 4, 'w', 'poi_sideboard', 'Take · Board packet'),
  poi(21, 8, 'e', 'poi_water_cooler_f5', 'Inspect · Water cooler'),
  poi(22, 7, 's', 'poi_water_cooler_f5', 'Inspect · Water cooler'),
  poi(3, 12, 'n', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(2, 11, 'e', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(3, 10, 's', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(4, 12, 'n', 'poi_break_counter_f5', 'Take five · Coffee counter'),
  poi(5, 12, 'n', 'poi_break_counter_f5', 'Take five · Coffee counter'),
  poi(6, 12, 'n', 'poi_break_counter_f5', 'Take five · Coffee counter'),
  poi(7, 11, 'w', 'poi_break_counter_f5', 'Take five · Coffee counter'),
  poi(22, 15, 's', 'poi_vending_machine_f5', 'Buy · Vending'),
  poi(21, 16, 'e', 'poi_vending_machine_f5', 'Buy · Vending'),
  poi(3, 14, 'n', 'poi_break_table_f5', 'Inspect · Break table'),
  poi(4, 14, 'n', 'poi_break_table_f5', 'Inspect · Break table'),
  poi(3, 12, 's', 'poi_break_table_f5', 'Inspect · Break table'),
  poi(4, 12, 's', 'poi_break_table_f5', 'Inspect · Break table'),
  poi(11, 10, 's', 'poi_board_table', 'Inspect · Board table'),
  poi(12, 10, 's', 'poi_board_table', 'Inspect · Board table'),
  poi(13, 10, 's', 'poi_board_table', 'Inspect · Board table'),
  poi(14, 10, 's', 'poi_board_table', 'Inspect · Board table'),
  poi(19, 12, 'n', 'poi_caldwell_desk', 'Inspect · Desk'),
  poi(20, 10, 's', 'poi_caldwell_desk', 'Inspect · Desk'),
  poi(21, 11, 'w', 'poi_caldwell_desk', 'Inspect · Desk'),
]

export const FLOOR_5_POI_GLYPHS: Record<Floor5PoiId, string> = {
  poi_elevator_door_f5: 'ER',
  poi_directory_sign_f5: 'i',
  poi_sideboard: 'U',
  poi_water_cooler_f5: 'w',
  poi_break_counter_f5: 'K',
  poi_vending_machine_f5: 'V',
  poi_break_table_f5: 't',
  poi_board_table: 'T',
  poi_caldwell_desk: 'd',
  poi_supply_cabinet_upper: 'S',
}

export const FLOOR_5_PROP_CELLS: Record<string, string[]> = {
  i: ['directory_f5'],
  U: ['sideboard'],
  T: ['mtable_tl', 'mtable_t', 'mtable_tr', 'mtable_bl', 'mtable_b', 'mtable_br'],
  d: ['exec_desk_l', 'exec_desk_r'],
  L: ['sofa_l', 'sofa_r'],
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

export const FLOOR_5_DOOR_CELLS: Record<string, string> = {
  '6,3': 'door_v_single',
  '3,6': 'door_h',
  '9,9': 'door_h',
}

export const FLOOR_5_RUGS: {
  x0: number
  y0: number
  x1: number
  y1: number
  kind: 'red' | 'gold' | 'navy'
}[] = [
  { x0: 2, y0: 2, x1: 4, y1: 3, kind: 'red' },
  { x0: 1, y0: 8, x1: 21, y1: 8, kind: 'navy' },
  { x0: 11, y0: 11, x1: 20, y1: 13, kind: 'gold' },
]

export const FLOOR_5_WALL_DECOR: Record<string, string> = {
  '1,0': 'vent',
  '5,0': 'clock',
  '8,0': 'window_l',
  '9,0': 'window_r',
  '12,0': 'orgchart_l',
  '13,0': 'orgchart_r',
  '15,0': 'clock',
  '18,0': 'poster',
  '21,0': 'window_l',
  '22,0': 'window_r',
  '1,6': 'extinguisher',
  '5,6': 'pinboard',
  '8,6': 'plaque_exec_l',
  '9,6': 'plaque_exec_m',
  '10,6': 'plaque_exec_r',
  '14,6': 'vent',
  '16,6': 'poster',
  '20,6': 'clock',
  '22,6': 'vent',
  '1,9': 'window_l',
  '2,9': 'window_r',
  '4,9': 'shelf_mugs',
  '7,9': 'sign_kitchen',
  '12,9': 'sign_board',
  '16,9': 'nameplate_caldwell',
  '20,9': 'window_l',
  '21,9': 'window_r',
  '22,9': 'vent',
}
