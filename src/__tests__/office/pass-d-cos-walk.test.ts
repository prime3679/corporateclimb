import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import {
  ELEVATOR_FLOORS,
  OFFICE_FLOOR_COUNT,
  OFFICE_VENDING_STOCK_BY_FLOOR,
  SIDE_LOCKERS_OPEN,
  SIDE_SAFE_READ,
  canRideTo,
  isKnownFloorId,
  vendingFlavor,
} from '@/content/office'
import {
  celebrationLedger,
  dispatchOfficeAction,
  newOfficeCampaign,
  type OfficeState,
} from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

function at(
  state: OfficeState,
  x: number,
  y: number,
  facing: OfficeState['player']['facing'] = 'n',
): OfficeState {
  return { ...state, overlay: null, overlayQueue: [], player: { x, y, facing } }
}

function drain(state: OfficeState): OfficeState {
  let s = state
  for (let i = 0; i < 36 && (s.overlay || s.screen === 'promotion'); i++) {
    if (s.screen === 'promotion' && s.run.pendingPerkOffer?.[0]) {
      const perk =
        s.run.pendingPerkOffer.find((id) => id !== 'signing_bonus') ?? s.run.pendingPerkOffer[0]
      s = dispatchOfficeAction(s, { type: 'PICK_PERK', perkId: perk }).state
      continue
    }
    if (!s.overlay) break
    if (s.overlay.kind === 'receipt') {
      s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    } else if (s.overlay.kind === 'stakes' || s.overlay.kind === 'celebration') {
      break
    } else if (s.overlay.kind === 'recruit') {
      s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'not_yet' }).state
    } else {
      s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    }
  }
  return s
}

function smash(state: OfficeState): OfficeState {
  if (!state.battle) return state
  return dispatchOfficeAction(
    { ...state, battle: { ...state.battle, enemyHp: 1 } },
    { type: 'BATTLE_MOVE', moveIdx: 0 },
    () => 0.01,
  ).state
}

function ride(state: OfficeState, to: OfficeState['floorId']): OfficeState {
  let next = dispatchOfficeAction(at(state, 3, 2, 'n'), { type: 'RIDE_ELEVATOR', to }).state
  next = dispatchOfficeAction(next, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
  if (next.overlay?.kind === 'celebration') {
    next = dispatchOfficeAction(next, { type: 'CHOOSE', choice: 'stay' }).state
  }
  return { ...next, overlay: null, overlayQueue: [] }
}

function talk(state: OfficeState, x: number, y: number, facing: OfficeState['player']['facing']) {
  return drain(dispatchOfficeAction(at(state, x, y, facing), { type: 'INTERACT' }).state)
}

function beginFight(state: OfficeState, choice: 'begin' | 'bring_it' = 'begin'): OfficeState {
  let s = state
  if (s.overlay?.kind === 'dialogue') {
    s = drain(s)
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice }).state
  }
  if (s.overlay?.kind === 'stakes') s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
  s = smash(s)
  return drain(s)
}

function openVending(
  state: OfficeState,
  x: number,
  y: number,
  facing: OfficeState['player']['facing'],
) {
  return dispatchOfficeAction(at(state, x, y, facing), { type: 'INTERACT' }).state
}

