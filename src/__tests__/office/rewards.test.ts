import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'
import { FLOOR_LEDGER_MAX, ledgerOptionsEarned } from '@/content/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function afterReceipt(s: OfficeState) {
  return dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
}

describe('office rewards once-only', () => {
  it('claims the start float once on a new campaign', () => {
    const a = newOfficeCampaign(PM)
    const b = newOfficeCampaign(PM)
    expect(a.rewardsClaimed).toEqual(['rwd_start_options'])
    expect(a.run.stockOptions).toBe(10)
    expect(ledgerOptionsEarned(a.rewardsClaimed)).toBe(10)
    expect(ledgerOptionsEarned(b.rewardsClaimed)).toBe(10)
  })

  it('pays the printer ticket exactly once', () => {
    let s = afterReceipt(newOfficeCampaign(PM))
    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      assignments: { ...s.assignments, asg_printer: 'installed' },
      player: { x: 8, y: 16, facing: 'n' },
    }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    while (s.overlay?.kind === 'dialogue') s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.rewardsClaimed).toContain('rwd_asg_printer')
    expect(s.run.stockOptions).toBe(20)
    expect(s.assignments.asg_printer).toBe('complete')
    expect(s.overlay).toMatchObject({ kind: 'receipt', receiptId: 'rcpt_ticket_closed' })
    s = afterReceipt(s)
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 8, y: 16, facing: 'n' } }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    while (s.overlay?.kind === 'dialogue') s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.rewardsClaimed.filter((id) => id === 'rwd_asg_printer')).toHaveLength(1)
    expect(s.run.stockOptions).toBe(20)
  })

  it('installs toner once and prints two offer letters', () => {
    let s = afterReceipt(newOfficeCampaign(PM))
    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      assignments: { ...s.assignments, asg_printer: 'toner_collected' },
      keyItems: { key_toner: 1 },
      player: { x: 9, y: 8, facing: 'n' },
    }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    while (s.overlay && s.overlay.kind !== 'receipt') {
      s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    }
    expect(s.keyItems.key_offer_letter).toBe(2)
    expect(s.keyItems.key_toner).toBeUndefined()
    expect(s.assignments.asg_printer).toBe('installed')
    s = afterReceipt(s)
    s = { ...s, overlay: null, overlayQueue: [], player: { x: 9, y: 8, facing: 'n' } }
    s = dispatchOfficeAction(s, { type: 'INTERACT' }).state
    expect(s.keyItems.key_offer_letter).toBe(2)
  })

  it('shows Signing Bonus perk +60 as a separate non-ledger receipt', () => {
    let s = afterReceipt(newOfficeCampaign(PM))
    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      screen: 'promotion',
      run: { ...s.run, pendingPerkOffer: ['signing_bonus', 'gym_membership', 'negotiator'] },
    }
    s = dispatchOfficeAction(s, { type: 'PICK_PERK', perkId: 'signing_bonus' }).state
    expect(s.run.stockOptions).toBe(70)
    expect(s.run.perks).toContain('signing_bonus')
    expect(s.rewardsClaimed.includes('rwd_start_options')).toBe(true)
    expect(s.rewardsClaimed.some((id) => id.includes('signing'))).toBe(false)
    expect(s.overlay).toMatchObject({ kind: 'receipt', receiptId: 'rcpt_promotion_signing_bonus' })
    expect(ledgerOptionsEarned(s.rewardsClaimed)).toBe(10)
  })

  it('counts only rwd_* rows toward the floor ledger max of 65', () => {
    const claimed = [
      'rwd_start_options',
      'rwd_asg_printer',
      'rwd_enc_desk_challenger',
      'rwd_asg_meeting_prep',
      'rwd_enc_meeting_prepper',
      'rwd_enc_supervisor_1on1',
      'rwd_promotion_f1',
    ]
    expect(ledgerOptionsEarned(claimed)).toBe(FLOOR_LEDGER_MAX)
    expect(ledgerOptionsEarned([...claimed, 'rcpt_promotion_signing_bonus'])).toBe(65)
  })
})
