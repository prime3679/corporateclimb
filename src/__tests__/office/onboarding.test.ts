import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, interactTarget, newOfficeCampaign } from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function afterReceipt() {
  return dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
}

function drain(state: ReturnType<typeof afterReceipt>) {
  let s = state
  for (let i = 0; i < 12 && s.overlay; i++) {
    if (s.overlay.kind === 'receipt') s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    else s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
  }
  return s
}

describe('office first-run coaches', () => {
  it('queues MOVE after the signing bonus, then Renata + PIN on the first step', () => {
    const fresh = newOfficeCampaign(PM)
    expect(fresh.overlay).toMatchObject({ kind: 'receipt', receiptId: 'rcpt_signing_bonus' })
    expect(fresh.overlayQueue).toEqual([{ kind: 'coach', id: 'coach_move' }])

    let s = afterReceipt()
    expect(s.overlay).toMatchObject({ kind: 'coach', id: 'coach_move' })

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'w' }).state
    expect(s.player).toEqual({ x: 11, y: 15, facing: 'w' })
    expect(s.flags).toContain('flag_greeted')
    expect(s.flags).toContain('flag_move_coached')
    expect(s.flags).toContain('flag_pin_coached')
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_renata_callout' })
    expect(s.overlayQueue).toEqual([{ kind: 'coach', id: 'coach_pin' }])

    s = drain(s)
    expect(s.overlay).toBeNull()
    expect(s.flags).toContain('flag_pin_coached')
  })

  it('fires TALK once when Renata is first in front, and E talks through the mark', () => {
    let s = drain(dispatchOfficeAction(afterReceipt(), { type: 'MOVE', dir: 'w' }).state)
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 8, y: 16, facing: 's' } }
    expect(interactTarget(s)).toBeNull()

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(interactTarget(s)?.label).toContain('Renata')
    expect(s.overlay).toMatchObject({ kind: 'coach', id: 'coach_interact' })
    expect(s.flags).toContain('flag_interact_coached')

    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_renata_ticket' })

    s = { ...s, overlay: null, overlayQueue: [], player: { x: 8, y: 16, facing: 'n' } }
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.overlay?.kind === 'coach' && s.overlay.id === 'coach_interact').toBe(false)
  })

  it('fires RIDE once when the elevator doors are first faced', () => {
    let s = drain(dispatchOfficeAction(afterReceipt(), { type: 'MOVE', dir: 'w' }).state)
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 's' } }

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.overlay).toMatchObject({ kind: 'coach', id: 'coach_elevator' })
    expect(s.flags).toContain('flag_elevator_coached')

    s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.overlay).toBeNull()
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'n' }).state
    expect(s.overlay?.kind === 'coach' && s.overlay.id === 'coach_elevator').toBe(false)
  })

  it('does not re-show MOVE after it has been taught', () => {
    let s = afterReceipt()
    s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.flags).toContain('flag_move_coached')
    expect(s.overlay).toBeNull()
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'e' }).state
    expect(s.overlay?.kind === 'coach' && s.overlay.id === 'coach_move').toBe(false)
  })
})

describe('office roster coach flag', () => {
  it('shows TEAM once when Make room opens a full party', () => {
    let s = afterReceipt()
    s = {
      ...s,
      overlay: { kind: 'recruit', coworkerId: 'cw_help_desk_intern' },
      overlayQueue: [],
      party: [
        s.party[0],
        {
          slot: 'party_slot_1',
          def: { kind: 'coworker', id: 'cw_desk_challenger' },
          hp: 70,
          pp: [10, 10, 10, 10],
        },
        {
          slot: 'party_slot_2',
          def: { kind: 'coworker', id: 'cw_meeting_prepper' },
          hp: 60,
          pp: [10, 10, 10, 10],
        },
      ],
      keyItems: { ...s.keyItems, key_offer_letter: 1 },
    }
    s = dispatchOfficeAction(s, { type: 'MAKE_ROOM' }).state
    expect(s.flags).toContain('flag_roster_coached')
    expect(s.overlay).toMatchObject({ kind: 'coach', id: 'coach_roster' })
    expect(s.overlayQueue.some((ov) => ov.kind === 'team' && ov.mode === 'roster')).toBe(true)

    s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.overlay).toMatchObject({ kind: 'team', mode: 'roster' })
    s = dispatchOfficeAction(s, { type: 'CLOSE_TEAM' }).state
    s = dispatchOfficeAction(
      { ...s, overlay: { kind: 'recruit', coworkerId: 'cw_help_desk_intern' } },
      { type: 'MAKE_ROOM' },
    ).state
    expect(s.overlay?.kind === 'coach' && s.overlay.id === 'coach_roster').toBe(false)
    expect(s.overlay).toMatchObject({ kind: 'team', mode: 'roster' })
  })
})
