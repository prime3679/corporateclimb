// Frozen Floor 4 content — names match docs/rpg/floor-3-5-design.md §3 / §8.

import type { Facing, NpcId, PoiId, ZoneId } from './ids'

export const FLOOR_4_ID = 'floor_04' as const

export const FLOOR_4_ART = [
  '########################',
  '#.EER.#.===..C#........#',
  '#..@..#.ccc...#........#',
  '#.....D...5...D....6...#',
  '#...i.#.......#....H...#',
  '#p...p#p.....p#p.......#',
  '###D########D#####D#####',
  '#......................#',
  '#.....................w#',
  '#########D##############',
  '#......................#',
  '#..SKKK..........7dd...#',
  '#...............c......#',
  '#..tt..........c.......#',
  '#......................#',
  '#..............LL......#',
  '#p............p.......V#',
  '########################',
] as const

export const FLOOR_4_SOLID_GLYPHS = new Set('#ER=CHipc56wSKydtLV7'.split(''))

export function floor4GlyphAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= 24 || y >= 18) return '#'
  const raw = FLOOR_4_ART[y][x]
  return raw === '@' ? '.' : raw
}

export function floor4IsSolid(x: number, y: number): boolean {
  return FLOOR_4_SOLID_GLYPHS.has(floor4GlyphAt(x, y))
}

export const FLOOR_4_DIRECTORY_TEXT = [
  'FLOOR 4 — SALES. Pipeline: through the glass. Client: far right.',
  'Ashford: down the hall. If you can hear the flute, you are late.',
  "Elevator: you're standing at it.",
]

export const FLOOR_4_ARRIVAL = { x: 3, y: 2, facing: 's' as Facing }
export const FLOOR_4_DEFEAT_RESPAWN = { x: 5, y: 12, facing: 'n' as Facing }

export type Floor4ZoneId = Extract<
  ZoneId,
  'zone_landing' | 'zone_pipeline' | 'zone_client' | 'zone_sales' | 'zone_hall_f4'
>

export const FLOOR_4_ZONE_LABEL: Record<Floor4ZoneId, string> = {
  zone_landing: 'LANDING',
  zone_pipeline: 'PIPELINE',
  zone_client: 'CLIENT',
  zone_sales: 'SALES',
  zone_hall_f4: 'HALL',
}

export const FLOOR_4_ZONE_ACCENT: Record<Floor4ZoneId, string> = {
  zone_landing: '#e0844d',
  zone_pipeline: '#d45a3a',
  zone_client: '#c4a05a',
  zone_sales: '#8a3a4a',
  zone_hall_f4: '#8b98a8',
}

export const FLOOR_4_ZONE_FLOOR: Record<Floor4ZoneId, string> = {
  zone_landing: 'floor_elevator',
  zone_pipeline: 'floor_pipeline',
  zone_client: 'floor_client',
  zone_sales: 'floor_product',
  zone_hall_f4: 'floor_hall',
}

export function floor4ZoneAt(x: number, y: number): Floor4ZoneId {
  if (x >= 1 && x <= 5 && y >= 1 && y <= 5) return 'zone_landing'
  if (x >= 7 && x <= 13 && y >= 1 && y <= 5) return 'zone_pipeline'
  if (x >= 15 && x <= 22 && y >= 1 && y <= 5) return 'zone_client'
  if (x >= 1 && x <= 22 && y >= 10 && y <= 16) return 'zone_sales'
  return 'zone_hall_f4'
}

export type Floor4NpcId = Extract<NpcId, 'npc_account_exec' | 'npc_client_success' | 'npc_vp_sales'>

export const FLOOR_4_NPC_GLYPH: Record<Floor4NpcId, string> = {
  npc_account_exec: '5',
  npc_client_success: '6',
  npc_vp_sales: '7',
}

export const FLOOR_4_NPC_NAME: Record<Floor4NpcId, string> = {
  npc_account_exec: 'Harper',
  npc_client_success: 'Reyes',
  npc_vp_sales: 'Ashford',
}

