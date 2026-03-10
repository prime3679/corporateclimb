/**
 * SpriteFactory — generates all pixel-art textures at runtime.
 *
 * GBA-era Pokémon/Zelda style: chibi proportions, bold outlines,
 * limited palettes, warm saturated colors, character personality.
 *
 * Each sprite is defined as a 2D array of palette indices, then
 * rendered to a Phaser texture at 3x scale (each pixel = 3x3).
 */

import Phaser from 'phaser'

const S = 3 // Scale factor: each art pixel = 3 screen pixels

// ── Palettes ──

// _ = transparent, numbers map to colors
const T = -1 // transparent

const PLAYER_PAL = [
  0x000000,  // 0: outline/black
  0xFFDCAA,  // 1: skin light
  0xE8B888,  // 2: skin shadow
  0x3B2820,  // 3: hair dark
  0x5A3D2B,  // 4: hair mid
  0x4F7FE0,  // 5: shirt
  0x3A5FA0,  // 6: shirt shadow
  0x3D4566,  // 7: pants
  0x2A3048,  // 8: pants shadow
  0x8B5513,  // 9: shoes
  0xFFFFFF,  // 10: eye white
  0xCC4444,  // 11: mouth/blush
]

// Player idle: 16w x 24h
const PLAYER_IDLE = [
  [T,T,T,T,T,3,3,3,3,3,3,T,T,T,T,T],
  [T,T,T,T,3,4,4,4,4,4,4,3,T,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,0,0,1,1,1,1,1,1,1,1,0,0,T,T],
  [T,T,0,1,1,10,0,1,1,10,0,1,1,0,T,T],
  [T,T,0,1,1,0,0,1,1,0,0,1,1,0,T,T],
  [T,T,0,1,1,1,1,2,2,1,1,1,1,0,T,T],
  [T,T,0,1,1,1,11,11,11,1,1,1,0,T,T],
  [T,T,T,0,1,1,1,1,1,1,1,1,0,T,T,T],
  [T,T,T,T,0,0,0,0,0,0,0,0,T,T,T,T],
  [T,T,0,0,5,5,5,5,5,5,5,5,0,0,T,T],
  [T,0,6,5,5,5,5,5,5,5,5,5,5,6,0,T],
  [T,0,6,5,5,5,5,5,5,5,5,5,5,6,0,T],
  [0,2,0,5,5,5,5,5,5,5,5,5,5,0,2,0],
  [0,1,0,5,5,5,5,5,5,5,5,5,5,0,1,0],
  [T,0,T,0,6,5,5,5,5,5,5,6,0,T,0,T],
  [T,T,T,0,0,7,7,7,7,7,7,0,0,T,T,T],
  [T,T,T,0,7,7,7,0,0,7,7,7,0,T,T,T],
  [T,T,T,0,7,8,7,0,0,7,8,7,0,T,T,T],
  [T,T,T,0,8,8,7,0,0,7,8,8,0,T,T,T],
  [T,T,T,0,0,0,0,T,T,0,0,0,0,T,T,T],
  [T,T,T,0,9,9,0,T,T,0,9,9,0,T,T,T],
  [T,T,T,0,0,0,0,T,T,0,0,0,0,T,T,T],
]

