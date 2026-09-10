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
// Office Floor 1–2 house plates (Pass J recast). Classic keeps its own
// recruiter / overachiever / … files above; these are Office-only pixels.
import renata from './assets/characters/npcs/renata.webp'
import gavin from './assets/characters/npcs/gavin.webp'
import priya from './assets/characters/npcs/priya.webp'
import holloway from './assets/characters/npcs/holloway.webp'
import teddy from './assets/characters/npcs/teddy.webp'
import whitlock from './assets/characters/npcs/whitlock.webp'
import kessler from './assets/characters/npcs/kessler.webp'

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
  renata,
  gavin,
  priya,
  holloway,
  teddy,
  whitlock,
  kessler,
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

export const DEFAULT_HEADSHOT_FOCAL: HeadshotFocal = { x: 0.5, y: 0.12, zoom: 3.2 }

/** Pixel placement for a `size`×`size` Headshot frame. Shared by the
 *  component and tests so a crop tweak cannot drift from the contract. */
export function headshotPlacement(size: number, focal: HeadshotFocal) {
  const img = size * focal.zoom
  return {
    width: img,
    height: img,
    left: size / 2 - focal.x * img,
    top: size / 2 - focal.y * img,
  }
}

const HEADSHOT_FOCALS: Record<string, HeadshotFocal> = {
  product_manager: { x: 0.49, y: 0.115, zoom: 3.2 },
  // Classic enemy plates. Office no longer badges these (see the house
  // block below); they still crop for Classic-side surfaces.
  overachiever: { x: 0.49, y: 0.1, zoom: 3.2 },
  recruiter: { x: 0.47, y: 0.12, zoom: 3.2 },
  scrum: { x: 0.585, y: 0.13, zoom: 3.1 },
  manager: { x: 0.415, y: 0.13, zoom: 3.1 },
  intern: { x: 0.5, y: 0.115, zoom: 3.2 },
  vp: { x: 0.685, y: 0.105, zoom: 3.25 },
  boss: { x: 0.5, y: 0.125, zoom: 3.05 },
  eng: { x: 0.435, y: 0.12, zoom: 3.2 },
  design: { x: 0.49, y: 0.11, zoom: 3.2 },
  // Sloane's 512 has more headroom than the house PM plate, so the house
  // y=0.12 pin sat the face a hair high in the badge. Drop the pin toward
  // the hairline and zoom a hair tighter so the crop matches the house
  // Headshot contract (eyes in the upper third, not the top rim).
  sloane: { x: 0.48, y: 0.105, zoom: 3.38 },
  nico: { x: 0.5, y: 0.12, zoom: 3.15 },
  quincy: { x: 0.48, y: 0.115, zoom: 3.15 },
  harper: { x: 0.48, y: 0.12, zoom: 3.15 },
  reyes: { x: 0.495, y: 0.118, zoom: 3.18 },
  ashford: { x: 0.51, y: 0.115, zoom: 3.15 },
  marlowe: { x: 0.53, y: 0.12, zoom: 3.2 },
  caldwell: { x: 0.51, y: 0.12, zoom: 3.1 },
  // Office F1–2 house plates (Pass J recast + pose-energy pass). Every
  // figure stands centred on its plate, so x sits near 0.5 — the pose pass
  // shifts a few heads off the plate centre line (Teddy leans in from the
  // left, Renata cocks her hip to the right), so x follows the head, not
  // the figure. y pins the eye line into the upper third of the badge and
  // zoom stays in the 3.1–3.4 band the F3–5 named plates use. Renata's wavy
  // hair is the widest head of the seven — she takes the loosest zoom; the
  // three slick-haired men take the tightest. Props are held below the
  // shoulder line on every plate, so no prop reaches the badge rim.
  renata: { x: 0.49, y: 0.14, zoom: 3.15 },
  gavin: { x: 0.485, y: 0.114, zoom: 3.35 },
  priya: { x: 0.505, y: 0.14, zoom: 3.3 },
  holloway: { x: 0.5, y: 0.122, zoom: 3.3 },
  teddy: { x: 0.47, y: 0.13, zoom: 3.2 },
  whitlock: { x: 0.49, y: 0.11, zoom: 3.35 },
  kessler: { x: 0.495, y: 0.118, zoom: 3.35 },
}

export function headshotFocal(spriteId: string): HeadshotFocal {
  return HEADSHOT_FOCALS[spriteId] ?? DEFAULT_HEADSHOT_FOCAL
}