export const FLOOR_4_NPC_TILE: Record<Floor4NpcId, { x: number; y: number; facing: Facing }> = {
  npc_account_exec: { x: 10, y: 3, facing: 's' },
  npc_client_success: { x: 19, y: 3, facing: 'w' },
  npc_vp_sales: { x: 17, y: 11, facing: 'w' },
}

export const FLOOR_4_NPC_SIGHT: Record<Floor4NpcId, { x: number; y: number }[]> = {
  npc_account_exec: [
    { x: 10, y: 4 },
    { x: 10, y: 5 },
  ],
  npc_client_success: [
    { x: 18, y: 3 },
    { x: 17, y: 3 },
    { x: 16, y: 3 },
  ],
  npc_vp_sales: [
    { x: 16, y: 11 },
    { x: 15, y: 11 },
    { x: 14, y: 11 },
  ],
}

export type Floor4PoiId = Extract<
  PoiId,
  | 'poi_elevator_door_f4'
  | 'poi_directory_sign_f4'
  | 'poi_pipeline_board'
  | 'poi_leavebehind'
  | 'poi_pipeline_desk'
  | 'poi_water_cooler_f4'
  | 'poi_break_counter_f4'
  | 'poi_vending_machine_f4'
  | 'poi_break_table_f4'
  | 'poi_ashford_desk'
  | 'poi_supply_cabinet_upper'
>

export type Floor4InteractTarget =
  | { kind: 'npc'; id: Floor4NpcId; label: string }
  | { kind: 'poi'; id: Floor4PoiId; label: string }

export interface Floor4InteractSpot {
  x: number
  y: number
  facing: Facing
  target: Floor4InteractTarget
}

const npc = (x: number, y: number, facing: Facing, id: Floor4NpcId): Floor4InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'npc', id, label: `Talk · ${FLOOR_4_NPC_NAME[id]}` },
})

const poi = (
  x: number,
  y: number,
  facing: Facing,
  id: Floor4PoiId,
  label: string,
): Floor4InteractSpot => ({ x, y, facing, target: { kind: 'poi', id, label } })

