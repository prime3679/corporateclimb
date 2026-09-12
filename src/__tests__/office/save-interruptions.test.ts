import { beforeEach, describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { type EncounterId, type FloorId } from '@/content/office'
import {
  dispatchOfficeAction,
  loadOffice,
  newOfficeCampaign,
  OFFICE_SAVE_KEY,
  saveOffice,
  startEncounter,
  toOfficeSave,
  recruitCoworker,
  dismissCoworker,
  rejoinCoworker,
  type OfficeState,
} from '@/engine/office'

const bosses: EncounterId[] = [
  'enc_supervisor_1on1',
  'enc_director_review',
  'enc_vp_product',
  'enc_vp_sales',
  'enc_ceo_review',
]
const rng = () => 0.5

function reload(s: OfficeState): OfficeState {
  saveOffice(s)
  const loaded = loadOffice()
  expect(loaded).not.toBeNull()
  return loaded!
}

function win(index: number): OfficeState {
  const fresh = newOfficeCampaign(PLAYER_CLASSES[0])
  let s = startEncounter({ ...fresh, floorId: `floor_0${index + 1}` as FloorId }, bosses[index])
  s = { ...s, run: { ...s.run, atkBuff: 1000 }, battle: { ...s.battle!, enemyHp: 1 } }
  return dispatchOfficeAction(s, { type: 'BATTLE_MOVE', moveIdx: 0 }, rng).state
}

function finishFlow(s: OfficeState, interrupt: boolean): OfficeState {
  for (let step = 0; step < 60; step++) {
    if (interrupt) s = reload(s)
    if (s.screen === 'promotion') {
      s = dispatchOfficeAction(
        s,
        { type: 'PICK_PERK', perkId: s.run.pendingPerkOffer![0] },
        rng,
      ).state
    } else if (s.overlay?.kind === 'receipt' || s.overlay?.kind === 'celebration') {
      s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }, rng).state
    } else if (s.overlay) {
      s = dispatchOfficeAction(s, { type: 'ADVANCE' }, rng).state
    } else return s
  }
  throw new Error('Reward flow did not finish')
}

beforeEach(() => localStorage.clear())

describe('Office survives interruption', () => {
  it.each(['cw_desk_challenger', 'cw_meeting_prepper', 'cw_help_desk_intern'] as const)(
    'preserves %s with its own move count, both active and benched',
    (id) => {
      const fresh = newOfficeCampaign(PLAYER_CLASSES[0])
      const recruited = recruitCoworker({ ...fresh, keyItems: { key_offer_letter: 1 } }, id)
      expect(reload(recruited).party).toEqual(recruited.party)
      const benched = dismissCoworker(recruited, 1)
      expect(reload(benched).bench).toEqual(benched.bench)
      const rejoined = rejoinCoworker(reload(benched), id)
      expect(reload(rejoined).party).toEqual(recruited.party)
    },
  )
  it.each(bosses.map((boss, index) => ({ boss, index })))(
    '$boss: every receipt, perk pick and final dialogue survives reload exactly once',
    ({ index }) => {
      const won = win(index)
      const uninterrupted = finishFlow(won, false)
      const interrupted = finishFlow(won, true)
      expect(interrupted).toEqual({
        ...uninterrupted,
        continuation: { overlays: [], rideTo: null },
      })
      expect(interrupted.rewardsClaimed).toContain(`rwd_promotion_f${index + 1}`)
      expect(interrupted.run.perks).toHaveLength(1)
      expect(reload(interrupted).run.perks).toEqual(interrupted.run.perks)
      if (index === 2) expect(interrupted.keyItems.key_product_badge).toBe(1)
      if (index === 3) expect(interrupted.keyItems.key_client_badge).toBe(1)
      if (index === 4) expect(interrupted.flags).toContain('flag_floor5_complete')
    },
  )

  it.each(bosses.map((boss, index) => ({ boss, index })))(
    'repairs a v2 save stranded after $boss without paying twice',
    ({ index }) => {
      const won = win(index)
      localStorage.setItem(
        OFFICE_SAVE_KEY,
        JSON.stringify({ ...toOfficeSave(won), version: 2, continuation: undefined }),
      )
      const recovered = finishFlow(loadOffice()!, true)
      expect(recovered.run.perks).toHaveLength(1)
      expect(recovered.rewardsClaimed.filter((id) => id === `rwd_${bosses[index]}`)).toHaveLength(1)
      expect(recovered.run.stockOptions).toBe(finishFlow(won, false).run.stockOptions)
      expect(recovered.run.xp).toBe(won.run.xp)
      // A completed save must never reconstruct another promotion.
      localStorage.setItem(
        OFFICE_SAVE_KEY,
        JSON.stringify({ ...toOfficeSave(recovered), version: 2, continuation: undefined }),
      )
      expect(loadOffice()?.overlay).toBeNull()
    },
  )

  it('resumes elevator travel and its arrival celebration once', () => {
    let s = newOfficeCampaign(PLAYER_CLASSES[0])
    s = { ...s, overlay: null, overlayQueue: [], keyItems: { key_access_badge: 1 } }
    s = dispatchOfficeAction(s, { type: 'RIDE_ELEVATOR', to: 'floor_02' }).state
    s = reload(s)
    expect(s.screen).toBe('elevator_ride')
    s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
    s = reload(s)
    expect(s.floorId).toBe('floor_02')
    expect(s.stats.rides).toBe(1)
    expect(s.overlay).toEqual({ kind: 'celebration', screen: 'screen_preview_complete' })
    expect(dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state.stats.rides).toBe(1)
  })

  it('recovers multiple missed legacy promotions without disturbing an existing choice', () => {
    const s = win(4)
    s.encounters.enc_supervisor_1on1 = 'won'
    s.encounters.enc_vp_product = 'won'
    s.run.pendingPerkOffer = ['balanced_package', 'signing_bonus', 'gym_membership']
    s.rewardsClaimed.push('rwd_promotion_f5')
    localStorage.setItem(
      OFFICE_SAVE_KEY,
      JSON.stringify({ ...toOfficeSave(s), version: 2, continuation: undefined }),
    )
    const recovered = finishFlow(loadOffice()!, true)
    expect(recovered.run.perks).toHaveLength(3)
    expect(recovered.rewardsClaimed.filter((id) => id.startsWith('rwd_promotion_'))).toHaveLength(3)
    expect(recovered.keyItems.key_product_badge).toBe(1)
    expect(reload(recovered).overlay).toBeNull()
  })
})
