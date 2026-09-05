import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, interactTarget, newOfficeCampaign } from '@/engine/office'
import { isSolid } from '@/content/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start() {
  const s = newOfficeCampaign(PM)
  return dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
}

describe('office movement', () => {
  it('spawns at (12,15) facing north and walks onto floor tiles', () => {
    let s = start()
    expect(s.player).toEqual({ x: 12, y: 15, facing: 'n' })
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'w' }).state
    expect(s.player).toEqual({ x: 11, y: 15, facing: 'w' })
    expect(s.flags).toContain('flag_greeted')
    expect(s.overlay?.kind).toBe('dialogue')
  })

  it('does not walk through walls; still updates facing', () => {
    let s = start()
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 1, y: 15, facing: 'n' } }
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'w' }).state
    expect(s.player).toEqual({ x: 1, y: 15, facing: 'w' })
    expect(isSolid(0, 15)).toBe(true)
  })

  it('shows a talk prompt only when adjacent and facing Renata', () => {
    let s = start()
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 8, y: 16, facing: 's' } }
    expect(interactTarget(s)).toBeNull()
    s = { ...s, player: { x: 8, y: 16, facing: 'n' } }
    expect(interactTarget(s)?.kind).toBe('npc')
    expect(interactTarget(s)?.label).toContain('Renata')
  })

  it('accepts the printer ticket when talking to Renata', () => {
    let s = start()
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 8, y: 16, facing: 'n' } }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_renata_ticket' })
    while (s.overlay?.kind === 'dialogue') {
      s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    }
    expect(s.assignments.asg_printer).toBe('accepted')
  })
})