export const FLOOR_4_INTERACT_SPOTS: Floor4InteractSpot[] = [
  npc(10, 4, 'n', 'npc_account_exec'),
  npc(9, 3, 'e', 'npc_account_exec'),
  npc(11, 3, 'w', 'npc_account_exec'),
  npc(18, 3, 'e', 'npc_client_success'),
  npc(19, 2, 's', 'npc_client_success'),
  npc(20, 3, 'w', 'npc_client_success'),
  npc(16, 11, 'e', 'npc_vp_sales'),
  npc(17, 10, 's', 'npc_vp_sales'),
  npc(17, 12, 'n', 'npc_vp_sales'),
  poi(2, 2, 'n', 'poi_elevator_door_f4', 'Elevator'),
  poi(3, 2, 'n', 'poi_elevator_door_f4', 'Elevator'),
  poi(4, 2, 'n', 'poi_elevator_door_f4', 'Elevator'),
  poi(5, 1, 'w', 'poi_elevator_door_f4', 'Elevator'),
  poi(3, 4, 'e', 'poi_directory_sign_f4', 'Read · Directory'),
  poi(5, 4, 'w', 'poi_directory_sign_f4', 'Read · Directory'),
  poi(4, 3, 's', 'poi_directory_sign_f4', 'Read · Directory'),
  poi(4, 5, 'n', 'poi_directory_sign_f4', 'Read · Directory'),
  poi(13, 2, 'n', 'poi_pipeline_board', 'Pull · Leave-behind'),
  poi(12, 1, 'e', 'poi_pipeline_board', 'Pull · Leave-behind'),
  poi(7, 1, 'e', 'poi_pipeline_desk', 'Inspect · Pipeline desk'),
  poi(11, 1, 'w', 'poi_pipeline_desk', 'Inspect · Pipeline desk'),
  poi(19, 5, 'n', 'poi_leavebehind', 'Take · Leave-behind'),
  poi(18, 4, 'e', 'poi_leavebehind', 'Take · Leave-behind'),
  poi(20, 4, 'w', 'poi_leavebehind', 'Take · Leave-behind'),
  poi(21, 8, 'e', 'poi_water_cooler_f4', 'Inspect · Water cooler'),
  poi(22, 7, 's', 'poi_water_cooler_f4', 'Inspect · Water cooler'),
  poi(3, 12, 'n', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(2, 11, 'e', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(3, 10, 's', 'poi_supply_cabinet_upper', 'Inspect · Supply cabinet'),
  poi(4, 12, 'n', 'poi_break_counter_f4', 'Take five · Coffee counter'),
  poi(5, 12, 'n', 'poi_break_counter_f4', 'Take five · Coffee counter'),
  poi(6, 12, 'n', 'poi_break_counter_f4', 'Take five · Coffee counter'),
  poi(7, 11, 'w', 'poi_break_counter_f4', 'Take five · Coffee counter'),
  poi(22, 15, 's', 'poi_vending_machine_f4', 'Buy · Vending'),
  poi(21, 16, 'e', 'poi_vending_machine_f4', 'Buy · Vending'),
  poi(3, 14, 'n', 'poi_break_table_f4', 'Inspect · Break table'),
  poi(4, 14, 'n', 'poi_break_table_f4', 'Inspect · Break table'),
  poi(3, 12, 's', 'poi_break_table_f4', 'Inspect · Break table'),
  poi(4, 12, 's', 'poi_break_table_f4', 'Inspect · Break table'),
  poi(18, 12, 'n', 'poi_ashford_desk', 'Inspect · Desk'),
  poi(19, 12, 'n', 'poi_ashford_desk', 'Inspect · Desk'),
  poi(20, 11, 'w', 'poi_ashford_desk', 'Inspect · Desk'),
]

export const FLOOR_4_POI_GLYPHS: Record<Floor4PoiId, string> = {
  poi_elevator_door_f4: 'ER',
  poi_directory_sign_f4: 'i',
  poi_pipeline_board: 'C',
  poi_leavebehind: 'H',
  poi_pipeline_desk: '=',
  poi_water_cooler_f4: 'w',
  poi_break_counter_f4: 'K',
  poi_vending_machine_f4: 'V',
  poi_break_table_f4: 't',
  poi_ashford_desk: 'd',
  poi_supply_cabinet_upper: 'S',
}

export const FLOOR_4_PROP_CELLS: Record<string, string[]> = {
  i: ['directory_f4'],
  C: ['pipeline_board'],
  H: ['handout_rack'],
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

export const FLOOR_4_DOOR_CELLS: Record<string, string> = {
  '6,3': 'door_v_single',
  '14,3': 'door_v_single',
  '3,6': 'door_h',
  '12,6': 'door_h',
  '18,6': 'door_h',
  '9,9': 'door_h',
}

export const FLOOR_4_RUGS: {
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

export const FLOOR_4_WALL_DECOR: Record<string, string> = {
  '1,0': 'vent',
  '5,0': 'clock',
  '7,0': 'sign_pipeline',
  '11,0': 'pinboard',
  '12,0': 'poster',
  '15,0': 'sign_client',
  '18,0': 'orgchart_l',
  '19,0': 'orgchart_r',
  '21,0': 'window_l',
  '22,0': 'window_r',
  '1,6': 'extinguisher',
  '5,6': 'pinboard',
  '7,6': 'poster',
  '9,6': 'plaque_sales_l',
  '10,6': 'plaque_sales_m',
  '11,6': 'plaque_sales_r',
  '14,6': 'vent',
  '16,6': 'clock',
  '20,6': 'compliance_poster',
  '22,6': 'vent',
  '1,9': 'window_l',
  '2,9': 'window_r',
  '4,9': 'shelf_mugs',
  '7,9': 'sign_kitchen',
  '16,9': 'nameplate_ashford',
  '18,9': 'window_l',
  '19,9': 'window_r',
  '21,9': 'clock',
  '22,9': 'vent',
}
