/**
 * SpriteFactory — generates all pixel-art textures at runtime.
 *
 * Inspired by GBA-era Pokémon/Zelda: chibi proportions, bold outlines,
 * limited palettes, warm saturated colors.
 *
 * Every entity texture is created here so the game has zero external
 * image dependencies. Call `generateAllTextures(scene)` in BootScene.preload().
 */

import Phaser from 'phaser'

// ── Pixel drawing helpers ──

function px(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, s = 1) {
  g.fillStyle(color, 1)
  g.fillRect(x * s, y * s, s, s)
}

function rect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, s = 1) {
  g.fillStyle(color, 1)
  g.fillRect(x * s, y * s, w * s, h * s)
}

// ── Color palettes (Pokémon/Zelda inspired) ──

const PAL = {
  // Player
  outline: 0x1A1A2E,
  skinLight: 0xFFDCAA,
  skinMid: 0xE8B888,
  hair: 0x4A3728,
  shirtBlue: 0x4F7FE0,
  shirtBlueDark: 0x3A5FA0,
  pantsGray: 0x3D4566,
  pantsDark: 0x2A3048,
  shoes: 0x8B4513,
  eyeWhite: 0xFFFFFF,
  eyePupil: 0x1A1A2E,

  // Platforms
  grassTop: 0x5CB85C,
  grassHighlight: 0x7FD87F,
  grassDark: 0x3D8B3D,
  dirt: 0xA0764F,
  dirtDark: 0x7D5A38,
  dirtLight: 0xC49B6F,
  stone: 0x8899AA,
  stoneDark: 0x667788,
  stoneLight: 0xAABBCC,

  // Enemies
  alarmRed: 0xE74C3C,
  alarmDark: 0xA83228,
  alarmBell: 0xFFD700,
  freeloaderGreen: 0x2ECC71,
  freeloaderDark: 0x1D8348,
  midtermPaper: 0xFFF8DC,
  midtermText: 0x333333,
  resumeGapPurple: 0x9B59B6,
  linkedInBlue: 0x0077B5,
  overachieverGold: 0xFFD700,
  coffeeRunBrown: 0x8B4513,
  slackPurple: 0x611F69,
  creditThiefRed: 0xC0392B,
  scopeCreepOrange: 0xE67E22,
  handcuffsGold: 0xDAA520,

  // Power-ups
  espressoBrown: 0x6F4E37,
  espressoLight: 0xDEB887,
  networkCardBlue: 0x3498DB,
  ptoGreen: 0x27AE60,
  sideHustlePurple: 0x8E44AD,
  endorsementBlue: 0x2980B9,
  mentorWisdom: 0xF39C12,

  // NPCs
  npcSkin: 0xFFDCAA,
  npcOutline: 0x2C3E50,

  // Bosses
  bossOutline: 0x0D0D0D,
  bossRed: 0xE74C3C,
  bossPurple: 0x8E44AD,
  bossGold: 0xFFD700,

  // Background
  skyBlue: 0x87CEEB,
  skyLight: 0xB0E0E6,
  cloudWhite: 0xF0F8FF,
  buildingGray: 0x4A5568,
  buildingDark: 0x2D3748,
  buildingLight: 0x718096,
  windowYellow: 0xFBBF24,
}

const SCALE = 3 // Each "pixel" is 3x3 real pixels

// ── Public API ──

export function generateAllTextures(scene: Phaser.Scene) {
  generatePlayerTextures(scene)
  generatePlatformTextures(scene)
  generateEnemyTextures(scene)
  generatePowerUpTextures(scene)
  generateNPCTexture(scene)
  generateBossTextures(scene)
  generateBackgroundTextures(scene)
}

// ── Player (20x26 pixel grid → 60x78 rendered) ──

