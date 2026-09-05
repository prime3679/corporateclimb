import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import type { Facing } from '@/content/office'
import {
  currentObjective,
  dispatchOfficeAction,
  newOfficeCampaign,
  type OfficeState,
} from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

/** Teleport for tests: clear overlays and stand somewhere, facing a way. */
function at(state: OfficeState, x: number, y: number, facing: Facing): OfficeState {
  return { ...state, overlay: null, overlayQueue: [], player: { x, y, facing } }
}

/** Advance through every queued dialogue line / toast until the overlay is clear. */
function drain(state: OfficeState): OfficeState {
  let s = state
  for (let i = 0; i < 20 && s.overlay; i++) {
    if (s.overlay.kind === 'receipt') s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    else s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
  }
  return s
}

function boardAndRide(state: OfficeState, to?: 'floor_01' | 'floor_02'): OfficeState {
  const dest = to ?? (state.floorId === 'floor_01' ? 'floor_02' : 'floor_01')
  let next = at(state, 3, 2, 'n')
  next = dispatchOfficeAction(next, { type: 'INTERACT' }).state
  expect(next.overlay).toMatchObject({ kind: 'elevator_panel' })
  next = dispatchOfficeAction(next, { type: 'RIDE_ELEVATOR', to: dest }).state
  expect(next.screen).toBe('elevator_ride')
  return dispatchOfficeAction(next, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
}

function badged(): OfficeState {
  const s = start()
  return { ...s, keyItems: { ...s.keyItems, key_access_badge: 1 } }
}

/** Ride up, take the first step (Teddy's callout), and clear it. */
function arriveFloor2(): OfficeState {
  const s = drain(boardAndRide(badged()))
  return drain(dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state)
}

describe('office multi-floor elevator travel', () => {
  it('keeps Floor 1 elevator gated until the access badge is earned', () => {
    const blocked = dispatchOfficeAction(at(start(), 3, 2, 'n'), { type: 'INTERACT' }).state
    expect(blocked.floorId).toBe('floor_01')
    expect(blocked.overlay).toMatchObject({ kind: 'dialogue' })
    expect(blocked.screen).toBe('overworld')
  })

  it('supports riding up to Floor 2 and back down to Floor 1, arriving at the same shaft tile', () => {
    let s = boardAndRide(badged())
    expect(s.floorId).toBe('floor_02')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })

    s = boardAndRide(s)
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
  })
})