// Player run frame 1: legs apart, arm forward
const PLAYER_RUN1 = [
  [T,T,T,T,T,3,3,3,3,3,3,T,T,T,T,T],
  [T,T,T,T,3,4,4,4,4,4,4,3,T,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,0,0,1,1,1,1,1,1,1,1,0,0,T,T],
  [T,T,0,1,1,10,0,1,1,10,0,1,1,0,T,T],
  [T,T,0,1,1,0,0,1,1,0,0,1,1,0,T,T],
  [T,T,0,1,1,1,1,2,2,1,1,1,1,0,T,T],
  [T,T,0,1,1,1,11,11,11,1,1,1,0,T,T],
  [T,T,T,0,1,1,1,1,1,1,1,1,0,T,T,T],
  [T,T,T,T,0,0,0,0,0,0,0,0,T,T,T,T],
  [T,0,0,0,5,5,5,5,5,5,5,5,0,0,T,T],
  [0,2,6,5,5,5,5,5,5,5,5,5,5,6,0,T],
  [0,1,6,5,5,5,5,5,5,5,5,5,5,0,T,T],
  [T,0,0,5,5,5,5,5,5,5,5,5,0,2,0,T],
  [T,T,T,0,5,5,5,5,5,5,5,0,1,0,T,T],
  [T,T,T,0,0,6,5,5,5,6,0,0,0,T,T,T],
  [T,T,0,7,7,7,0,0,7,7,7,0,T,T,T,T],
  [T,0,7,7,8,0,T,T,0,7,7,7,0,T,T,T],
  [T,0,8,8,0,T,T,T,T,0,8,7,0,T,T,T],
  [T,0,0,0,T,T,T,T,T,T,0,0,0,T,T,T],
  [T,0,9,0,T,T,T,T,T,T,0,9,0,T,T,T],
  [T,0,0,0,T,T,T,T,T,T,0,0,0,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
]

// Player run frame 2: legs together, other arm forward
const PLAYER_RUN2 = [
  [T,T,T,T,T,3,3,3,3,3,3,T,T,T,T,T],
  [T,T,T,T,3,4,4,4,4,4,4,3,T,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,0,0,1,1,1,1,1,1,1,1,0,0,T,T],
  [T,T,0,1,1,10,0,1,1,10,0,1,1,0,T,T],
  [T,T,0,1,1,0,0,1,1,0,0,1,1,0,T,T],
  [T,T,0,1,1,1,1,2,2,1,1,1,1,0,T,T],
  [T,T,0,1,1,1,11,11,11,1,1,1,0,T,T],
  [T,T,T,0,1,1,1,1,1,1,1,1,0,T,T,T],
  [T,T,T,T,0,0,0,0,0,0,0,0,T,T,T,T],
  [T,T,0,0,5,5,5,5,5,5,5,5,0,0,0,T],
  [T,0,6,5,5,5,5,5,5,5,5,5,5,6,2,0],
  [T,T,0,5,5,5,5,5,5,5,5,5,5,6,1,0],
  [T,0,2,0,5,5,5,5,5,5,5,5,5,0,0,T],
  [T,T,0,1,0,5,5,5,5,5,5,5,0,T,T,T],
  [T,T,T,0,0,0,6,5,5,6,0,0,T,T,T,T],
  [T,T,T,T,0,7,7,7,0,7,7,7,0,T,T,T],
  [T,T,T,0,7,7,7,0,T,T,0,8,7,0,T,T],
  [T,T,T,0,7,8,0,T,T,T,T,0,8,0,T,T],
  [T,T,T,0,0,0,T,T,T,T,T,0,0,0,T,T],
  [T,T,T,0,9,0,T,T,T,T,T,0,9,0,T,T],
  [T,T,T,0,0,0,T,T,T,T,T,0,0,0,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
]

// Player jump: arms up, legs tucked
const PLAYER_JUMP = [
  [T,T,T,T,T,3,3,3,3,3,3,T,T,T,T,T],
  [T,T,T,T,3,4,4,4,4,4,4,3,T,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,T,3,4,4,4,4,4,4,4,4,3,T,T,T],
  [T,T,0,0,1,1,1,1,1,1,1,1,0,0,T,T],
  [T,T,0,1,1,10,0,1,1,10,0,1,1,0,T,T],
  [T,T,0,1,1,0,0,1,1,0,0,1,1,0,T,T],
  [T,T,0,1,1,1,1,2,2,1,1,1,1,0,T,T],
  [T,T,0,1,1,1,1,1,1,1,1,1,0,T,T,T],
  [T,T,T,0,1,1,1,1,1,1,1,1,0,T,T,T],
  [0,2,0,T,0,0,0,0,0,0,0,0,T,0,2,0],
  [0,1,0,0,5,5,5,5,5,5,5,5,0,0,1,0],
  [T,0,6,5,5,5,5,5,5,5,5,5,5,6,0,T],
  [T,T,0,5,5,5,5,5,5,5,5,5,5,0,T,T],
  [T,T,0,5,5,5,5,5,5,5,5,5,5,0,T,T],
  [T,T,T,0,6,5,5,5,5,5,5,6,0,T,T,T],
  [T,T,T,0,0,0,0,0,0,0,0,0,0,T,T,T],
  [T,T,T,0,7,7,7,7,7,7,7,7,0,T,T,T],
  [T,T,0,7,7,8,0,T,T,0,8,7,7,0,T,T],
  [T,0,9,9,0,0,T,T,T,T,0,0,9,9,0,T],
  [T,0,0,0,T,T,T,T,T,T,T,T,0,0,0,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
]

// ── Platform palettes ──
const GRASS_PAL = [
  0x308030,  // 0: dark grass
  0x48A848,  // 1: grass mid
  0x68D068,  // 2: grass light
  0x90E890,  // 3: highlight
  0x8B6840,  // 4: dirt
  0x6B4E2A,  // 5: dirt dark
  0xAA8860,  // 6: dirt light
  0x5A3E1E,  // 7: dirt shadow
]

// 16x16 grass platform tile
const GRASS_TILE = [
  [3,2,2,1,3,2,2,1,1,2,3,2,1,2,2,3],
  [2,1,1,2,2,1,1,2,2,1,2,1,2,1,1,2],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,4,6,4,4,5,4,4,6,4,4,4,5,4,4,6],
  [4,5,4,4,6,4,4,5,4,4,6,4,4,4,5,4],
  [5,4,4,5,4,4,6,4,4,5,4,4,6,5,4,4],
  [4,4,5,4,4,4,4,5,4,4,4,5,4,4,4,5],
  [4,6,4,4,7,5,4,4,6,4,5,4,4,7,4,4],
  [5,4,4,5,4,4,4,7,4,4,4,4,5,4,5,4],
  [4,4,7,4,4,6,5,4,4,7,4,6,4,4,4,7],
  [4,5,4,4,5,4,4,4,5,4,4,4,4,5,4,4],
  [7,4,4,7,4,4,7,5,4,4,7,5,7,4,7,4],
  [4,4,5,4,4,5,4,4,4,5,4,4,4,4,4,5],
  [5,7,4,4,7,4,4,7,5,4,4,7,5,7,4,4],
  [4,4,4,5,4,4,5,4,4,4,5,4,4,4,5,4],
]

// Stone tile palette
const STONE_PAL = [
  0x5A6677,  // 0: dark stone
  0x7A8899,  // 1: mid stone
  0x99AABB,  // 2: light stone
  0xAABBCC,  // 3: highlight
  0x4A5566,  // 4: crack/shadow
]

const STONE_TILE = [
  [3,2,2,1,1,1,2,4,3,2,2,1,1,1,2,2],
  [2,1,1,1,1,1,1,4,2,1,1,1,1,1,1,1],
  [2,1,1,1,1,1,1,4,2,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,1,4,1,1,1,1,0,1,1,1],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [2,1,1,4,3,2,2,1,1,1,2,4,3,2,2,1],
  [1,1,1,4,2,1,1,1,1,1,1,4,2,1,1,1],
  [1,0,1,4,1,1,1,1,0,1,1,4,1,1,1,0],
  [1,1,1,4,1,1,1,1,1,1,1,4,1,1,1,1],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [3,2,2,1,1,1,2,4,3,2,2,1,1,1,2,2],
  [2,1,1,1,0,1,1,4,2,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1],
  [1,1,0,1,1,1,1,4,1,1,1,1,1,0,1,1],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [2,1,1,1,1,2,1,4,2,1,1,2,1,1,1,1],
]

// Corporate floor platform tiles

// Linoleum (mailroom/lobby) — beige tiles with grout lines
const LINOLEUM_PAL = [
  0xD4C5A9,  // 0: tile light
  0xC4B599,  // 1: tile mid
  0xB8A88E,  // 2: tile dark
  0x8B7D6B,  // 3: grout/scuff
  0x6B5B4B,  // 4: baseboard
  0xDDD0B8,  // 5: highlight
]

const LINOLEUM_TILE = [
  [5,0,0,1,1,1,0,3,5,0,0,1,1,1,0,0],
  [0,1,1,1,1,1,1,3,0,1,1,1,1,1,1,1],
  [0,1,1,1,2,1,1,3,0,1,1,2,1,1,1,1],
  [1,1,2,1,1,1,1,3,1,1,1,1,1,2,1,1],
  [1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,2,1,3,0,1,1,1,2,1,1,1],
  [0,1,1,1,1,1,1,3,0,1,1,1,1,1,1,1],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [5,0,0,1,1,1,0,3,5,0,0,1,1,1,0,0],
  [0,1,1,1,1,1,1,3,0,1,1,1,1,1,1,1],
  [0,1,2,1,1,1,1,3,0,1,1,1,1,2,1,1],
  [1,1,1,1,2,1,1,3,1,1,2,1,1,1,1,1],
  [1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1],
  [0,1,1,2,1,1,1,3,0,1,1,1,1,1,2,1],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
]

// Carpet (cubicle farm) — gray with subtle pattern
const CARPET_PAL = [
  0x6B7280,  // 0: carpet mid
  0x5B6370,  // 1: carpet dark
  0x7B8490,  // 2: carpet light
  0x4B5563,  // 3: pattern
  0x8B95A0,  // 4: highlight
  0x3B4553,  // 5: edge
]

const CARPET_TILE = [
  [2,0,0,1,0,0,2,0,0,1,0,0,2,0,0,1],
  [0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0],
  [0,0,3,0,0,0,0,3,0,0,0,0,3,0,0,0],
  [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0],
  [0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0],
  [0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0],
  [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,3],
  [1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0],
  [0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0],
  [0,3,0,0,0,0,0,0,3,0,0,0,0,0,0,3],
  [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
  [1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
]

// Hardwood (executive floor) — warm brown planks
const HARDWOOD_PAL = [
  0x8B6544,  // 0: plank dark
  0xA07856,  // 1: plank mid
  0xC49B6F,  // 2: plank light
  0x6B4226,  // 3: gap/shadow
  0xDEB887,  // 4: highlight
  0x785030,  // 5: knot
]

const HARDWOOD_TILE = [
  [4,2,2,1,1,1,2,2,4,2,2,1,1,1,2,2],
  [2,1,1,1,0,1,1,1,2,1,1,0,1,1,1,1],
  [1,1,0,1,1,1,5,1,1,1,1,1,1,5,1,0],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [2,1,4,2,2,1,1,1,2,4,2,2,1,1,1,2],
  [1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1],
  [0,1,1,5,1,1,1,0,1,1,1,1,1,0,1,1],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [4,2,1,1,1,2,2,4,2,1,1,1,2,2,4,2],
  [1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
  [1,0,1,1,1,5,1,1,0,1,1,1,5,1,1,0],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [2,2,4,2,1,1,1,2,2,4,2,1,1,1,2,2],
  [1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1],
  [1,1,1,1,0,1,1,1,1,5,1,0,1,1,1,1],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
]

// Marble (C-suite) — white with gray veins
const MARBLE_PAL = [
  0xE8E4E0,  // 0: marble white
  0xD8D4D0,  // 1: marble light gray
  0xBBB5AD,  // 2: vein
  0xF5F0E8,  // 3: highlight
  0xCCC5BD,  // 4: vein dark
  0xA8A098,  // 5: shadow
]

const MARBLE_TILE = [
  [3,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0],
  [0,0,1,0,0,0,0,2,0,0,1,0,0,0,0,1],
  [0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0],
  [0,1,0,2,0,0,4,0,0,1,0,0,0,4,0,0],
  [0,0,0,0,4,0,0,0,0,0,0,4,0,0,0,0],
  [0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0],
  [1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,2,0,0,4,0,0,2,0,0,0,0,1],
  [0,0,0,0,0,4,0,0,0,0,0,0,0,2,0,0],
  [0,2,0,0,0,0,0,0,0,0,0,0,4,0,0,0],
  [0,0,0,0,0,0,4,0,0,2,0,0,0,0,0,0],
  [0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0],
  [1,0,0,0,2,0,0,0,1,0,0,2,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2],
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
]

// One-way platform tile
const ONEWAY_PAL = [
  0x8B6544,  // 0: wood dark
  0xA0784F,  // 1: wood mid
  0xC49B6F,  // 2: wood light
  0x6B4E30,  // 3: wood shadow
  0xDEB887,  // 4: wood highlight
]

const ONEWAY_TILE = [
  [4,2,2,1,1,1,2,2,4,2,2,1,1,1,2,2],
  [2,1,1,0,1,1,1,1,2,1,1,0,1,1,1,1],
  [1,1,0,3,0,1,1,1,1,1,0,3,0,1,1,1],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
]

// ── Enemy definitions ──

const ALARM_PAL = [0x000000, 0xE74C3C, 0xAD3428, 0xFFD700, 0xFFFFFF, 0xCC0000]

const ALARM_SPRITE = [
  [T,T,T,3,3,T,T,T,T,3,3,T],
  [T,T,3,3,3,0,0,0,0,3,3,T],
  [T,0,0,1,1,1,1,1,1,1,0,0],
  [T,0,1,1,1,1,1,1,1,1,1,0],
  [T,0,1,4,4,4,1,1,1,1,1,0],
  [T,0,1,4,0,4,1,0,1,1,1,0],
  [T,0,1,4,4,0,0,1,1,1,1,0],
  [T,0,1,1,1,1,1,1,1,1,1,0],
  [T,0,2,1,1,1,1,1,1,1,2,0],
  [T,T,0,0,1,1,1,1,1,0,0,T],
  [T,T,T,0,0,0,0,0,0,0,T,T],
  [T,T,0,0,T,T,T,T,T,0,0,T],
]

const FREELOADER_PAL = [0x000000, 0x2ECC71, 0x1D8348, 0x27AE60, 0xFFFFFF, 0xFF6B6B]

const FREELOADER_SPRITE = [
  [T,T,T,0,0,0,0,0,T,T],
  [T,T,0,1,1,1,1,1,0,T],
  [T,0,1,1,1,1,1,1,1,0],
  [0,1,4,0,1,1,4,0,1,1],
  [0,3,1,1,1,1,1,1,3,0],
  [0,2,1,1,0,0,1,1,2,0],
  [0,2,2,3,3,3,3,2,2,0],
  [T,0,2,2,2,2,2,2,0,T],
  [T,0,2,0,2,2,0,2,0,T],
  [T,T,0,0,T,T,0,0,T,T],
]

const SCOPE_PAL = [0x000000, 0xE67E22, 0xD35400, 0xF39C12, 0xFFFFFF]

const SCOPE_SPRITE = [
  [T,T,T,1,1,1,1,T,T,T,T,T],
  [T,T,1,3,1,1,3,1,T,T,T,T],
  [T,1,1,1,1,1,1,1,1,T,T,T],
  [1,1,1,4,0,1,4,0,1,1,T,T],
  [1,2,1,1,1,1,1,1,1,2,1,T],
  [1,2,2,1,1,1,1,1,2,2,1,T],
  [1,2,2,1,0,0,0,1,2,2,1,1],
  [T,1,2,2,1,1,1,2,2,1,1,1],
  [T,T,1,2,2,2,2,2,1,1,T,T],
  [T,T,T,1,1,1,1,1,T,T,T,T],
  [T,T,T,T,1,T,1,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T],
]

// ── NPC definition ──
const NPC_PAL = [
  0x000000,  // 0: outline
  0xFFDCAA,  // 1: skin
  0xE8B888,  // 2: skin shadow
  0xFFFFFF,  // 3: eye white
]

// NPC is rendered with variable shirt color (index 4+)
const NPC_BODY = [
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,0,1,1,1,1,1,1,1,1,0,T],
  [T,0,1,3,0,1,1,3,0,1,0,T],
  [T,0,1,1,1,2,2,1,1,1,0,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,0,0,4,4,4,4,4,4,0,0,T],
  [0,2,0,4,4,5,5,4,4,0,2,0],
  [0,1,0,4,4,4,4,4,4,0,1,0],
  [T,0,T,0,4,4,4,4,0,T,0,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
]

// NPC variants — intern (with lanyard)
const NPC_INTERN = [
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,0,1,1,1,1,1,1,1,1,0,T],
  [T,0,1,3,0,1,1,3,0,1,0,T],
  [T,0,1,1,1,2,2,1,1,1,0,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,0,0,4,4,6,4,4,4,0,0,T],  // 6 = lanyard/badge
  [0,2,0,4,4,6,5,4,4,0,2,0],
  [0,1,0,4,4,6,4,4,4,0,1,0],
  [T,0,T,0,4,4,4,4,0,T,0,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
]

// NPC manager (with tie, wider shoulders)
const NPC_MANAGER = [
  [T,T,T,0,0,0,0,0,0,T,T,T,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T,T,T],
  [T,0,1,1,1,1,1,1,1,1,0,T,T,T],
  [T,0,1,3,0,1,1,3,0,1,0,T,T,T],
  [T,0,1,1,1,2,2,1,1,1,0,T,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T,T,T],
  [0,0,0,4,4,4,4,4,4,0,0,0,T,T],
  [0,2,0,4,4,6,6,4,4,0,2,0,T,T],  // 6 = tie
  [0,1,0,4,4,6,6,4,4,0,1,0,T,T],
  [T,0,T,0,4,4,6,4,0,T,0,T,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T,T,T],
]

// NPC executive (taller, suit jacket)
const NPC_EXEC = [
  [T,T,T,T,0,0,0,0,0,0,T,T,T,T],
  [T,T,T,0,1,1,1,1,1,1,0,T,T,T],
  [T,T,0,1,1,1,1,1,1,1,1,0,T,T],
  [T,T,0,1,3,0,1,1,3,0,1,0,T,T],
  [T,T,0,1,1,1,2,2,1,1,1,0,T,T],
  [T,T,T,0,1,1,1,1,1,1,0,T,T,T],
  [T,T,T,T,0,0,0,0,0,0,T,T,T,T],
  [T,0,0,5,4,4,4,4,4,4,5,0,0,T],
  [0,2,0,5,4,4,6,6,4,4,5,0,2,0],
  [0,1,0,5,4,4,6,6,4,4,5,0,1,0],
  [T,0,T,0,5,4,4,4,4,5,0,T,0,T],
  [T,T,T,0,0,5,5,5,5,0,0,T,T,T],
  [T,T,T,0,0,0,0,0,0,0,0,T,T,T],
  [T,T,T,T,0,0,T,T,0,0,T,T,T,T],
  [T,T,T,T,0,0,T,T,0,0,T,T,T,T],
  [T,T,T,T,0,0,T,T,0,0,T,T,T,T],
]

// NPC IT guy (hoodie + headphones)
const NPC_IT = [
  [T,T,0,0,0,0,0,0,0,0,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,0,1,1,1,1,1,1,1,1,0,T],
  [6,0,1,3,0,1,1,3,0,1,0,6],  // 6 = headphones
  [T,0,1,1,1,2,2,1,1,1,0,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,0,4,4,4,4,4,4,4,4,0,T],  // hoodie (wider)
  [0,2,4,4,4,5,5,4,4,4,2,0],
  [0,1,0,4,4,4,4,4,4,0,1,0],
  [T,0,T,0,4,4,4,4,0,T,0,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
]

// NPC HR (clipboard in front)
const NPC_HR = [
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,0,1,1,1,1,1,1,1,1,0,T],
  [T,0,1,3,0,1,1,3,0,1,0,T],
  [T,0,1,1,1,2,2,1,1,1,0,T],
  [T,T,0,1,1,1,1,1,1,0,T,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,0,0,4,4,4,4,4,4,0,0,T],
  [0,2,0,4,6,6,6,6,4,0,2,0],  // 6 = clipboard
  [0,1,0,4,6,0,0,6,4,0,1,0],
  [T,0,T,0,6,6,6,6,0,T,0,T],
  [T,T,T,0,0,0,0,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
  [T,T,T,0,0,T,T,0,0,T,T,T],
]

// ── Power-up definitions ──
const ESPRESSO_PAL = [0x000000, 0x6F4E37, 0xDEB887, 0xFFFFFF, 0x8B6544, 0xF5F5DC]
const ESPRESSO_SPRITE = [
  [T,T,T,5,T,5,T,T],
  [T,T,5,T,5,T,T,T],
  [T,0,0,0,0,0,0,T],
  [T,0,2,2,1,1,0,T],
  [T,0,1,1,1,1,0,0],
  [T,0,1,4,1,1,0,3],
  [T,0,1,1,1,1,0,0],
  [T,0,0,0,0,0,0,T],
  [T,T,0,2,2,0,T,T],
  [T,T,0,0,0,0,T,T],
]

// Energy drink (8x16)
const EDRINK_PAL = [0x000000, 0x00CC66, 0x00AA55, 0xFFFFFF, 0xC0C0C0, 0x009944]
const EDRINK_SPRITE = [
  [T,T,T,4,4,T,T,T],
  [T,T,0,4,4,0,T,T],
  [T,0,1,1,1,1,0,T],
  [T,0,1,2,2,1,0,T],
  [T,0,1,1,1,1,0,T],
  [T,0,3,3,3,3,0,T],
  [T,0,3,0,0,3,0,T],
  [T,0,3,3,3,3,0,T],
  [T,0,1,1,1,1,0,T],
  [T,0,1,5,1,1,0,T],
  [T,0,1,1,5,1,0,T],
  [T,0,1,1,1,1,0,T],
  [T,0,2,2,2,2,0,T],
  [T,0,1,1,1,1,0,T],
  [T,0,2,2,2,2,0,T],
  [T,T,0,0,0,0,T,T],
]

// USB drive (6x10)
const USB_PAL = [0x000000, 0x374151, 0x6B7280, 0x3B82F6, 0x9CA3AF]
const USB_SPRITE = [
  [T,0,4,4,0,T],
  [T,0,1,1,0,T],
  [0,1,1,1,1,0],
  [0,1,2,2,1,0],
  [0,1,1,1,1,0],
  [0,1,1,1,1,0],
  [0,1,3,1,1,0],
  [0,1,1,1,1,0],
  [0,1,1,1,1,0],
  [T,0,0,0,0,T],
]

// Business card (10x6)
const BCARD_PAL = [0xFFFFFF, 0xE8E4E0, 0x000000, 0x3B82F6, 0xCCC8C4]
const BCARD_SPRITE = [
  [2,2,2,2,2,2,2,2,2,2],
  [2,0,0,0,0,0,0,3,0,2],
  [2,0,4,4,4,4,0,3,0,2],
  [2,0,0,0,0,0,0,0,0,2],
  [2,0,4,4,4,4,4,4,0,2],
  [2,2,2,2,2,2,2,2,2,2],
]

// Stress ball (8x8)
const SBALL_PAL = [0x000000, 0xEF4444, 0xDC2626, 0xF87171, 0xFCA5A5]
const SBALL_SPRITE = [
  [T,T,0,0,0,0,T,T],
  [T,0,3,4,3,1,0,T],
  [0,3,1,3,1,1,2,0],
  [0,4,3,1,1,2,2,0],
  [0,1,1,1,2,2,2,0],
  [0,1,1,2,2,2,2,0],
  [T,0,2,2,2,2,0,T],
  [T,T,0,0,0,0,T,T],
]

// ── Boss base (large 20x28) ──
const BOSS_PAL = [
  0x000000,  // 0: outline
  0xCC0000,  // 1: eye glow
  0xFFD700,  // 2: eye yellow
  0xFFFFFF,  // 3: white
]

// ── Render helper ──

function renderSprite(
  scene: Phaser.Scene,
  key: string,
  data: number[][],
  palette: number[],
) {
  const h = data.length
  const w = data[0].length
  const g = scene.add.graphics()

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = data[y][x]
      if (idx === T) continue
      g.fillStyle(palette[idx], 1)
      g.fillRect(x * S, y * S, S, S)
    }
  }

  g.generateTexture(key, w * S, h * S)
  g.destroy()
}

// ── Public API ──

export function generateAllTextures(scene: Phaser.Scene) {
  // Player frames
  renderSprite(scene, 'player_idle', PLAYER_IDLE, PLAYER_PAL)
  renderSprite(scene, 'player_run1', PLAYER_RUN1, PLAYER_PAL)
  renderSprite(scene, 'player_run2', PLAYER_RUN2, PLAYER_PAL)
  renderSprite(scene, 'player_jump', PLAYER_JUMP, PLAYER_PAL)

  // Platforms
  renderSprite(scene, 'platform_grass', GRASS_TILE, GRASS_PAL)
  renderSprite(scene, 'platform_stone', STONE_TILE, STONE_PAL)
  renderSprite(scene, 'platform_oneway', ONEWAY_TILE, ONEWAY_PAL)
  renderSprite(scene, 'platform_linoleum', LINOLEUM_TILE, LINOLEUM_PAL)
  renderSprite(scene, 'platform_carpet', CARPET_TILE, CARPET_PAL)
  renderSprite(scene, 'platform_hardwood', HARDWOOD_TILE, HARDWOOD_PAL)
  renderSprite(scene, 'platform_marble', MARBLE_TILE, MARBLE_PAL)

  // Enemies
  renderSprite(scene, 'enemy_alarm', ALARM_SPRITE, ALARM_PAL)
  renderSprite(scene, 'enemy_freeloader', FREELOADER_SPRITE, FREELOADER_PAL)
  renderSprite(scene, 'enemy_scopecreep', SCOPE_SPRITE, SCOPE_PAL)

  // Power-ups
  renderSprite(scene, 'powerup_espresso', ESPRESSO_SPRITE, ESPRESSO_PAL)
  renderSprite(scene, 'powerup_energy_drink', EDRINK_SPRITE, EDRINK_PAL)
  renderSprite(scene, 'powerup_usb_drive', USB_SPRITE, USB_PAL)
  renderSprite(scene, 'powerup_business_card', BCARD_SPRITE, BCARD_PAL)
  renderSprite(scene, 'powerup_stress_ball', SBALL_SPRITE, SBALL_PAL)

  // NPCs (5 color variants of each type)
  const NPC_COLORS = [
    [0x3498DB, 0x2471A3],  // blue
    [0xE74C3C, 0xA93226],  // red
    [0x2ECC71, 0x1D8348],  // green
    [0xF39C12, 0xD68910],  // orange
    [0x9B59B6, 0x7D3C98],  // purple
  ]
  const NPC_TYPES: { key: string; body: number[][] }[] = [
    { key: 'npc', body: NPC_BODY },
    { key: 'npc_intern', body: NPC_INTERN },
    { key: 'npc_manager', body: NPC_MANAGER },
    { key: 'npc_executive', body: NPC_EXEC },
    { key: 'npc_it_guy', body: NPC_IT },
    { key: 'npc_hr', body: NPC_HR },
  ]
  for (const npcType of NPC_TYPES) {
    for (let i = 0; i < NPC_COLORS.length; i++) {
      const pal = [...NPC_PAL, NPC_COLORS[i][0], NPC_COLORS[i][1]]
      renderSprite(scene, `${npcType.key}_${i}`, npcType.body, pal)
    }
  }

  // Bosses (color variants of same large sprite)
  generateBossTextures(scene)

  // Background elements
  generateBgTextures(scene)

  // Bush/shrub for small background rectangles
  const BUSH_PAL = [0x2D5A1E, 0x4A8C38, 0x6CBF50, 0x8FD86E, 0x3A6B28]
  const BUSH = [
    [T,T,T,T,2,3,3,2,T,T,T,T],
    [T,T,2,3,1,2,3,1,3,2,T,T],
    [T,2,1,1,0,1,1,0,1,1,2,T],
    [2,1,0,1,1,0,1,1,0,1,0,2],
    [1,0,1,4,0,1,0,4,1,0,1,1],
    [0,4,0,0,4,0,4,0,0,4,0,0],
  ]
  renderSprite(scene, 'bg_bush', BUSH, BUSH_PAL)

  // Pokémon-style round tree (16x20)
  const TREE_PAL = [
    0x1A5C10,  // 0: dark leaf
    0x38A028,  // 1: mid leaf
    0x50C840,  // 2: light leaf
    0x70E060,  // 3: highlight
    0x6B4226,  // 4: trunk dark
    0x8B5A2B,  // 5: trunk
    0xA07040,  // 6: trunk light
    0x000000,  // 7: outline
  ]
  const TREE = [
    [T,T,T,T,T,T,2,3,3,2,T,T,T,T,T,T],
    [T,T,T,T,2,3,2,1,1,2,3,2,T,T,T,T],
    [T,T,T,2,1,2,1,1,1,1,2,1,2,T,T,T],
    [T,T,2,1,1,1,0,1,1,0,1,1,1,2,T,T],
    [T,2,1,1,0,1,1,1,1,1,1,0,1,1,2,T],
    [T,2,1,0,1,1,1,0,0,1,1,1,0,1,2,T],
    [2,1,1,1,1,0,1,1,1,1,0,1,1,1,1,2],
    [2,1,0,1,1,1,1,1,1,1,1,1,1,0,1,2],
    [2,1,1,1,0,1,1,1,1,1,1,0,1,1,1,2],
    [T,2,1,1,1,1,0,1,1,0,1,1,1,1,2,T],
    [T,T,2,1,1,1,1,1,1,1,1,1,1,2,T,T],
    [T,T,T,2,2,1,1,1,1,1,1,2,2,T,T,T],
    [T,T,T,T,T,7,7,5,5,7,7,T,T,T,T,T],
    [T,T,T,T,T,7,5,5,5,5,7,T,T,T,T,T],
    [T,T,T,T,T,7,5,6,6,5,7,T,T,T,T,T],
    [T,T,T,T,T,7,5,5,5,5,7,T,T,T,T,T],
    [T,T,T,T,T,7,4,5,5,4,7,T,T,T,T,T],
    [T,T,T,T,T,7,4,4,4,4,7,T,T,T,T,T],
    [T,T,T,T,7,4,4,4,4,4,4,7,T,T,T,T],
    [T,T,T,T,7,7,7,7,7,7,7,7,T,T,T,T],
  ]
  renderSprite(scene, 'bg_tree', TREE, TREE_PAL)
}

function generateBossTextures(scene: Phaser.Scene) {
  const bosses = [
    { key: 'boss_nocurve', body: 0xC0392B, head: 0xE74C3C },
    { key: 'boss_recruiter', body: 0x2C3E50, head: 0x34495E },
    { key: 'boss_skiplevel', body: 0x8E44AD, head: 0xA569BD },
    { key: 'boss_imposter', body: 0x1A1A2E, head: 0x2C2C44 },
    { key: 'boss_mirror', body: 0x4F7FE0, head: 0x6B9AE8 },
    { key: 'boss_goldencage', body: 0xDAA520, head: 0xFFD700 },
    { key: 'boss_algorithm', body: 0x0077B5, head: 0x0099E0 },
  ]

  for (const b of bosses) {
    const g = scene.add.graphics()

    // Large menacing boss (20x28 at S scale)
    // Head (big, imposing)
    g.fillStyle(0x000000, 1)
    fillBlock(g, 4, 0, 12, 12)  // head outline
    g.fillStyle(b.head, 1)
    fillBlock(g, 5, 1, 10, 10) // head fill

    // Glowing eyes
    g.fillStyle(0xFFD700, 1)
    fillBlock(g, 6, 4, 3, 3)
    fillBlock(g, 11, 4, 3, 3)
    g.fillStyle(0xCC0000, 1)
    fillBlock(g, 7, 5, 1, 1)
    fillBlock(g, 12, 5, 1, 1)

    // Mouth
    g.fillStyle(0x000000, 1)
    fillBlock(g, 7, 8, 6, 2)
    g.fillStyle(0xCC0000, 1)
    fillBlock(g, 8, 8, 4, 1)

    // Body
    g.fillStyle(0x000000, 1)
    fillBlock(g, 2, 12, 16, 12)
    g.fillStyle(b.body, 1)
    fillBlock(g, 3, 13, 14, 10)

    // Shoulder pads
    g.fillStyle(b.head, 1)
    fillBlock(g, 1, 12, 3, 4)
    fillBlock(g, 16, 12, 3, 4)

    // Arms
    g.fillStyle(0x000000, 1)
    fillBlock(g, 0, 14, 2, 8)
    fillBlock(g, 18, 14, 2, 8)

    // Legs
    fillBlock(g, 4, 24, 4, 4)
    fillBlock(g, 12, 24, 4, 4)

    g.generateTexture(b.key, 20 * S, 28 * S)
    g.destroy()
  }
}

function generateBgTextures(scene: Phaser.Scene) {
  // Cloud — fluffy, GBA style
  const g = scene.add.graphics()
  g.fillStyle(0xFFFFFF, 0.9)
  fillBlock(g, 4, 2, 8, 3)
  fillBlock(g, 2, 3, 12, 2)
  fillBlock(g, 6, 1, 4, 1)
  g.fillStyle(0xE8F4FD, 0.7)
  fillBlock(g, 3, 4, 10, 1)
  fillBlock(g, 5, 2, 6, 1)
  g.generateTexture('bg_cloud', 16 * S, 6 * S)
  g.destroy()

  // ── Corporate environment textures ──

  // Desk with monitor (16x12)
  const DESK_PAL = [0x78350F, 0x6B4226, 0x374151, 0x6DB8E0, 0x1F2937, 0xA0784F, 0x000000]
  const DESK_SPRITE = [
    [T,T,T,T,T,6,2,2,2,2,6,T,T,T,T,T],
    [T,T,T,T,T,6,3,3,3,3,6,T,T,T,T,T],
    [T,T,T,T,T,6,3,3,3,3,6,T,T,T,T,T],
    [T,T,T,T,T,6,3,3,3,3,6,T,T,T,T,T],
    [T,T,T,T,T,6,2,2,2,2,6,T,T,T,T,T],
    [T,T,T,T,T,T,T,4,4,T,T,T,T,T,T,T],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,5,5,0,0,0,0,0,0,0,0,0,0,5,5,6],
    [6,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6],
    [6,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
    [T,6,T,T,T,T,T,T,T,T,T,T,T,T,6,T],
    [T,6,T,T,T,T,T,T,T,T,T,T,T,T,6,T],
  ]
  renderSprite(scene, 'bg_desk', DESK_SPRITE, DESK_PAL)

  // Cubicle wall with pinboard (16x16)
  const CUB_PAL = [0x9CA3AF, 0x6B7280, 0xFBBF24, 0xEF4444, 0x78716C, 0xB0B8C0, 0x4B5563]
  const CUB_SPRITE = [
    [6,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,0,5,0,0,0,0,5,0,0,0,0,5,0,0,6],
    [6,0,0,0,2,2,0,0,0,3,3,0,0,0,0,6],
    [6,0,0,0,2,2,0,0,0,3,3,0,0,0,0,6],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,0,0,0,0,0,2,2,0,0,0,0,0,0,0,6],
    [6,0,5,0,0,0,2,2,0,0,0,5,0,0,0,6],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,0,0,3,3,0,0,0,0,2,2,0,0,0,0,6],
    [6,0,0,3,3,0,0,0,0,2,2,0,0,0,0,6],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,0,0,0,0,0,0,5,0,0,0,0,0,5,0,6],
    [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
    [6,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],
    [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  ]
  renderSprite(scene, 'bg_cubicle', CUB_SPRITE, CUB_PAL)

  // Water cooler (8x16)
  const WC_PAL = [0xE8E4E0, 0x6DB8E0, 0x374151, 0x000000, 0xC8C4C0, 0x4BA8D0]
  const WC_SPRITE = [
    [T,T,3,0,0,3,T,T],
    [T,3,1,1,1,1,3,T],
    [T,3,1,5,1,1,3,T],
    [T,3,1,1,1,1,3,T],
    [T,3,1,5,1,1,3,T],
    [T,3,1,1,1,1,3,T],
    [T,3,0,0,0,0,3,T],
    [T,3,0,4,4,0,3,T],
    [T,3,0,0,0,0,3,T],
    [T,3,0,0,0,0,3,T],
    [T,3,0,4,0,0,3,T],
    [T,3,0,0,0,0,3,T],
    [T,3,2,2,2,2,3,T],
    [T,T,3,2,2,3,T,T],
    [T,3,3,3,3,3,3,T],
    [T,3,T,T,T,T,3,T],
  ]
  renderSprite(scene, 'bg_watercooler', WC_SPRITE, WC_PAL)

  // Filing cabinet (10x16)
  const FC_PAL = [0x6B7280, 0x4B5563, 0x9CA3AF, 0x000000, 0x838B95]
  const FC_SPRITE = [
    [3,1,1,1,1,1,1,1,1,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,4,0,2,2,0,4,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,1,1,1,1,1,1,1,1,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,4,0,2,2,0,4,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,1,1,1,1,1,1,1,1,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,4,0,2,2,0,4,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,0,0,0,0,0,0,0,0,3],
    [3,1,1,1,1,1,1,1,1,3],
  ]
  renderSprite(scene, 'bg_filing_cabinet', FC_SPRITE, FC_PAL)

  // Motivational poster (10x14)
  const POST_PAL = [0x000000, 0xFFFFFF, 0x4F46E5, 0xFBBF24, 0x8B8585, 0xE8E4E0]
  const POST_SPRITE = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,5,5,5,5,5,5,5,5,0],
    [0,5,2,2,2,2,2,2,5,0],
    [0,5,2,2,2,2,2,2,5,0],
    [0,5,2,2,3,3,2,2,5,0],
    [0,5,2,3,3,3,3,2,5,0],
    [0,5,2,2,2,2,2,2,5,0],
    [0,5,2,2,2,2,2,2,5,0],
    [0,5,5,5,5,5,5,5,5,0],
    [0,5,1,4,4,4,4,1,5,0],
    [0,5,1,1,1,1,1,1,5,0],
    [0,5,4,4,4,4,4,4,5,0],
    [0,5,5,5,5,5,5,5,5,0],
    [0,0,0,0,0,0,0,0,0,0],
  ]
  renderSprite(scene, 'bg_poster', POST_SPRITE, POST_PAL)

  // Sad office plant (8x14)
  const PLANT_PAL = [0x4A8C38, 0x2D5A1E, 0x6CBF50, 0x8B5A2B, 0x6B4226, 0x374151]
  const PLANT_SPRITE = [
    [T,T,T,2,0,T,T,T],
    [T,T,2,0,2,0,T,T],
    [T,2,0,1,0,2,T,T],
    [T,0,1,0,1,0,2,T],
    [2,0,1,0,0,1,0,T],
    [T,2,0,0,1,0,2,T],
    [T,T,2,0,0,2,T,T],
    [T,T,T,1,1,T,T,T],
    [T,T,T,1,1,T,T,T],
    [T,T,5,3,3,5,T,T],
    [T,5,3,3,3,3,5,T],
    [T,5,3,4,4,3,5,T],
    [T,5,3,3,3,3,5,T],
    [T,T,5,5,5,5,T,T],
  ]
  renderSprite(scene, 'bg_plant', PLANT_SPRITE, PLANT_PAL)

  // Coffee machine (10x12)
  const CM_PAL = [0x1F2937, 0x374151, 0xEF4444, 0x6F4E37, 0x4B5563, 0x9CA3AF]
  const CM_SPRITE = [
    [T,4,0,0,0,0,0,0,4,T],
    [T,4,0,1,1,1,1,0,4,T],
    [T,4,0,1,5,5,1,0,4,T],
    [T,4,0,1,5,5,1,0,4,T],
    [T,4,0,1,1,1,1,0,4,T],
    [T,4,0,0,0,0,0,0,4,T],
    [T,4,0,1,2,1,1,0,4,T],
    [T,4,0,0,0,0,0,0,4,T],
    [T,4,T,T,3,3,T,T,4,T],
    [T,4,T,T,3,T,T,T,4,T],
    [T,4,4,4,4,4,4,4,4,T],
    [T,T,4,T,T,T,T,4,T,T],
  ]
  renderSprite(scene, 'bg_coffee_machine', CM_SPRITE, CM_PAL)

  // Building — Pokémon town style: bright colored roofs, cream walls
  const bldgW = 48
  const bldgH = 20
  const g2 = scene.add.graphics()

  const drawHouse = (ox: number, w: number, wall: number, roof: number, roofDark: number) => {
    // Outline
    g2.fillStyle(0x404040, 1)
    fillBlock(g2, ox, 0, w, bldgH)
    // Roof (triangular feel via layered rects)
    g2.fillStyle(roof, 1)
    fillBlock(g2, ox + 1, 0, w - 2, 2)
    fillBlock(g2, ox, 2, w, 3)
    g2.fillStyle(roofDark, 1)
    fillBlock(g2, ox, 4, w, 1)
    // Wall
    g2.fillStyle(wall, 1)
    fillBlock(g2, ox + 1, 5, w - 2, bldgH - 6)
    // Windows
    g2.fillStyle(0x88CCEE, 1)
    fillBlock(g2, ox + 2, 7, 2, 2)
    fillBlock(g2, ox + w - 4, 7, 2, 2)
    // Window cross
    g2.fillStyle(wall, 1)
    fillBlock(g2, ox + 3, 7, 1, 2)  // vertical divider left
    fillBlock(g2, ox + w - 3, 7, 1, 2)  // vertical divider right
    // Door
    g2.fillStyle(0x8B6544, 1)
    fillBlock(g2, ox + Math.floor(w / 2) - 1, bldgH - 5, 2, 5)
    g2.fillStyle(0xA07856, 1)
    fillBlock(g2, ox + Math.floor(w / 2) - 1, bldgH - 4, 2, 3)
  }

  // Red-roof house (Pallet Town style)
  drawHouse(0, 14, 0xF5F0E0, 0xCC4444, 0xAA2222)
  // Blue-roof house
  drawHouse(18, 12, 0xFFF8E8, 0x4477BB, 0x335599)
  // Brown-roof house
  drawHouse(34, 14, 0xF0EAD6, 0xBB7744, 0x995522)

  g2.generateTexture('bg_building', bldgW * S, bldgH * S)
  g2.destroy()
}

function fillBlock(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
  g.fillRect(x * S, y * S, w * S, h * S)
}