function generatePlayerTextures(scene: Phaser.Scene) {
  // Standing frame
  const g = scene.add.graphics()
  const s = SCALE

  // Head (big chibi head, 10x8)
  rect(g, 5, 0, 10, 8, PAL.outline, s)        // head outline
  rect(g, 6, 1, 8, 6, PAL.skinLight, s)        // face fill
  rect(g, 6, 0, 8, 2, PAL.hair, s)             // hair top
  rect(g, 5, 0, 2, 4, PAL.hair, s)             // hair left
  rect(g, 13, 0, 2, 4, PAL.hair, s)            // hair right

  // Eyes
  px(g, 7, 3, PAL.eyeWhite, s)
  px(g, 8, 3, PAL.eyePupil, s)
  px(g, 11, 3, PAL.eyeWhite, s)
  px(g, 12, 3, PAL.eyePupil, s)

  // Mouth
  px(g, 9, 5, PAL.outline, s)
  px(g, 10, 5, PAL.outline, s)

  // Body/shirt (8x7)
  rect(g, 6, 8, 8, 7, PAL.outline, s)
  rect(g, 7, 9, 6, 5, PAL.shirtBlue, s)
  rect(g, 7, 9, 3, 1, PAL.shirtBlueDark, s)   // collar shadow

  // Arms
  rect(g, 4, 9, 2, 5, PAL.outline, s)
  rect(g, 5, 10, 1, 3, PAL.shirtBlue, s)
  rect(g, 14, 9, 2, 5, PAL.outline, s)
  rect(g, 14, 10, 1, 3, PAL.shirtBlue, s)

  // Pants (8x5)
  rect(g, 6, 15, 8, 5, PAL.outline, s)
  rect(g, 7, 16, 2, 3, PAL.pantsGray, s)
  rect(g, 11, 16, 2, 3, PAL.pantsGray, s)

  // Shoes
  rect(g, 5, 20, 4, 2, PAL.outline, s)
  rect(g, 6, 20, 2, 1, PAL.shoes, s)
  rect(g, 11, 20, 4, 2, PAL.outline, s)
  rect(g, 12, 20, 2, 1, PAL.shoes, s)

  g.generateTexture('player_idle', 20 * s, 22 * s)
  g.destroy()

  // Run frame 1 (legs apart)
  const g2 = scene.add.graphics()
  // Reuse same body...
  rect(g2, 5, 0, 10, 8, PAL.outline, s)
  rect(g2, 6, 1, 8, 6, PAL.skinLight, s)
  rect(g2, 6, 0, 8, 2, PAL.hair, s)
  rect(g2, 5, 0, 2, 4, PAL.hair, s)
  rect(g2, 13, 0, 2, 4, PAL.hair, s)
  px(g2, 7, 3, PAL.eyeWhite, s)
  px(g2, 8, 3, PAL.eyePupil, s)
  px(g2, 11, 3, PAL.eyeWhite, s)
  px(g2, 12, 3, PAL.eyePupil, s)
  px(g2, 9, 5, PAL.outline, s)
  px(g2, 10, 5, PAL.outline, s)
  rect(g2, 6, 8, 8, 7, PAL.outline, s)
  rect(g2, 7, 9, 6, 5, PAL.shirtBlue, s)
  // Arms swinging
  rect(g2, 3, 9, 2, 5, PAL.outline, s)
  rect(g2, 4, 10, 1, 3, PAL.shirtBlue, s)
  rect(g2, 15, 9, 2, 5, PAL.outline, s)
  rect(g2, 15, 10, 1, 3, PAL.shirtBlue, s)
  // Legs apart
  rect(g2, 5, 15, 4, 6, PAL.outline, s)
  rect(g2, 6, 16, 2, 3, PAL.pantsGray, s)
  rect(g2, 5, 20, 3, 2, PAL.shoes, s)
  rect(g2, 11, 15, 4, 6, PAL.outline, s)
  rect(g2, 12, 16, 2, 3, PAL.pantsGray, s)
  rect(g2, 12, 20, 3, 2, PAL.shoes, s)

  g2.generateTexture('player_run1', 20 * s, 22 * s)
  g2.destroy()

  // Run frame 2 (legs together)
  const g3 = scene.add.graphics()
  rect(g3, 5, 0, 10, 8, PAL.outline, s)
  rect(g3, 6, 1, 8, 6, PAL.skinLight, s)
  rect(g3, 6, 0, 8, 2, PAL.hair, s)
  rect(g3, 5, 0, 2, 4, PAL.hair, s)
  rect(g3, 13, 0, 2, 4, PAL.hair, s)
  px(g3, 7, 3, PAL.eyeWhite, s)
  px(g3, 8, 3, PAL.eyePupil, s)
  px(g3, 11, 3, PAL.eyeWhite, s)
  px(g3, 12, 3, PAL.eyePupil, s)
  px(g3, 9, 5, PAL.outline, s)
  px(g3, 10, 5, PAL.outline, s)
  rect(g3, 6, 8, 8, 7, PAL.outline, s)
  rect(g3, 7, 9, 6, 5, PAL.shirtBlue, s)
  rect(g3, 4, 9, 2, 5, PAL.outline, s)
  rect(g3, 5, 10, 1, 3, PAL.shirtBlue, s)
  rect(g3, 14, 9, 2, 5, PAL.outline, s)
  rect(g3, 14, 10, 1, 3, PAL.shirtBlue, s)
  // Legs together
  rect(g3, 7, 15, 6, 6, PAL.outline, s)
  rect(g3, 8, 16, 4, 3, PAL.pantsGray, s)
  rect(g3, 7, 20, 3, 2, PAL.shoes, s)
  rect(g3, 10, 20, 3, 2, PAL.shoes, s)

  g3.generateTexture('player_run2', 20 * s, 22 * s)
  g3.destroy()

  // Jump frame (arms up, legs tucked)
  const g4 = scene.add.graphics()
  rect(g4, 5, 0, 10, 8, PAL.outline, s)
  rect(g4, 6, 1, 8, 6, PAL.skinLight, s)
  rect(g4, 6, 0, 8, 2, PAL.hair, s)
  rect(g4, 5, 0, 2, 4, PAL.hair, s)
  rect(g4, 13, 0, 2, 4, PAL.hair, s)
  px(g4, 7, 3, PAL.eyeWhite, s)
  px(g4, 8, 3, PAL.eyePupil, s)
  px(g4, 11, 3, PAL.eyeWhite, s)
  px(g4, 12, 3, PAL.eyePupil, s)
  px(g4, 9, 5, PAL.outline, s)
  px(g4, 10, 5, PAL.outline, s)
  rect(g4, 6, 8, 8, 7, PAL.outline, s)
  rect(g4, 7, 9, 6, 5, PAL.shirtBlue, s)
  // Arms up
  rect(g4, 3, 6, 2, 5, PAL.outline, s)
  rect(g4, 4, 7, 1, 3, PAL.shirtBlue, s)
  rect(g4, 15, 6, 2, 5, PAL.outline, s)
  rect(g4, 15, 7, 1, 3, PAL.shirtBlue, s)
  // Legs tucked
  rect(g4, 6, 15, 8, 4, PAL.outline, s)
  rect(g4, 7, 16, 6, 2, PAL.pantsGray, s)
  rect(g4, 6, 19, 3, 2, PAL.shoes, s)
  rect(g4, 11, 19, 3, 2, PAL.shoes, s)

  g4.generateTexture('player_jump', 20 * s, 22 * s)
  g4.destroy()
}