describe('Floor 2 — Operations (docs/rpg/floor-2-design.md)', () => {
  it("greets with Teddy's callout on the first step and pins him as the objective", () => {
    let s = drain(boardAndRide(badged()))
    expect(currentObjective(s)).toMatchObject({ text: 'Talk to Teddy', zone: 'zone_it' })

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.player).toEqual({ x: 3, y: 3, facing: 's' })
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_callout' })
    expect(s.flags).toContain('flag_visited_f2')

    // Fires once per save.
    s = drain(s)
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.overlay).toBeNull()
  })

  it('runs the transfer packet: Teddy → booth → Holloway downstairs → tray → Teddy', () => {
    let s = arriveFloor2()
    const wallet = s.run.stockOptions

    // Teddy issues the packet.
    s = dispatchOfficeAction(at(s, 8, 3, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_packet' })
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('accepted')
    expect(currentObjective(s)).toMatchObject({ text: 'Take a badge photo', pin: { x: 12, y: 1 } })
    // Re-talk is a hint, not a re-issue.
    s = dispatchOfficeAction(at(s, 9, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_hint_photo' })
    s = drain(s)

    // The booth fires on two.
    s = dispatchOfficeAction(at(s, 12, 2, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('photo_taken')
    expect(s.keyItems.key_badge_photo).toBe(1)
    expect(currentObjective(s)).toMatchObject({
      text: "Get Holloway's signature (Floor 1)",
      zone: 'zone_landing',
      pin: { x: 3, y: 1 },
    })
    // The tray will not take a half packet.
    s = dispatchOfficeAction(at(s, 18, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue' })
    expect(s.assignments.asg_transfer).toBe('photo_taken')
    s = drain(s)

    // Down to Floor 1: Holloway signs, once.
    s = boardAndRide(s)
    expect(s.floorId).toBe('floor_01')
    expect(currentObjective(s)).toMatchObject({
      text: "Get Holloway's signature",
      pin: { x: 6, y: 3 },
    })
    s = dispatchOfficeAction(at(drain(s), 6, 2, 's'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_holloway_sign_transfer' })
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('signed')
    expect(s.keyItems.key_transfer_form).toBe(1)
    expect(currentObjective(s)).toMatchObject({
      text: 'File the packet at People Ops (Floor 2)',
      pin: { x: 3, y: 1 },
    })
    s = dispatchOfficeAction(at(s, 6, 2, 's'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_holloway_upstairs' })
    s = drain(s)
    expect(s.keyItems.key_transfer_form).toBe(1)

    // Back up: the tray files it, pays +12 and one Offer Letter, exactly once.
    s = drain(boardAndRide(s))
    expect(currentObjective(s)).toMatchObject({
      text: 'File the packet at People Ops',
      zone: 'zone_people',
    })
    s = dispatchOfficeAction(at(s, 18, 4, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('filed')
    expect(s.keyItems.key_badge_photo).toBeUndefined()
    expect(s.keyItems.key_transfer_form).toBeUndefined()
    expect(s.keyItems.key_offer_letter).toBe(1)
    expect(s.run.stockOptions).toBe(wallet + 12)
    expect(s.rewardsClaimed).toContain('rwd_asg_transfer')
    s = drain(dispatchOfficeAction(at(s, 18, 4, 'n'), { type: 'INTERACT' }).state)
    expect(s.run.stockOptions).toBe(wallet + 12)
    expect(currentObjective(s)).toMatchObject({ text: 'Report back to Teddy', pin: { x: 9, y: 3 } })

    // Teddy's sightline catches you at the hall door with the compliance line.
    s = at(s, 9, 7, 'n')
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.player).toEqual({ x: 9, y: 6, facing: 'n' })
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_filed' })
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('complete')
    // Kessler knows compliance is still open.
    s = dispatchOfficeAction(at(s, 3, 12, 's'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_kessler_teddy_pending' })
  })

  it('has a working landing, Facilities and Finance before any of that', () => {
    let s = arriveFloor2()

    s = dispatchOfficeAction(at(s, 3, 4, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'document', docId: 'directory' })

    s = dispatchOfficeAction(at(s, 11, 11, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'confirm', prompt: 'take_five' })

    s = dispatchOfficeAction(at(s, 13, 12, 'e'), { type: 'INTERACT' }).state
    expect(s.screen).toBe('vending')
    s = { ...s, screen: 'overworld' }

    s = dispatchOfficeAction(at(s, 3, 12, 's'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_kessler_early' })

    // Whitlock's sightline reaches the Finance doorway.
    s = at(drain(s), 19, 8, 's')
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.player).toEqual({ x: 19, y: 9, facing: 's' })
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_whitlock_hook' })

    // Solid props block: the booth at (12,1) stops a walk up column 12.
    s = at(drain(s), 12, 3, 'n')
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.player).toEqual({ x: 12, y: 2, facing: 'n' })
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.player).toEqual({ x: 12, y: 2, facing: 'n' })
  })

  it('leaves the Floor 1 objective pointing at the elevator once Floor 2 is open', () => {
    const s = boardAndRide(boardAndRide(badged()))
    expect(s.floorId).toBe('floor_01')
    expect(currentObjective(s)).toMatchObject({
      text: 'Take the elevator to Floor 2',
      zone: 'zone_elevator',
      pin: { x: 3, y: 1 },
    })
  })
})
