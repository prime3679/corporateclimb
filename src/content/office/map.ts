import type { Facing, NpcId, PoiId, ZoneId } from './ids'
import { MAP_HEIGHT, MAP_WIDTH } from './ids'

export const FLOOR_ART = [
  '########################',
  '#.EER....p#...#.......H#',
  '#.........#..3#..ATTT..#',
  '#.....4...D...D..TTTT..#',
  '#.........#...#..cccc..#',
  '#p........#...#.......p#',
  '###########...##########',
  '#p.......P#...#S..KKK..#',
  '#.===.....#...#........#',
  '#.ccc.....D...D.......V#',
  '#.....2==.#...#........#',
  '#.===.....#...#.tt....p#',
  '#####D#####...##########',
  '#p.............i......p#',
  '#.......1..............#',
  '#......===..@..........#',
  '#.cc..................w#',
  '############X###########',
] as const

const SOLID_GLYPHS = new Set('#XERTAHc=PSKVtwip1234'.split(''))

export type TileGlyph = string

export const SPAWN = { x: 12, y: 15, facing: 'n' as Facing }
export const DEFEAT_RESPAWN = { x: 19, y: 8, facing: 'n' as Facing }
export const POST_CELEBRATION = { x: 3, y: 2, facing: 's' as Facing }

export const ZONE_LABEL: Record<ZoneId, string> = {
  zone_reception: 'RECEPTION',
  zone_desks: 'DESKS',
  zone_break: 'BREAK ROOM',
  zone_meeting: 'MEETING ROOM',
  zone_elevator: 'ELEVATOR LOBBY',
  zone_hall: 'HALL',
}

export function glyphAt(x: number, y: number): TileGlyph {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return '#'
  const raw = FLOOR_ART[y][x]
  return raw === '@' ? '.' : raw
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT
}

export function isSolid(x: number, y: number): boolean {
  return SOLID_GLYPHS.has(glyphAt(x, y))
}

export function zoneAt(x: number, y: number): ZoneId {
  if (x >= 1 && x <= 22 && y >= 13 && y <= 16) return 'zone_reception'
  if (x >= 1 && x <= 9 && y >= 7 && y <= 11) return 'zone_desks'
  if (x >= 15 && x <= 22 && y >= 7 && y <= 11) return 'zone_break'
  if (x >= 15 && x <= 22 && y >= 1 && y <= 5) return 'zone_meeting'
  if (x >= 1 && x <= 9 && y >= 1 && y <= 5) return 'zone_elevator'
  return 'zone_hall'
}

export const NPC_TILE: Record<NpcId, { x: number; y: number; facing: Facing }> = {
  npc_receptionist: { x: 8, y: 14, facing: 's' },
  npc_desk_challenger: { x: 6, y: 10, facing: 'w' },
  npc_meeting_prepper: { x: 13, y: 2, facing: 's' },
  npc_supervisor: { x: 6, y: 3, facing: 'e' },
}

export const NPC_SIGHT: Record<Exclude<NpcId, 'npc_receptionist'>, { x: number; y: number }[]> = {
  npc_desk_challenger: [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ],
  npc_meeting_prepper: [
    { x: 13, y: 3 },
    { x: 13, y: 4 },
    { x: 13, y: 5 },
  ],
  npc_supervisor: [
    { x: 7, y: 3 },
    { x: 8, y: 3 },
    { x: 9, y: 3 },
  ],
}

export type InteractTarget =
  | { kind: 'npc'; id: NpcId; label: string }
  | { kind: 'poi'; id: PoiId; label: string }

export interface InteractSpot {
  x: number
  y: number
  facing: Facing
  target: InteractTarget
}

const npcSpot = (x: number, y: number, facing: Facing, id: NpcId, name: string): InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'npc', id, label: `Talk · ${name}` },
})

const poiSpot = (x: number, y: number, facing: Facing, id: PoiId, label: string): InteractSpot => ({
  x,
  y,
  facing,
  target: { kind: 'poi', id, label },
})