// ── Platforms ──

function generatePlatformTextures(scene: Phaser.Scene) {
  const s = SCALE

  // Grass tile (16x16 grid)
  const g = scene.add.graphics()
  rect(g, 0, 0, 16, 16, PAL.dirt, s)            // base dirt
  rect(g, 0, 0, 16, 3, PAL.grassTop, s)          // grass top
  rect(g, 1, 0, 2, 1, PAL.grassHighlight, s)     // highlight
  rect(g, 7, 0, 3, 1, PAL.grassHighlight, s)
  rect(g, 13, 0, 2, 1, PAL.grassHighlight, s)
  rect(g, 0, 3, 16, 1, PAL.grassDark, s)         // grass bottom edge
  // Dirt detail
  rect(g, 3, 7, 2, 2, PAL.dirtDark, s)
  rect(g, 10, 9, 3, 2, PAL.dirtDark, s)
  rect(g, 6, 12, 2, 2, PAL.dirtLight, s)
  rect(g, 1, 14, 3, 1, PAL.dirtDark, s)
  rect(g, 12, 14, 2, 1, PAL.dirtDark, s)
  g.generateTexture('platform_grass', 16 * s, 16 * s)
  g.destroy()

  // Stone tile
  const g2 = scene.add.graphics()
  rect(g2, 0, 0, 16, 16, PAL.stone, s)
  rect(g2, 0, 0, 16, 1, PAL.stoneLight, s)      // top highlight
  rect(g2, 0, 15, 16, 1, PAL.stoneDark, s)       // bottom shadow
  rect(g2, 0, 0, 1, 16, PAL.stoneLight, s)       // left highlight
  rect(g2, 15, 0, 1, 16, PAL.stoneDark, s)       // right shadow
  // Brick lines
  rect(g2, 0, 5, 16, 1, PAL.stoneDark, s)
  rect(g2, 0, 10, 16, 1, PAL.stoneDark, s)
  rect(g2, 7, 0, 1, 5, PAL.stoneDark, s)
  rect(g2, 3, 5, 1, 5, PAL.stoneDark, s)
  rect(g2, 11, 5, 1, 5, PAL.stoneDark, s)
  rect(g2, 7, 10, 1, 6, PAL.stoneDark, s)
  g2.generateTexture('platform_stone', 16 * s, 16 * s)
  g2.destroy()

  // One-way platform (thin, wooden)
  const g3 = scene.add.graphics()
  rect(g3, 0, 0, 16, 4, PAL.shoes, s)           // wood color
  rect(g3, 0, 0, 16, 1, PAL.dirtLight, s)        // top highlight
  rect(g3, 0, 3, 16, 1, PAL.dirtDark, s)         // bottom shadow
  rect(g3, 4, 1, 1, 2, PAL.dirtDark, s)          // wood grain
  rect(g3, 10, 1, 1, 2, PAL.dirtDark, s)
  g3.generateTexture('platform_oneway', 16 * s, 4 * s)
  g3.destroy()
}

