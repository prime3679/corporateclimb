import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function readyToOffer(coworker: 'cw_desk_challenger' | 'cw_meeting_prepper'): OfficeState {
  const s = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return {
    ...s,
    overlay: { kind: 'recruit', coworkerId: coworker },
    overlayQueue: [],
    assignments: { ...s.assignments, asg_printer: 'complete' },
    encounters: {
      ...s.encounters,
      enc_desk_challenger: 'won',
      enc_meeting_prepper: coworker === 'cw_meeting_prepper' ? 'won' : 'open',
    },
    keyItems: { key_offer_letter: 2 },
  }
}

describe('office recruit', () => {
  it('extends an offer: consumes one letter and fills the next slot', () => {
    let s = readyToOffer('cw_desk_challenger')
    s = dispatchOfficeAction(s, { type: 'EXTEND_OFFER' }).state
    expect(s.party).toHaveLength(2)
    expect(s.party[1].def).toEqual({ kind: 'coworker', id: 'cw_desk_challenger' })
    expect(s.party[1].hp).toBe(70)
    expect(s.keyItems.key_offer_letter).toBe(1)
    expect(s.run.stockOptions).toBe(10)
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_gavin_joined' })
  })

  it('declining keeps the letter and re-offers on talk', () => {
    let s = readyToOffer('cw_desk_challenger')
    s = dispatchOfficeAction(s, { type: 'DECLINE_OFFER' }).state
    expect(s.party).toHaveLength(1)
    expect(s.keyItems.key_offer_letter).toBe(2)
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 5, y: 10, facing: 'e' } }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_gavin_offer' })
  })

  it('cannot recruit a third coworker once the party is full', () => {
    let s = readyToOffer('cw_desk_challenger')
    s = dispatchOfficeAction(s, { type: 'EXTEND_OFFER' }).state
    s = {
      ...s,
      overlay: { kind: 'recruit', coworkerId: 'cw_meeting_prepper' },
      overlayQueue: [],
      encounters: { ...s.encounters, enc_meeting_prepper: 'won' },
    }
    s = dispatchOfficeAction(s, { type: 'EXTEND_OFFER' }).state
    expect(s.party).toHaveLength(3)
    expect(s.keyItems.key_offer_letter).toBeUndefined()
    const again = dispatchOfficeAction(
      { ...s, overlay: { kind: 'recruit', coworkerId: 'cw_desk_challenger' }, overlayQueue: [] },
      { type: 'EXTEND_OFFER' },
    ).state
    expect(again.party).toHaveLength(3)
  })
})
