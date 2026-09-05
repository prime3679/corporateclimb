// ─── CHARACTER SPRITES ──────────────────────────────────────
// WebP character sprites (512px) for all players and NPCs.

import productManager from './assets/characters/npcs/product_manager.webp'
import overachiever from './assets/characters/npcs/overachiever.webp'
import intern from './assets/characters/npcs/intern.webp'
import recruiter from './assets/characters/npcs/recruiter.webp'
import scrum from './assets/characters/npcs/scrum.webp'
import manager from './assets/characters/npcs/manager.webp'
import vp from './assets/characters/npcs/vp.webp'
import boss from './assets/characters/npcs/boss.webp'
import eng from './assets/characters/player/eng.webp'
import design from './assets/characters/player/design.webp'

const SPRITES: Record<string, string> = {
  product_manager: productManager,
  overachiever,
  intern,
  recruiter,
  scrum,
  manager,
  vp,
  boss,
  eng,
  design,
  // Floor 3–5 stand-ins (unique keys, house portraits) until a commission.
  sloane: productManager,
  nico: design,
  quincy: vp,
  harper: recruiter,
  reyes: intern,
  ashford: overachiever,
  marlowe: scrum,
  caldwell: boss,
}

export function buildSpriteUrls(): Record<string, string> {
  return { ...SPRITES }
}

/** Where each portrait's face sits (fractions of the 512px frame) and how far
 *  to zoom so a square crop reads as a headshot. The office renders people
 *  as their badge photo, so the same crop recurs on every party surface. */
export interface HeadshotFocal {
  x: number
  y: number
  zoom: number
}

const DEFAULT_FOCAL: HeadshotFocal = { x: 0.5, y: 0.12, zoom: 3.2 }

const HEADSHOT_FOCALS: Record<string, HeadshotFocal> = {
  product_manager: { x: 0.49, y: 0.115, zoom: 3.2 },
  overachiever: { x: 0.49, y: 0.1, zoom: 3.2 },
  recruiter: { x: 0.45, y: 0.12, zoom: 3.2 },
  scrum: { x: 0.585, y: 0.13, zoom: 3.1 },
  manager: { x: 0.415, y: 0.13, zoom: 3.1 },
  intern: { x: 0.5, y: 0.115, zoom: 3.2 },
  vp: { x: 0.5, y: 0.11, zoom: 3.15 },
  boss: { x: 0.5, y: 0.125, zoom: 3.05 },
  eng: { x: 0.435, y: 0.12, zoom: 3.2 },
  design: { x: 0.49, y: 0.11, zoom: 3.2 },
}

/** Floor 3–5 stand-in keys share the house portrait they alias. */
const HEADSHOT_FOCAL_ALIAS: Record<string, keyof typeof HEADSHOT_FOCALS> = {
  sloane: 'product_manager',
  nico: 'design',
  quincy: 'vp',
  harper: 'recruiter',
  reyes: 'intern',
  ashford: 'overachiever',
  marlowe: 'scrum',
  caldwell: 'boss',
}

export function headshotFocal(spriteId: string): HeadshotFocal {
  const resolved = HEADSHOT_FOCAL_ALIAS[spriteId] ?? spriteId
  return HEADSHOT_FOCALS[resolved] ?? DEFAULT_FOCAL
}