// ── Enemies ──

function generateEnemyTextures(scene: Phaser.Scene) {
  const s = SCALE

  // Alarm Clock (12x12) - red clock with bell
  const g = scene.add.graphics()
  rect(g, 2, 2, 8, 8, PAL.alarmRed, s)
  rect(g, 1, 1, 10, 1, PAL.outline, s)
  rect(g, 1, 10, 10, 1, PAL.outline, s)
  rect(g, 1, 1, 1, 10, PAL.outline, s)
  rect(g, 10, 1, 1, 10, PAL.outline, s)
  // Bell on top
  rect(g, 0, 0, 3, 2, PAL.alarmBell, s)
  rect(g, 9, 0, 3, 2, PAL.alarmBell, s)
  // Clock face
  rect(g, 4, 4, 4, 4, PAL.eyeWhite, s)
  px(g, 6, 4, PAL.outline, s) // 12 o'clock
  px(g, 6, 6, PAL.outline, s) // center
  px(g, 7, 6, PAL.outline, s) // hand
  // Legs
  rect(g, 3, 10, 2, 2, PAL.outline, s)
  rect(g, 7, 10, 2, 2, PAL.outline, s)
  g.generateTexture('enemy_alarm', 12 * s, 12 * s)
  g.destroy()

  // Freeloader (10x10) - green leech
  const g2 = scene.add.graphics()
  rect(g2, 2, 0, 6, 8, PAL.freeloaderGreen, s)
  rect(g2, 1, 2, 8, 4, PAL.freeloaderGreen, s)
  rect(g2, 0, 4, 10, 3, PAL.freeloaderDark, s)
  // Eyes
  px(g2, 3, 2, PAL.eyeWhite, s)
  px(g2, 4, 2, PAL.eyePupil, s)
  px(g2, 6, 2, PAL.eyeWhite, s)
  px(g2, 7, 2, PAL.eyePupil, s)
  // Grin
  rect(g2, 3, 5, 4, 1, PAL.outline, s)
  // Tentacles
  rect(g2, 1, 7, 2, 3, PAL.freeloaderDark, s)
  rect(g2, 7, 7, 2, 3, PAL.freeloaderDark, s)
  g2.generateTexture('enemy_freeloader', 10 * s, 10 * s)
  g2.destroy()

  // Midterm Stack (8x12) - stack of papers
  const g3 = scene.add.graphics()
  for (let i = 0; i < 4; i++) {
    rect(g3, 0 + i % 2, i * 3, 8, 3, PAL.midtermPaper, s)
    rect(g3, 1 + i % 2, i * 3 + 1, 5, 1, PAL.midtermText, s)
  }
  rect(g3, 0, 0, 8, 1, PAL.outline, s) // top edge
  g3.generateTexture('enemy_midterm', 8 * s, 12 * s)
  g3.destroy()

  // Coffee Run (10x10) - coffee cup with legs
  const g6 = scene.add.graphics()
  rect(g6, 2, 1, 6, 7, PAL.eyeWhite, s)         // cup
  rect(g6, 1, 0, 8, 1, PAL.outline, s)           // rim
  rect(g6, 3, 2, 4, 3, PAL.espressoBrown, s)     // coffee
  rect(g6, 8, 3, 2, 3, PAL.outline, s)           // handle
  rect(g6, 3, 8, 2, 2, PAL.outline, s)           // legs
  rect(g6, 6, 8, 2, 2, PAL.outline, s)
  g6.generateTexture('enemy_coffee', 10 * s, 10 * s)
  g6.destroy()

  // Slack Barrage (8x8) - purple chat bubble
  const g7 = scene.add.graphics()
  rect(g7, 1, 0, 6, 5, PAL.slackPurple, s)
  rect(g7, 0, 1, 8, 3, PAL.slackPurple, s)
  rect(g7, 2, 5, 2, 2, PAL.slackPurple, s)       // speech tail
  rect(g7, 2, 2, 4, 1, PAL.eyeWhite, s)          // text line
  g7.generateTexture('enemy_slack', 8 * s, 8 * s)
  g7.destroy()

  // Credit Thief (10x12) - sneaky figure in dark
  const g8 = scene.add.graphics()
  rect(g8, 3, 0, 4, 4, PAL.outline, s)           // hat
  rect(g8, 2, 4, 6, 4, PAL.creditThiefRed, s)    // body
  px(g8, 3, 5, PAL.eyeWhite, s)
  px(g8, 6, 5, PAL.eyeWhite, s)
  rect(g8, 0, 5, 2, 3, PAL.outline, s)           // arms reaching
  rect(g8, 8, 5, 2, 3, PAL.outline, s)
  rect(g8, 3, 8, 2, 4, PAL.outline, s)           // legs
  rect(g8, 5, 8, 2, 4, PAL.outline, s)
  g8.generateTexture('enemy_creditthief', 10 * s, 12 * s)
  g8.destroy()

  // Scope Creep Blob (12x12) - orange amorphous blob
  const g9 = scene.add.graphics()
  rect(g9, 2, 2, 8, 8, PAL.scopeCreepOrange, s)
  rect(g9, 1, 3, 10, 6, PAL.scopeCreepOrange, s)
  rect(g9, 3, 1, 6, 10, PAL.scopeCreepOrange, s)
  px(g9, 4, 4, PAL.eyeWhite, s)
  px(g9, 5, 4, PAL.eyePupil, s)
  px(g9, 7, 4, PAL.eyeWhite, s)
  px(g9, 8, 4, PAL.eyePupil, s)
  rect(g9, 5, 7, 3, 1, PAL.outline, s)           // wobbly mouth
  g9.generateTexture('enemy_scopecreep', 12 * s, 12 * s)
  g9.destroy()

  // Golden Handcuffs (12x8)
  const g10 = scene.add.graphics()
  rect(g10, 0, 1, 5, 5, PAL.handcuffsGold, s)    // left cuff
  rect(g10, 1, 2, 3, 3, PAL.outline, s)          // left hole
  rect(g10, 7, 1, 5, 5, PAL.handcuffsGold, s)    // right cuff
  rect(g10, 8, 2, 3, 3, PAL.outline, s)          // right hole
  rect(g10, 4, 3, 4, 2, PAL.handcuffsGold, s)    // chain link
  // Sparkle
  px(g10, 2, 0, PAL.eyeWhite, s)
  px(g10, 9, 0, PAL.eyeWhite, s)
  g10.generateTexture('enemy_handcuffs', 12 * s, 8 * s)
  g10.destroy()

  // LinkedIn Swarm (8x8) - blue "in" badge
  const g11 = scene.add.graphics()
  rect(g11, 0, 0, 8, 8, PAL.linkedInBlue, s)
  rect(g11, 2, 2, 1, 4, PAL.eyeWhite, s)         // "i"
  px(g11, 2, 1, PAL.eyeWhite, s)                  // dot
  rect(g11, 4, 2, 1, 4, PAL.eyeWhite, s)         // "n"
  rect(g11, 4, 2, 3, 1, PAL.eyeWhite, s)
  rect(g11, 6, 2, 1, 4, PAL.eyeWhite, s)
  g11.generateTexture('enemy_linkedin', 8 * s, 8 * s)
  g11.destroy()

  // Overachiever (10x14) - gold star character
  const g12 = scene.add.graphics()
  rect(g12, 3, 0, 4, 4, PAL.overachieverGold, s) // star head
  px(g12, 0, 2, PAL.overachieverGold, s)          // star points
  px(g12, 9, 2, PAL.overachieverGold, s)
  px(g12, 5, 0, PAL.eyeWhite, s)
  rect(g12, 3, 4, 4, 6, PAL.outline, s)          // body
  rect(g12, 4, 5, 2, 4, PAL.shirtBlueDark, s)    // suit
  rect(g12, 3, 10, 2, 4, PAL.outline, s)         // legs
  rect(g12, 5, 10, 2, 4, PAL.outline, s)
  g12.generateTexture('enemy_overachiever', 10 * s, 14 * s)
  g12.destroy()

  // Networking Crowd (16x10) - group of silhouettes
  const g13 = scene.add.graphics()
  for (let i = 0; i < 4; i++) {
    const x = i * 4
    const shade = i % 2 === 0 ? PAL.buildingGray : PAL.buildingLight
    rect(g13, x + 1, 0, 2, 3, shade, s)          // head
    rect(g13, x, 3, 4, 7, shade, s)              // body
  }
  g13.generateTexture('enemy_crowd', 16 * s, 10 * s)
  g13.destroy()

  // Resume Gap (10x4) - purple void
  const g14 = scene.add.graphics()
  rect(g14, 0, 0, 10, 4, PAL.resumeGapPurple, s)
  rect(g14, 1, 1, 2, 1, PAL.outline, s)
  rect(g14, 5, 2, 3, 1, PAL.outline, s)
  g14.generateTexture('enemy_resumegap', 10 * s, 4 * s)
  g14.destroy()
}

