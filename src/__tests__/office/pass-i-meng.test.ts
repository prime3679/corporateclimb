import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DIALOGUE,
  FLOOR_IDS,
  FLOOR_NPC_TILE,
  OFFICE_ENCOUNTERS,
  SPEAKER_SPRITE,
  type NpcId,
} from '@/content/office'
import { DEFAULT_HEADSHOT_FOCAL, buildSpriteUrls, headshotFocal } from '@/sprites'
import { NPC_CAST } from '@/screens/office/cast'
import {
  ACTOR_IDS,
  NPC_ACTOR,
  actorIdForSprite,
  actorSheetUrl,
} from '@/screens/office/OverworldActor'
import {
  OFFICE_CAST_HEADSHOTS,
  OFFICE_CAST_SPEAKER_COUNT,
  PRESENTATION_SIGNOFF,
  officeCastSpriteIds,
} from '@/screens/office/presentation'

const repo = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8')

/** Office F1–2 house plates (Pass J recast — Office-only pixels). */
const HOUSE_FILES: Record<string, string> = {
  renata: 'src/assets/characters/npcs/renata.webp',
  gavin: 'src/assets/characters/npcs/gavin.webp',
  priya: 'src/assets/characters/npcs/priya.webp',
  holloway: 'src/assets/characters/npcs/holloway.webp',
  teddy: 'src/assets/characters/npcs/teddy.webp',
  whitlock: 'src/assets/characters/npcs/whitlock.webp',
  kessler: 'src/assets/characters/npcs/kessler.webp',
}

/** Classic enemy plates the house speakers used to borrow. Classic still
 *  renders these; Office must not key a speaker onto them any more. */
const CLASSIC_FILES: Record<string, string> = {
  recruiter: 'src/assets/characters/npcs/recruiter.webp',
  overachiever: 'src/assets/characters/npcs/overachiever.webp',
  scrum: 'src/assets/characters/npcs/scrum.webp',
  manager: 'src/assets/characters/npcs/manager.webp',
  intern: 'src/assets/characters/npcs/intern.webp',
  boss: 'src/assets/characters/npcs/boss.webp',
  vp: 'src/assets/characters/npcs/vp.webp',
}

const NAMED_FILES: Record<string, string> = {
  sloane: 'src/assets/characters/npcs/sloane.webp',
  nico: 'src/assets/characters/npcs/nico.webp',
  quincy: 'src/assets/characters/npcs/quincy.webp',
  harper: 'src/assets/characters/npcs/harper.webp',
  reyes: 'src/assets/characters/npcs/reyes.webp',
  ashford: 'src/assets/characters/npcs/ashford.webp',
  marlowe: 'src/assets/characters/npcs/marlowe.webp',
  caldwell: 'src/assets/characters/npcs/caldwell.webp',
}

function sha256(rel: string): string {
  return createHash('sha256')
    .update(readFileSync(join(process.cwd(), rel)))
    .digest('hex')
}

