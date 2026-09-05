import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

function boardAndRide(state: OfficeState): OfficeState {
  let next = {
    ...state,
    overlay: null,
    overlayQueue: [],
    player: { x: 3, y: 2, facing: 'n' as const },
  }
  next = dispatchOfficeAction(next, { type: 'INTERACT' }).state
  expect(next.overlay).toMatchObject({ kind: 'confirm', prompt: 'elevator' })
  next = dispatchOfficeAction(next, { type: 'RIDE_ELEVATOR' }).state
  expect(next.screen).toBe('elevator_ride')
  return dispatchOfficeAction(next, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
}

describe('office multi-floor elevator travel', () => {
  it('keeps Floor 1 elevator gated until the access badge is earned', () => {
    const s = dispatchOfficeAction(start(), { type: 'INTERACT' }).state
    const atDoor = { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 'n' } }
    const blocked = dispatchOfficeAction(atDoor, { type: 'INTERACT' }).state
    expect(blocked.floorId).toBe('floor_01')
    expect(blocked.overlay).toMatchObject({ kind: 'dialogue' })
    expect(blocked.screen).toBe('overworld')
  })

  it('supports riding up to Floor 2 and back down to Floor 1', () => {
    let s = {
      ...start(),
      keyItems: { key_access_badge: 1 },
    }

    s = boardAndRide(s)
    expect(s.floorId).toBe('floor_02')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })

    s = boardAndRide(s)
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
  })

  it('ships a playable Floor 2 stub with an NPC and a take-five activity', () => {
    let s = {
      ...start(),
      keyItems: { key_access_badge: 1 },
    }
    s = boardAndRide(s)
    expect(s.floorId).toBe('floor_02')

    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      player: { x: 8, y: 3, facing: 'n' },
    }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_callie_floor2_intro' })

    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      player: { x: 8, y: 5, facing: 'n' },
    }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'confirm', prompt: 'take_five' })
  })
})
