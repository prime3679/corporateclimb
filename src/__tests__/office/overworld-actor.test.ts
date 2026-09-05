import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { SPEAKER_SPRITE, type NpcId } from '@/content/office'
import {
  ACTOR_IDS,
  NPC_ACTOR,
  actorIdForSprite,
  actorSheetUrl,
  leadActorId,
} from '@/screens/office/OverworldActor'

const NPC_IDS: NpcId[] = [
  'npc_receptionist',
  'npc_desk_challenger',
  'npc_meeting_prepper',
  'npc_supervisor',
]

function pngSize(buf: Buffer) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), colorType: buf[25] }
}

describe('overworld actor sheets', () => {
  it('maps every lead class and floor NPC onto a committed sheet', () => {
    for (const cls of PLAYER_CLASSES) {
      const id = leadActorId(cls.id)
      expect(ACTOR_IDS).toContain(id)
      expect(actorIdForSprite(cls.spriteId)).toBe(id)
    }
    for (const npc of NPC_IDS) {
      const speaker = Object.entries(SPEAKER_SPRITE).find(
        ([, sprite]) => actorIdForSprite(sprite) === NPC_ACTOR[npc],
      )
      expect(speaker, npc).toBeTruthy()
      expect(ACTOR_IDS).toContain(NPC_ACTOR[npc])
    }
  })

  it('ships 128×160 RGBA sheets for every actor id', () => {
    for (const id of ACTOR_IDS) {
      const rel = actorSheetUrl(id).replace(/^\//, '')
      const buf = readFileSync(resolve(process.cwd(), 'public', rel))
      expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
      const { w, h, colorType } = pngSize(buf)
      expect(w, id).toBe(128)
      expect(h, id).toBe(160)
      expect(colorType, `${id} color type`).toBe(6)
    }
  })
})