// ── Power-ups ──

function generatePowerUpTextures(scene: Phaser.Scene) {
  const s = SCALE

  // Espresso (8x10) - coffee cup with steam
  const g = scene.add.graphics()
  rect(g, 1, 3, 6, 6, PAL.espressoBrown, s)
  rect(g, 0, 2, 8, 1, PAL.outline, s)
  rect(g, 1, 9, 6, 1, PAL.outline, s)
  rect(g, 2, 4, 4, 2, PAL.espressoLight, s)      // latte art
  // Steam
  px(g, 2, 0, PAL.cloudWhite, s)
  px(g, 5, 1, PAL.cloudWhite, s)
  g.generateTexture('powerup_espresso', 8 * s, 10 * s)
  g.destroy()

  // Networking Card (10x7) - business card
  const g2 = scene.add.graphics()
  rect(g2, 0, 0, 10, 7, PAL.eyeWhite, s)
  rect(g2, 0, 0, 10, 1, PAL.networkCardBlue, s)
  rect(g2, 1, 2, 4, 1, PAL.outline, s)           // name
  rect(g2, 1, 4, 6, 1, PAL.stoneDark, s)         // detail
  rect(g2, 1, 5, 5, 1, PAL.stoneDark, s)
  g2.generateTexture('powerup_network', 10 * s, 7 * s)
  g2.destroy()

  // PTO Day (8x8) - sun/beach icon
  const g3 = scene.add.graphics()
  rect(g3, 2, 2, 4, 4, PAL.ptoGreen, s)
  rect(g3, 1, 3, 6, 2, PAL.ptoGreen, s)
  rect(g3, 3, 1, 2, 6, PAL.ptoGreen, s)
  px(g3, 4, 4, PAL.eyeWhite, s)                  // center sparkle
  g3.generateTexture('powerup_pto', 8 * s, 8 * s)
  g3.destroy()

  // Side Hustle (8x8) - purple gem
  const g4 = scene.add.graphics()
  rect(g4, 2, 0, 4, 2, PAL.sideHustlePurple, s)
  rect(g4, 1, 2, 6, 3, PAL.sideHustlePurple, s)
  rect(g4, 2, 5, 4, 2, PAL.bossPurple, s)
  rect(g4, 3, 7, 2, 1, PAL.bossPurple, s)
  px(g4, 3, 2, PAL.eyeWhite, s)                  // gem sparkle
  g4.generateTexture('powerup_sidehustle', 8 * s, 8 * s)
  g4.destroy()

  // LinkedIn Endorsement (8x8) - thumbs up
  const g5 = scene.add.graphics()
  rect(g5, 0, 0, 8, 8, PAL.endorsementBlue, s)
  rect(g5, 3, 1, 2, 4, PAL.eyeWhite, s)          // thumb
  rect(g5, 2, 2, 1, 3, PAL.eyeWhite, s)
  rect(g5, 2, 5, 4, 2, PAL.eyeWhite, s)          // fist
  g5.generateTexture('powerup_endorsement', 8 * s, 8 * s)
  g5.destroy()

  // Mentor's Advice (8x10) - scroll/book
  const g6 = scene.add.graphics()
  rect(g6, 1, 0, 6, 9, PAL.mentorWisdom, s)
  rect(g6, 0, 0, 1, 9, PAL.outline, s)
  rect(g6, 7, 0, 1, 9, PAL.outline, s)
  rect(g6, 2, 2, 4, 1, PAL.outline, s)           // text lines
  rect(g6, 2, 4, 3, 1, PAL.outline, s)
  rect(g6, 2, 6, 4, 1, PAL.outline, s)
  g6.generateTexture('powerup_mentor', 8 * s, 10 * s)
  g6.destroy()
}

