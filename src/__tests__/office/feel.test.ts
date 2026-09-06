import { describe, expect, it } from 'vitest'
import {
  DIALOGUE,
  ELEVATOR_RIDE,
  elevatorRidePlan,
  elevatorRideTicks,
  elevatorRideTotalMs,
  hudFloorEyebrow,
  officeBattleLabels,
  officeBattleRoom,
  OFFICE_FLOOR_COUNT,
} from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import {
  celebrationKicker,
  celebrationLive,
  currentObjective,
  destChip,
  dispatchOfficeAction,
  newOfficeCampaign,
  officeBattleOutcome,
  officeVictoryStinger,
  startEncounter,
  type OfficeState,
} from '@/engine/office'
import { COACH_COPY } from '@/screens/office/overlays'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

describe('Pass C feel — HUD / copy', () => {
  it('keeps the objective eyebrow as Floor N · of 5 on every floor', () => {
    expect(OFFICE_FLOOR_COUNT).toBe(5)
    expect(hudFloorEyebrow('floor_01')).toBe('Floor 1 · of 5')
    expect(hudFloorEyebrow('floor_03')).toBe('Floor 3 · of 5')
    expect(hudFloorEyebrow('floor_05')).toBe('Floor 5 · of 5')
  })

  it('pins Talk to Renata from spawn so the PIN coach matches the banner', () => {
    const fresh = newOfficeCampaign(PM)
    expect(currentObjective(fresh)).toMatchObject({
      text: 'Talk to Renata',
      zone: 'zone_reception',
      pin: { x: 8, y: 14 },
    })
    expect(destChip(fresh).label).toBe('→ RECEPTION')
  })

  it('teaches the gold chip as the next stop, not a desk', () => {
    expect(COACH_COPY.coach_pin.rest).toContain('next stop')
    expect(COACH_COPY.coach_pin.rest).not.toContain('desk')
  })

  it('drops Renata’s one-floor “whole world” line', () => {
    const line = DIALOGUE.dlg_renata_ticket.lines.join(' ')
    expect(line).toContain('Five floors. You start at the bottom.')
    expect(line).not.toMatch(/whole world for now/i)
  })

  it('announces celebrations by title and department kicker', () => {
    const s = start()
    expect(celebrationLive(s, 'screen_preview_complete')).toMatch(/^FLOOR 1 CLEARED\./)
    expect(celebrationLive(s, 'screen_floor5_complete')).toMatch(/^THE CLIMB\./)
    expect(celebrationLive(s, 'screen_floor2_complete')).not.toContain('screen_')
    expect(celebrationKicker('screen_preview_complete')).toBe('YOUR TEAM · CLEARED')
    expect(celebrationKicker('screen_floor3_complete')).toBe('PRODUCT · CLEARED')
    expect(celebrationKicker('screen_floor5_complete')).toBe('EXEC · THE BUILDING')
  })
})

describe('Pass C feel — review chamber', () => {
  it('gives Office fights department rooms and review chrome, not Classic dossiers', () => {
    expect(officeBattleRoom('floor_01').act).toBe(1)
    expect(officeBattleRoom('floor_03').act).toBe(2)
    expect(officeBattleRoom('floor_05').act).toBe(3)
    expect(officeBattleRoom('floor_05').palette.accent).toBe('#D4AF37')
    expect(officeBattleLabels('enc_desk_challenger')).toEqual({
      enemyKicker: 'SPAR',
      playerKicker: 'YOUR TEAM',
      intent: 'INTENT: PROVE IT',
    })
    expect(officeBattleLabels('enc_ceo_review').intent).toBe('INTENT: THE NOD')
    expect(officeBattleLabels('enc_supervisor_1on1').enemyKicker).toBe('REVIEW')
    expect(officeBattleLabels('enc_auditor').enemyKicker).toBe('AUDIT')
  })
})

describe('Pass C feel — cab ride', () => {
  it('plans a 1→5 ride with floor ticks after the doors close', () => {
    const plan = elevatorRidePlan('floor_01', 'floor_05')
    expect(plan).toMatchObject({ fromNumber: 1, toNumber: 5, destName: 'EXEC', up: true, steps: 4 })
    const ticks = elevatorRideTicks('floor_01', 'floor_05')
    expect(ticks.map((t) => t.floor)).toEqual([2, 3, 4, 5])
    const doorsShut = ELEVATOR_RIDE.openMs + ELEVATOR_RIDE.closeMs
    expect(ticks[0]?.at).toBeGreaterThanOrEqual(doorsShut)
    expect(ticks[ticks.length - 1]?.at).toBeLessThanOrEqual(
      doorsShut + ELEVATOR_RIDE.travelMs + ELEVATOR_RIDE.arriveMs,
    )
    expect(elevatorRideTotalMs()).toBe(
      ELEVATOR_RIDE.openMs +
        ELEVATOR_RIDE.closeMs +
        ELEVATOR_RIDE.travelMs +
        ELEVATOR_RIDE.arriveMs +
        ELEVATOR_RIDE.fadeMs,
    )
  })

  it('ticks downward 5→1 and names YOUR TEAM', () => {
    const plan = elevatorRidePlan('floor_05', 'floor_01')
    expect(plan.up).toBe(false)
    expect(plan.destName).toBe('YOUR TEAM')
    expect(elevatorRideTicks('floor_05', 'floor_01').map((t) => t.floor)).toEqual([4, 3, 2, 1])
  })
})

describe('Pass C feel — combat hold + stinger', () => {
  it('classifies a win so the faint beat can play before the receipt', () => {
    const prev = startEncounter(start(), 'enc_desk_challenger')
    const next: OfficeState = {
      ...prev,
      screen: 'overworld',
      battle: null,
      encounter: null,
      stats: { ...prev.stats, battlesWon: prev.stats.battlesWon + 1 },
      overlay: { kind: 'receipt', receiptId: 'rcpt_desk_argument' },
    }
    expect(officeBattleOutcome(prev, next)).toBe('win')
  })

  it('classifies a wipe so the faint beat can play before the interstitial', () => {
    const prev = startEncounter(start(), 'enc_desk_challenger')
    const next: OfficeState = {
      ...prev,
      screen: 'overworld',
      battle: null,
      encounter: null,
      overlay: { kind: 'interstitial', encounterId: 'enc_desk_challenger' },
    }
    expect(officeBattleOutcome(prev, next)).toBe('wipe')
  })

  it('leaves mid-turn fights as ongoing', () => {
    const prev = startEncounter(start(), 'enc_desk_challenger')
    expect(officeBattleOutcome(prev, prev)).toBe('ongoing')
  })

  it('stamps boss reviews CLOSED and spars CLEARED', () => {
    expect(officeVictoryStinger('enc_desk_challenger')).toEqual({
      kicker: 'CLEARED',
      name: 'Gavin',
      card: 'DESK-PIT ARGUMENT',
    })
    expect(officeVictoryStinger('enc_ceo_review')).toMatchObject({
      kicker: 'REVIEW CLOSED',
      name: 'Caldwell',
      card: 'THE REVIEW',
    })
  })
})
