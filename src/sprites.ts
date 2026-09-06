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
import sloane from './assets/characters/npcs/sloane.webp'
import nico from './assets/characters/npcs/nico.webp'
import quincy from './assets/characters/npcs/quincy.webp'
import harper from './assets/characters/npcs/harper.webp'
import reyes from './assets/characters/npcs/reyes.webp'
import ashford from './assets/characters/npcs/ashford.webp'
import marlowe from './assets/characters/npcs/marlowe.webp'
import caldwell from './assets/characters/npcs/caldwell.webp'

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
  sloane,
  nico,
  quincy,
  harper,
  reyes,
  ashford,
  marlowe,
  caldwell,
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
  sloane: { x: 0.47, y: 0.12, zoom: 3.2 },
  nico: { x: 0.5, y: 0.12, zoom: 3.15 },
  quincy: { x: 0.48, y: 0.115, zoom: 3.15 },
  harper: { x: 0.48, y: 0.12, zoom: 3.15 },
  reyes: { x: 0.495, y: 0.118, zoom: 3.18 },
  ashford: { x: 0.51, y: 0.115, zoom: 3.15 },
  marlowe: { x: 0.53, y: 0.12, zoom: 3.2 },
  caldwell: { x: 0.51, y: 0.12, zoom: 3.1 },
}

export function headshotFocal(spriteId: string): HeadshotFocal {
  return HEADSHOT_FOCALS[spriteId] ?? DEFAULT_FOCAL
}