// ── NPC ──

function generateNPCTexture(scene: Phaser.Scene) {
  const s = SCALE
  const colors = [0x3498DB, 0xE74C3C, 0x2ECC71, 0xF39C12, 0x9B59B6]

  colors.forEach((col, i) => {
    const g = scene.add.graphics()
    // Head
    rect(g, 3, 0, 6, 6, PAL.npcOutline, s)
    rect(g, 4, 1, 4, 4, PAL.npcSkin, s)
    px(g, 5, 2, PAL.eyePupil, s)
    px(g, 7, 2, PAL.eyePupil, s)
    // Body
    rect(g, 2, 6, 8, 8, PAL.npcOutline, s)
    rect(g, 3, 7, 6, 6, col, s)
    // Legs
    rect(g, 3, 14, 3, 4, PAL.npcOutline, s)
    rect(g, 6, 14, 3, 4, PAL.npcOutline, s)
    g.generateTexture(`npc_${i}`, 12 * s, 18 * s)
    g.destroy()
  })
}

// ── Bosses ──

function generateBossTextures(scene: Phaser.Scene) {
  const s = SCALE

  // Generic boss (20x24) - large menacing figure
  const bossTypes = [
    { key: 'boss_nocurve', bodyColor: PAL.bossRed, headColor: PAL.alarmDark },
    { key: 'boss_recruiter', bodyColor: PAL.buildingDark, headColor: PAL.buildingGray },
    { key: 'boss_skiplevel', bodyColor: PAL.slackPurple, headColor: PAL.bossPurple },
    { key: 'boss_imposter', bodyColor: PAL.outline, headColor: PAL.pantsDark },
    { key: 'boss_mirror', bodyColor: PAL.shirtBlue, headColor: PAL.shirtBlueDark },
    { key: 'boss_goldencage', bodyColor: PAL.handcuffsGold, headColor: PAL.overachieverGold },
    { key: 'boss_algorithm', bodyColor: PAL.linkedInBlue, headColor: PAL.networkCardBlue },
  ]

  for (const bt of bossTypes) {
    const g = scene.add.graphics()
    // Large head (12x10)
    rect(g, 4, 0, 12, 10, PAL.bossOutline, s)
    rect(g, 5, 1, 10, 8, bt.headColor, s)
    // Glowing eyes
    rect(g, 7, 3, 2, 3, PAL.alarmBell, s)
    rect(g, 11, 3, 2, 3, PAL.alarmBell, s)
    px(g, 8, 4, PAL.bossRed, s)
    px(g, 12, 4, PAL.bossRed, s)
    // Mouth
    rect(g, 8, 7, 4, 1, PAL.bossRed, s)
    // Body (16x10)
    rect(g, 2, 10, 16, 10, PAL.bossOutline, s)
    rect(g, 3, 11, 14, 8, bt.bodyColor, s)
    // Arms
    rect(g, 0, 11, 2, 8, PAL.bossOutline, s)
    rect(g, 18, 11, 2, 8, PAL.bossOutline, s)
    // Legs
    rect(g, 4, 20, 4, 4, PAL.bossOutline, s)
    rect(g, 12, 20, 4, 4, PAL.bossOutline, s)
    g.generateTexture(bt.key, 20 * s, 24 * s)
    g.destroy()
  }
}