describe('CoS cold playtest — fresh save 1→5', () => {
  it('clears the required route to THE NOD with no Floor 6, distinct machines, and the F2 locker beat', () => {
    expect(OFFICE_FLOOR_COUNT).toBe(5)
    const cabNumbers: number[] = ELEVATOR_FLOORS.map((r) => r.number)
    expect(cabNumbers).toEqual([5, 4, 3, 2, 1])
    expect(cabNumbers).not.toContain(6)
    expect(isKnownFloorId('floor_06' as never)).toBe(false)

    let s = start()
    expect(s.floorId).toBe('floor_01')
    expect(s.run.stockOptions).toBe(10)

    // Floor 1 required: printer → Gavin → Holloway. Skip Priya.
    s = talk(s, 8, 16, 'n')
    expect(s.assignments.asg_printer).toBe('accepted')
    s = talk(s, 15, 8, 'n')
    expect(s.assignments.asg_printer).toBe('toner_collected')
    s = talk(s, 9, 8, 'n')
    expect(s.assignments.asg_printer).toBe('installed')
    s = talk(s, 8, 16, 'n')
    expect(s.assignments.asg_printer).toBe('complete')

    s = dispatchOfficeAction(at(s, 5, 10, 'e'), { type: 'INTERACT' }).state
    s = beginFight(s, 'bring_it')
    expect(s.encounters.enc_desk_challenger).toBe('won')

    s = dispatchOfficeAction(at(s, 6, 2, 's'), { type: 'INTERACT' }).state
    s = beginFight(s)
    expect(s.encounters.enc_supervisor_1on1).toBe('won')
    expect(s.keyItems.key_access_badge).toBe(1)
    expect(canRideTo('floor_02', s.keyItems)).toBe(true)
    expect(canRideTo('floor_03', s.keyItems)).toBe(false)

    const f1 = openVending(s, 21, 9, 'e')
    expect(f1.screen).toBe('vending')
    expect(vendingFlavor('floor_01', f1.run.shopStock ?? []).title).toBe('VENDING · YOUR TEAM')
    expect(f1.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_01])
    s = dispatchOfficeAction(f1, { type: 'CLOSE_OVERLAY' }).state

    s = dispatchOfficeAction(at(s, 3, 2, 'n'), { type: 'RIDE_ELEVATOR', to: 'floor_02' }).state
    s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_preview_complete' })
    const f1Ledger = celebrationLedger(s, 'screen_preview_complete')
    expect(f1Ledger.max).toBe(65)
    expect(f1Ledger.earned).toBe(48)
    expect(f1Ledger.complete).toBe(false)
    expect(f1Ledger.rows.find((row) => row.id === 'rwd_enc_meeting_prepper')?.claimed).toBe(false)
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state
    expect(s.floorId).toBe('floor_02')

    // Floor 2 side beat: lockers stay locked until the safe sticky, then empty on purpose.
    s = talk({ ...s, overlay: null, overlayQueue: [] }, 9, 12, 'w')
    expect(s.firedTriggers).not.toContain(SIDE_LOCKERS_OPEN)
    s = talk({ ...s, overlay: null, overlayQueue: [] }, 21, 10, 'e')
    expect(s.firedTriggers).toContain(SIDE_SAFE_READ)
    const beforeCombo = s.run.stockOptions
    const claimed = [...s.rewardsClaimed]
    s = dispatchOfficeAction(at(s, 9, 12, 'w'), { type: 'INTERACT' }).state
    expect(s.firedTriggers).toContain(SIDE_LOCKERS_OPEN)
    expect(s.overlayQueue[0]).toMatchObject({ kind: 'toast', text: 'Got: Nothing. On purpose.' })
    s = drain({ ...s, overlay: null, overlayQueue: [] })
    expect(s.run.stockOptions).toBe(beforeCombo)
    expect(s.rewardsClaimed).toEqual(claimed)
    expect(s.assignments.asg_transfer).toBe('not_started')

    s = talk(s, 12, 4, 'e')
    const f2 = openVending(s, 13, 12, 'e')
    expect(vendingFlavor('floor_02', f2.run.shopStock ?? []).title).toBe('VENDING · OPERATIONS')
    expect(f2.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_02])
    expect(f2.run.shopStock).not.toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
    s = dispatchOfficeAction(f2, { type: 'CLOSE_OVERLAY' }).state

    // Floor 2 required: Teddy packet → Kessler → employee badge.
    s = drain(
      dispatchOfficeAction(
        { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 's' } },
        { type: 'MOVE', dir: 's' },
      ).state,
    )
    s = talk(s, 8, 3, 'e')
    expect(s.assignments.asg_transfer).toBe('accepted')
    s = talk(s, 12, 2, 'n')
    expect(s.assignments.asg_transfer).toBe('photo_taken')
    s = ride(s, 'floor_01')
    s = talk(s, 6, 2, 's')
    expect(s.assignments.asg_transfer).toBe('signed')
    s = ride(s, 'floor_02')
    s = talk(s, 18, 4, 'n')
    expect(s.assignments.asg_transfer).toBe('filed')
    s = drain(dispatchOfficeAction(at(s, 9, 7, 'n'), { type: 'MOVE', dir: 'n' }).state)
    expect(s.assignments.asg_transfer).toBe('complete')
    if (s.overlay?.kind === 'stakes') {
      s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
      s = smash(s)
      s = drain(s)
    }
    expect(s.encounters.enc_help_desk_intern).toBe('won')

    s = dispatchOfficeAction(
      { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 8, facing: 's' } },
      { type: 'MOVE', dir: 's' },
    ).state
    expect(s.overlay).toMatchObject({ kind: 'confirm', prompt: 'kessler_door' })
    s = dispatchOfficeAction(s, { type: 'DOOR_STEP_IN' }).state
    s = beginFight(s)
    expect(s.encounters.enc_director_review).toBe('won')
    s = talk(s, 11, 3, 'n')
    expect(s.keyItems.key_employee_badge).toBe(1)
    expect(canRideTo('floor_05', s.keyItems)).toBe(true)

    s = dispatchOfficeAction(at(s, 3, 2, 'n'), { type: 'RIDE_ELEVATOR', to: 'floor_03' }).state
    s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_floor2_complete' })
    const f2Ledger = celebrationLedger(s, 'screen_floor2_complete')
    expect(f2Ledger.max).toBe(90)
    expect(f2Ledger.earned).toBe(59)
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state
    expect(s.floorId).toBe('floor_03')

    // Floor 3 Product machine + required route.
    const f3 = openVending(s, 21, 16, 'e')
    expect(vendingFlavor('floor_03', f3.run.shopStock ?? []).title).toBe('VENDING · PRODUCT')
    expect(f3.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
    expect(f3.vendingStock.floor_01).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_01])
    s = dispatchOfficeAction(f3, { type: 'CLOSE_OVERLAY' }).state

    s = drain(
      dispatchOfficeAction(
        { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 's' } },
        { type: 'MOVE', dir: 's' },
      ).state,
    )
    s = talk(s, 10, 4, 'n')
    expect(s.assignments.asg_roadmap).toBe('accepted')
    s = talk(s, 13, 2, 'n')
    expect(s.assignments.asg_roadmap).toBe('card_held')
    s = talk(s, 18, 3, 'e')
    expect(s.assignments.asg_roadmap).toBe('initialled')
    s = talk(s, 10, 4, 'n')
    expect(s.assignments.asg_roadmap).toBe('complete')
    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    s = beginFight(s)
    expect(s.encounters.enc_vp_product).toBe('won')
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_floor3_complete' })
    const f3Ledger = celebrationLedger(s, 'screen_floor3_complete')
    expect(f3Ledger).toMatchObject({ earned: 54, max: 54, complete: true })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state

    s = ride(s, 'floor_04')
    const f4 = openVending(s, 21, 16, 'e')
    expect(vendingFlavor('floor_04', f4.run.shopStock ?? []).title).toBe('VENDING · SALES')
    expect(f4.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_04])
    expect(f4.run.shopStock).not.toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
    s = dispatchOfficeAction(f4, { type: 'CLOSE_OVERLAY' }).state

    s = drain(
      dispatchOfficeAction(
        { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 's' } },
        { type: 'MOVE', dir: 's' },
      ).state,
    )
    s = talk(s, 10, 4, 'n')
    s = talk(s, 13, 2, 'n')
    s = talk(s, 18, 3, 'e')
    s = talk(s, 10, 4, 'n')
    expect(s.assignments.asg_leavebehind).toBe('complete')
    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    s = beginFight(s)
    expect(s.encounters.enc_vp_sales).toBe('won')
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_floor4_complete' })
    expect(celebrationLedger(s, 'screen_floor4_complete')).toMatchObject({
      earned: 64,
      max: 64,
      complete: true,
    })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state

    s = ride(s, 'floor_05')
    const f5 = openVending(s, 21, 16, 'e')
    expect(vendingFlavor('floor_05', f5.run.shopStock ?? []).title).toBe('VENDING · EXEC')
    expect(f5.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_05])
    expect(f5.run.shopStock).not.toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_04])
    s = dispatchOfficeAction(f5, { type: 'CLOSE_OVERLAY' }).state

    s = drain(
      dispatchOfficeAction(
        { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 's' } },
        { type: 'MOVE', dir: 's' },
      ).state,
    )
    s = talk(s, 10, 4, 'n')
    s = talk(s, 17, 5, 'n')
    s = talk(s, 10, 4, 'n')
    expect(s.assignments.asg_board_packet).toBe('complete')
    s = dispatchOfficeAction(at(s, 17, 11, 'e'), { type: 'INTERACT' }).state
    s = beginFight(s)
    expect(s.encounters.enc_ceo_review).toBe('won')
    expect(s.flags).toContain('flag_floor5_complete')
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_floor5_complete' })
    const nod = celebrationLedger(s, 'screen_floor5_complete')
    expect(nod).toMatchObject({ earned: 78, max: 78, complete: true })
    expect(nod.rows.map((row) => row.id)).toEqual(['rwd_asg_board_packet', 'rwd_enc_ceo_review'])
    expect(nod.rows.every((row) => row.claimed)).toBe(true)

    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state
    s = dispatchOfficeAction(at(s, 3, 2, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_05' }).state
    expect(s.overlay).toMatchObject({ kind: 'celebration', screen: 'screen_floor5_complete' })
    expect(s.floorId).toBe('floor_05')

    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state
    s = ride(s, 'floor_01')
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
    expect(s.keyItems.key_access_badge).toBe(1)
    expect(s.keyItems.key_employee_badge).toBe(1)
  })
})