describe('Pass I — Office cast Headshots are already unique', () => {
  it('keeps the 15-speaker roster and no extra ambient NPC', () => {
    expect(OFFICE_CAST_SPEAKER_COUNT).toBe(15)
    expect(Object.keys(SPEAKER_SPRITE)).toHaveLength(15)
    expect(Object.keys(NPC_CAST)).toHaveLength(15)
    expect(Object.keys(NPC_ACTOR)).toHaveLength(15)
    expect(SPEAKER_SPRITE).toEqual({
      ...OFFICE_CAST_HEADSHOTS.house,
      ...OFFICE_CAST_HEADSHOTS.named,
    })

    const placed = FLOOR_IDS.flatMap((floor) => Object.keys(FLOOR_NPC_TILE[floor]))
    expect(placed).toHaveLength(15)
    expect(new Set(placed).size).toBe(15)
  })

  it('gives every speaker a committed unique plate on the Headshot contract', () => {
    const urls = buildSpriteUrls()
    const missing = headshotFocal('no-such-sprite')
    expect(missing).toEqual(DEFAULT_HEADSHOT_FOCAL)

    const seenUrls = new Set<string>()
    const seenFiles = new Set<string>()
    for (const [speaker, spriteId] of Object.entries(SPEAKER_SPRITE)) {
      expect(urls[spriteId], speaker).toBeTruthy()
      expect(seenUrls.has(urls[spriteId]), `${speaker} shares a url`).toBe(false)
      seenUrls.add(urls[spriteId])

      expect(headshotFocal(spriteId), speaker).not.toEqual(missing)

      const file = HOUSE_FILES[spriteId] ?? NAMED_FILES[spriteId]
      expect(file, speaker).toBeTruthy()
      const hash = sha256(file)
      expect(seenFiles.has(hash), `${speaker} shares pixels`).toBe(false)
      seenFiles.add(hash)
    }
    expect(seenUrls.size).toBe(15)
    expect(seenFiles.size).toBe(15)
  })

  it('does not alias F3–5 named plates back onto house art', () => {
    const urls = buildSpriteUrls()
    const house = Object.values(OFFICE_CAST_HEADSHOTS.house)
    for (const [speaker, spriteId] of Object.entries(OFFICE_CAST_HEADSHOTS.named)) {
      expect(spriteId).toBe(speaker)
      expect(house).not.toContain(spriteId)
      for (const other of house) {
        expect(urls[spriteId], `${speaker} vs ${other}`).not.toEqual(urls[other])
        expect(sha256(NAMED_FILES[spriteId]), `${speaker} vs ${other}`).not.toEqual(
          sha256(HOUSE_FILES[other]),
        )
      }
    }
    expect(urls.reyes).not.toEqual(urls.teddy)
    expect(urls.quincy).not.toEqual(urls.kessler)
    expect(urls.caldwell).not.toEqual(urls.whitlock)
    expect(urls.sloane).not.toEqual(urls.product_manager)
    expect(urls.harper).not.toEqual(urls.renata)
  })

  it('keys every F1–2 house speaker onto its own Office plate, not a Classic file', () => {
    const urls = buildSpriteUrls()
    const ids = Object.values(OFFICE_CAST_HEADSHOTS.house)
    expect(new Set(ids).size).toBe(ids.length)
    const hashes = ids.map((id) => sha256(HOUSE_FILES[id]))
    expect(new Set(hashes).size).toBe(ids.length)
    for (const [speaker, spriteId] of Object.entries(OFFICE_CAST_HEADSHOTS.house)) {
      expect(spriteId).toBe(speaker)
      expect(CLASSIC_FILES[spriteId], `${speaker} keys a Classic plate`).toBeUndefined()
      for (const [classicId, file] of Object.entries(CLASSIC_FILES)) {
        expect(urls[spriteId], `${speaker} vs ${classicId}`).not.toEqual(urls[classicId])
        expect(sha256(HOUSE_FILES[spriteId]), `${speaker} vs ${classicId}`).not.toEqual(
          sha256(file),
        )
      }
    }
  })

  it('wires encounter kits and map actors to those same plates', () => {
    expect(OFFICE_ENCOUNTERS.enc_desk_challenger.spriteId).toBe(SPEAKER_SPRITE.gavin)
    expect(OFFICE_ENCOUNTERS.enc_meeting_prepper.spriteId).toBe(SPEAKER_SPRITE.priya)
    expect(OFFICE_ENCOUNTERS.enc_supervisor_1on1.spriteId).toBe(SPEAKER_SPRITE.holloway)
    expect(OFFICE_ENCOUNTERS.enc_help_desk_intern.spriteId).toBe(SPEAKER_SPRITE.teddy)
    expect(OFFICE_ENCOUNTERS.enc_auditor.spriteId).toBe(SPEAKER_SPRITE.whitlock)
    expect(OFFICE_ENCOUNTERS.enc_director_review.spriteId).toBe(SPEAKER_SPRITE.kessler)
    expect(OFFICE_ENCOUNTERS.enc_vp_product.spriteId).toBe(SPEAKER_SPRITE.quincy)
    expect(OFFICE_ENCOUNTERS.enc_vp_sales.spriteId).toBe(SPEAKER_SPRITE.ashford)
    expect(OFFICE_ENCOUNTERS.enc_ceo_review.spriteId).toBe(SPEAKER_SPRITE.caldwell)

    for (const npc of Object.keys(NPC_CAST) as NpcId[]) {
      const actor = NPC_ACTOR[npc]
      expect(ACTOR_IDS, npc).toContain(actor)
      expect(actorIdForSprite(NPC_CAST[npc].spriteId), npc).toBe(actor)
      const rel = actorSheetUrl(actor).replace(/^\//, '')
      expect(readFileSync(join(process.cwd(), 'public', rel)).subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      )
    }
  })

  it('leaves inspect / callout / side POIs without a generic Headshot', () => {
    // First-step shouts (cast.ts ACROSS_THE_ROOM) carry no Headshot.
    // Gavin's sightline callout is face-to-face and uses his unique plate.
    const acrossRoom = [
      'dlg_renata_callout',
      'dlg_teddy_callout',
      'dlg_sloane_callout',
      'dlg_harper_callout',
      'dlg_marlowe_callout',
    ] as const
    for (const id of acrossRoom) {
      expect(DIALOGUE[id].speaker, id).toBeNull()
    }
    expect(DIALOGUE.dlg_gavin_callout.speaker).toBe('gavin')
    for (const node of Object.values(DIALOGUE)) {
      if (node.speaker) {
        expect(SPEAKER_SPRITE[node.speaker], node.id).toBeTruthy()
      }
    }
    const overlays = repo('src/screens/office/overlays.tsx')
    expect(overlays).toContain('cast && !cast.acrossRoom')
    expect(overlays).toMatch(/acrossRoom \|\| inspect/)
    const side = repo('src/content/office/sidePois.ts')
    expect(side).not.toMatch(/spriteId|Headshot/)
    expect(side).toContain('Pass D optional side POIs')
  })

  it('does not invent a second portrait catalog or leftover npc plates', () => {
    const npcDir = join(process.cwd(), 'src/assets/characters/npcs')
    const webps = readdirSync(npcDir).filter((name) => name.endsWith('.webp'))
    const expected = new Set([
      ...Object.keys(HOUSE_FILES).map((id) => `${id}.webp`),
      ...Object.keys(NAMED_FILES).map((id) => `${id}.webp`),
      ...Object.keys(CLASSIC_FILES).map((id) => `${id}.webp`),
      'product_manager.webp',
    ])
    expect(new Set(webps)).toEqual(expected)
    expect(officeCastSpriteIds()).not.toContain('product_manager')
    expect(PRESENTATION_SIGNOFF.section19.some((row) => row.includes('Pass I ambient'))).toBe(true)
  })
})