// ── Background tiles ──

function generateBackgroundTextures(scene: Phaser.Scene) {
  const s = SCALE

  // Cloud (16x8)
  const g = scene.add.graphics()
  rect(g, 2, 2, 12, 5, PAL.cloudWhite, s)
  rect(g, 1, 3, 14, 3, PAL.cloudWhite, s)
  rect(g, 4, 1, 4, 2, PAL.cloudWhite, s)
  rect(g, 9, 0, 3, 3, PAL.cloudWhite, s)
  g.generateTexture('bg_cloud', 16 * s, 8 * s)
  g.destroy()

  // Building silhouette (16x32)
  const g2 = scene.add.graphics()
  rect(g2, 0, 0, 16, 32, PAL.buildingGray, s)
  rect(g2, 0, 0, 16, 1, PAL.buildingLight, s)
  // Windows (3x2 grid)
  for (let wy = 0; wy < 6; wy++) {
    for (let wx = 0; wx < 3; wx++) {
      const lit = (wx + wy) % 3 !== 0
      rect(g2, 2 + wx * 4, 3 + wy * 5, 3, 3, lit ? PAL.windowYellow : PAL.buildingDark, s)
    }
  }
  g2.generateTexture('bg_building', 16 * s, 32 * s)
  g2.destroy()
}