export const INTERACT_SPOTS: InteractSpot[] = [
  npcSpot(7, 16, 'n', 'npc_receptionist', 'Renata'),
  npcSpot(8, 16, 'n', 'npc_receptionist', 'Renata'),
  npcSpot(9, 16, 'n', 'npc_receptionist', 'Renata'),
  npcSpot(7, 14, 'e', 'npc_receptionist', 'Renata'),
  npcSpot(9, 14, 'w', 'npc_receptionist', 'Renata'),
  poiSpot(7, 16, 'n', 'poi_reception_desk', 'Talk · Renata'),
  poiSpot(8, 16, 'n', 'poi_reception_desk', 'Talk · Renata'),
  poiSpot(9, 16, 'n', 'poi_reception_desk', 'Talk · Renata'),
  npcSpot(5, 10, 'e', 'npc_desk_challenger', 'Gavin'),
  npcSpot(6, 9, 's', 'npc_desk_challenger', 'Gavin'),
  npcSpot(6, 11, 'n', 'npc_desk_challenger', 'Gavin'),
  npcSpot(12, 2, 'e', 'npc_meeting_prepper', 'Priya'),
  npcSpot(13, 1, 's', 'npc_meeting_prepper', 'Priya'),
  npcSpot(13, 3, 'n', 'npc_meeting_prepper', 'Priya'),
  npcSpot(7, 3, 'w', 'npc_supervisor', 'Holloway'),
  npcSpot(6, 2, 's', 'npc_supervisor', 'Holloway'),
  npcSpot(6, 4, 'n', 'npc_supervisor', 'Holloway'),
  poiSpot(9, 8, 'n', 'poi_printer', 'Inspect'),
  poiSpot(8, 7, 'e', 'poi_printer', 'Inspect'),
  poiSpot(15, 8, 'n', 'poi_supply_cabinet', 'Open cabinet'),
  poiSpot(18, 8, 'n', 'poi_break_counter', 'Take five'),
  poiSpot(19, 8, 'n', 'poi_break_counter', 'Take five'),
  poiSpot(20, 8, 'n', 'poi_break_counter', 'Take five'),
  poiSpot(21, 9, 'e', 'poi_vending_machine', 'Buy'),
  poiSpot(16, 2, 'e', 'poi_agenda', 'Read agenda'),
  poiSpot(17, 1, 's', 'poi_agenda', 'Read agenda'),
  poiSpot(21, 1, 'e', 'poi_handout_rack', 'Pick a handout'),
  poiSpot(22, 2, 'n', 'poi_handout_rack', 'Pick a handout'),
  poiSpot(2, 2, 'n', 'poi_elevator_door', 'Elevator'),
  poiSpot(3, 2, 'n', 'poi_elevator_door', 'Elevator'),
  poiSpot(4, 2, 'n', 'poi_elevator_door', 'Elevator'),
  poiSpot(4, 1, 'w', 'poi_elevator_door', 'Elevator'),
  poiSpot(13, 14, 'e', 'poi_directory_sign', 'Read'),
  poiSpot(15, 13, 's', 'poi_directory_sign', 'Read'),
  poiSpot(17, 13, 'w', 'poi_directory_sign', 'Read'),
  poiSpot(12, 16, 's', 'poi_exit_door', 'Inspect'),
  poiSpot(11, 16, 's', 'poi_exit_door', 'Inspect'),
  poiSpot(13, 16, 's', 'poi_exit_door', 'Inspect'),
  poiSpot(22, 16, 'e', 'poi_water_cooler', 'Inspect'),
  poiSpot(21, 16, 'e', 'poi_water_cooler', 'Inspect'),
  poiSpot(22, 15, 's', 'poi_water_cooler', 'Inspect'),
  poiSpot(16, 11, 'n', 'poi_break_table', 'Inspect'),
  poiSpot(17, 11, 'n', 'poi_break_table', 'Inspect'),
  poiSpot(16, 10, 's', 'poi_break_table', 'Inspect'),
  poiSpot(17, 10, 's', 'poi_break_table', 'Inspect'),
]

export const HANDOUT_CHOICES = [
  { id: 'key_handout_q3_deck' as const, label: 'Q3 Numbers — Full Deck (48 pp)' },
  { id: 'key_handout_q3_summary' as const, label: 'Q3 Numbers — Summary (1 pg)' },
  { id: 'key_handout_q2_summary' as const, label: 'Q2 Numbers — Summary (1 pg)' },
]

export const AGENDA_TEXT = [
  '10:30 — Q3 NUMBERS REVIEW',
  'Owner: Holloway. Room: this one.',
  'Pre-read: the Q3 summary. One page. Not the deck. Nobody reads the deck.',
]

export const DIRECTORY_TEXT = [
  'FLOOR 1 — Desks: left. Break room: up the hall, right.',
  'Meeting room: top right. Elevator: top left. Badge required.',
]
