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
  0x2D5A1E,  // 0: dark grass
  0x4A8C38,  // 1: grass mid
  0x6CBF50,  // 2: grass light
  0x8FD86E,  // 3: highlight
  0x7A5A3D,  // 4: dirt
  0x5C3F28,  // 5: dirt dark
  0x9E7E5A,  // 6: dirt light
  0x4E3520,  // 7: dirt shadow
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

  // Enemies
  renderSprite(scene, 'enemy_alarm', ALARM_SPRITE, ALARM_PAL)
  renderSprite(scene, 'enemy_freeloader', FREELOADER_SPRITE, FREELOADER_PAL)
  renderSprite(scene, 'enemy_scopecreep', SCOPE_SPRITE, SCOPE_PAL)

  // Power-ups
  renderSprite(scene, 'powerup_espresso', ESPRESSO_SPRITE, ESPRESSO_PAL)

  // NPCs (5 color variants)
  const NPC_COLORS = [
    [0x3498DB, 0x2471A3],  // blue
    [0xE74C3C, 0xA93226],  // red
    [0x2ECC71, 0x1D8348],  // green
    [0xF39C12, 0xD68910],  // orange
    [0x9B59B6, 0x7D3C98],  // purple
  ]
  for (let i = 0; i < NPC_COLORS.length; i++) {
    const pal = [...NPC_PAL, NPC_COLORS[i][0], NPC_COLORS[i][1]]
    renderSprite(scene, `npc_${i}`, NPC_BODY, pal)
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

  // Building — warm tones, Pokémon/Zelda city vibe
  // 3 building variants side by side for variety
  const bldgW = 48  // 3 buildings of 16 wide
  const bldgH = 32
  const g2 = scene.add.graphics()

  // Building colors: beige, warm gray, light blue
  const bldgColors = [
    { wall: 0x9CA8B5, accent: 0xB8C4D0, window: 0xFBBF24, dark: 0x7A8A9A },
    { wall: 0xD4A574, accent: 0xE8C49A, window: 0x87CEEB, dark: 0xB88A5A },
    { wall: 0xA8B4A0, accent: 0xC0CCBA, window: 0xFFE4B5, dark: 0x8A9A80 },
  ]

  for (let b = 0; b < 3; b++) {
    const ox = b * 16
    const c = bldgColors[b]

    // Wall fill
    g2.fillStyle(c.wall, 1)
    fillBlock(g2, ox, 0, 16, bldgH)

    // Roof cap
    g2.fillStyle(c.dark, 1)
    fillBlock(g2, ox, 0, 16, 2)
    g2.fillStyle(c.accent, 1)
    fillBlock(g2, ox, 2, 16, 1)

    // Vertical side lines
    g2.fillStyle(c.dark, 1)
    fillBlock(g2, ox, 0, 1, bldgH)
    fillBlock(g2, ox + 15, 0, 1, bldgH)

    // Windows (3 cols, 7 rows)
    for (let wy = 0; wy < 7; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        const lit = (wx + wy + b) % 3 !== 0
        const winColor = lit ? c.window : 0x3A4556
        g2.fillStyle(winColor, 1)
        fillBlock(g2, ox + 2 + wx * 5, 4 + wy * 4, 3, 2)
        // Window frame
        g2.fillStyle(c.dark, 1)
        fillBlock(g2, ox + 2 + wx * 5, 4 + wy * 4 + 2, 3, 1)
      }
    }

    // Door on ground floor
    g2.fillStyle(c.dark, 1)
    fillBlock(g2, ox + 6, bldgH - 5, 4, 5)
    g2.fillStyle(c.accent, 1)
    fillBlock(g2, ox + 7, bldgH - 4, 2, 3)
  }

  g2.generateTexture('bg_building', bldgW * S, bldgH * S)
  g2.destroy()
}

function fillBlock(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
  g.fillRect(x * S, y * S, w * S, h * S)
}
