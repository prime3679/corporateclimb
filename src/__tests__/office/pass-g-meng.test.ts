import { beforeEach, describe, expect, it } from 'vitest'
import {
  COWORKER_KITS,
  ELEVATOR_FLOORS,
  FLOOR_IDS,
  OFFICE_ENCOUNTERS,
  OFFICE_LIGHT_POOLS,
  PARTY_MAX,
  POI_INSPECT,
  canRideTo,
  elevatorArrivalForFloor,
  elevatorPanelIntent,
  type FloorId,
} from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import {
  ELEVATOR_PIN,
  OFFICE_REVIEW_HOLD_MS,
  OFFICE_SPAR_HOLD_MS,
  currentObjective,
  clearOfficeSave,
  destChip,
  dispatchOfficeAction,
  isCrossFloorObjective,
  loadOffice,
  newOfficeCampaign,
  officeVictoryHoldMs,
  saveOffice,
  type OfficeState,
} from '@/engine/office'
import { COACH_COPY } from '@/screens/office/overlays'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

beforeEach(() => {
  clearOfficeSave()
})

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

function at(state: OfficeState, x: number, y: number): OfficeState {
  return { ...state, overlay: null, overlayQueue: [], player: { x, y, facing: 'n' } }
}

function ride(state: OfficeState, to: FloorId): OfficeState {
  let next = dispatchOfficeAction(at(state, 3, 2), { type: 'RIDE_ELEVATOR', to }).state
  next = dispatchOfficeAction(next, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
  return { ...next, overlay: null, overlayQueue: [] }
}

function badged(extra?: Partial<OfficeState>): OfficeState {
  return {
    ...start(),
    keyItems: { key_access_badge: 1, key_employee_badge: 1 },
    flags: ['flag_preview_complete', 'flag_visited_f2', 'flag_floor2_complete'],
    ...extra,
  }
}

function expectElevatorPin(state: OfficeState) {
  const obj = currentObjective(state)
  expect(isCrossFloorObjective(state, obj), obj.text).toBe(true)
  expect(obj.pin).toEqual(ELEVATOR_PIN)
}

describe('Pass G — currentObjective F5→F4→F3→F2→F1', () => {
  it('sends a badged lobby to Floor 3, then 4, then 5, with the pin on these doors', () => {
    const lobby = { ...badged(), floorId: 'floor_01' as const }
    expect(currentObjective(lobby)).toMatchObject({
      text: 'Take the elevator to Floor 3',
      destFloor: 'floor_03',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(lobby).label).toBe('▲ → FLOOR 3')
    expectElevatorPin(lobby)

    const product = {
      ...lobby,
      keyItems: { ...lobby.keyItems, key_product_badge: 1 },
      flags: [...lobby.flags, 'flag_floor3_complete'],
    }
    expect(currentObjective(product)).toMatchObject({
      text: 'Take the elevator to Floor 4',
      destFloor: 'floor_04',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(product).label).toBe('▲ → FLOOR 4')

    const client = {
      ...product,
      keyItems: { ...product.keyItems, key_client_badge: 1 },
      flags: [...product.flags, 'flag_floor4_complete'],
      assignments: { ...product.assignments, asg_leavebehind: 'complete' as const },
    }
    expect(currentObjective(client)).toMatchObject({
      text: 'Take the elevator to Floor 5',
      destFloor: 'floor_05',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(client).label).toBe('▲ → FLOOR 5')
  })

  it('keeps an in-progress upper-floor assignment pinned on the current elevator', () => {
    const pulling = {
      ...badged(),
      floorId: 'floor_01' as const,
      assignments: { ...badged().assignments, asg_roadmap: 'accepted' as const },
    }
    expect(currentObjective(pulling)).toMatchObject({
      text: 'Pull the Q4 card (Floor 3)',
      destFloor: 'floor_03',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(pulling).label).toBe('▲ → FLOOR 3')

    const packet = {
      ...badged(),
      floorId: 'floor_02' as const,
      assignments: { ...badged().assignments, asg_board_packet: 'accepted' as const },
      flags: [...badged().flags, 'flag_visited_f5'],
      keyItems: { ...badged().keyItems, key_client_badge: 1 },
    }
    expect(currentObjective(packet)).toMatchObject({
      text: 'Take the board packet (Floor 5)',
      destFloor: 'floor_05',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(packet).label).toBe('▲ → FLOOR 5')
  })

  it('honors a skip onto Floor 5 and does not yank the pin back to Floor 3', () => {
    const jumped = {
      ...badged(),
      floorId: 'floor_05' as const,
      flags: [...badged().flags, 'flag_visited_f5'],
    }
    expect(currentObjective(jumped).text).toBe('Talk to Marlowe')
    expect(isCrossFloorObjective(jumped)).toBe(false)

    const back = { ...jumped, floorId: 'floor_01' as const }
    expect(currentObjective(back)).toMatchObject({
      text: 'Take the elevator to Floor 5',
      destFloor: 'floor_05',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(back).label).toBe('▲ → FLOOR 5')
  })

  it('after the climb, never falls through to Take the elevator to Floor 2', () => {
    const climbed = {
      ...badged(),
      flags: [
        ...badged().flags,
        'flag_floor3_complete',
        'flag_floor4_complete',
        'flag_floor5_complete',
      ],
      assignments: {
        ...badged().assignments,
        asg_roadmap: 'complete' as const,
        asg_leavebehind: 'complete' as const,
        asg_board_packet: 'complete' as const,
      },
      encounters: {
        ...badged().encounters,
        enc_vp_product: 'won' as const,
        enc_vp_sales: 'won' as const,
        enc_ceo_review: 'won' as const,
      },
      keyItems: {
        ...badged().keyItems,
        key_product_badge: 1,
        key_client_badge: 1,
      },
    }

    const onFive = { ...climbed, floorId: 'floor_05' as const }
    expect(currentObjective(onFive)).toMatchObject({
      text: 'The elevator still goes down',
      pin: ELEVATOR_PIN,
    })
    expect(destChip(onFive).label).toBe('→ LANDING')

    for (const floorId of ['floor_04', 'floor_03', 'floor_02', 'floor_01'] as FloorId[]) {
      const here = { ...climbed, floorId }
      const obj = currentObjective(here)
      expect(obj.text, floorId).toBe('The elevator still goes down')
      expect(obj.text, floorId).not.toContain('Floor 2')
      if (floorId === 'floor_01') {
        expect(obj.pin).toEqual(ELEVATOR_PIN)
        expect(isCrossFloorObjective(here, obj)).toBe(false)
      } else {
        expect(obj).toMatchObject({ destFloor: 'floor_01', pin: ELEVATOR_PIN })
        expect(destChip(here, obj).label).toBe('▼ → FLOOR 1')
      }
    }
  })
})

describe('Pass G — elevator panel intent + rides', () => {
  it('marks the current floor inert and a missing key locked', () => {
    expect(elevatorPanelIntent('floor_02', 'floor_02', { key_access_badge: 1 })).toBe('here')
    expect(elevatorPanelIntent('floor_02', 'floor_03', { key_access_badge: 1 })).toBe('locked')
    expect(
      elevatorPanelIntent('floor_02', 'floor_03', {
        key_access_badge: 1,
        key_employee_badge: 1,
      }),
    ).toBe('ride')
    expect(
      elevatorPanelIntent('floor_05', 'floor_05', { key_employee_badge: 1 }, [
        'flag_floor5_complete',
      ]),
    ).toBe('climb')
    expect(canRideTo('floor_05', { key_employee_badge: 1 })).toBe(true)
  })

  it('keeps a locked 3+ row on the cab with the employee-badge beep line', () => {
    let s = dispatchOfficeAction(at({ ...start(), keyItems: { key_access_badge: 1 } }, 3, 2), {
      type: 'INTERACT',
    }).state
    expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_01' }).state
    expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
    expect(s.floorId).toBe('floor_01')
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_05' }).state
    expect(s.overlay).toMatchObject({
      kind: 'elevator_panel',
      denyNote: POI_INSPECT.poi_elevator_door_f2,
    })
    expect(s.screen).toBe('overworld')
    expect(s.floorId).toBe('floor_01')
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'stay' }).state
    expect(s.overlay).toBeNull()
  })

  it('rides 2 → 3 → 4 → 5 and 5 → 1 without a sixth floor', () => {
    let s = badged()
    for (const to of ['floor_02', 'floor_03', 'floor_04', 'floor_05'] as FloorId[]) {
      s = ride(s, to)
      expect(s.floorId).toBe(to)
      expect(s.player).toEqual(elevatorArrivalForFloor(to))
    }
    expect(ELEVATOR_FLOORS.map((row) => row.number)).toEqual([5, 4, 3, 2, 1])
    s = ride(s, 'floor_01')
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
  })
})

describe('Pass G — F3–5 combat pacing, perks, roster, light', () => {
  it('holds F3–5 reviews longer than spars and still offers a saved perk', () => {
    expect(officeVictoryHoldMs('enc_desk_challenger')).toBe(OFFICE_SPAR_HOLD_MS)
    expect(officeVictoryHoldMs('enc_supervisor_1on1')).toBe(OFFICE_SPAR_HOLD_MS)
    expect(officeVictoryHoldMs('enc_vp_product')).toBe(OFFICE_REVIEW_HOLD_MS)
    expect(officeVictoryHoldMs('enc_vp_sales')).toBe(OFFICE_REVIEW_HOLD_MS)
    expect(officeVictoryHoldMs('enc_ceo_review')).toBe(OFFICE_REVIEW_HOLD_MS)
    expect(OFFICE_REVIEW_HOLD_MS).toBeGreaterThan(OFFICE_SPAR_HOLD_MS)
  })

  it('rolls and persists the Floor 3 perk offer before the promotion screen', () => {
    let s: OfficeState = {
      ...badged(),
      floorId: 'floor_03',
      overlay: { kind: 'receipt', receiptId: 'rcpt_product_badge' },
      overlayQueue: [],
    }
    s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }, () => 0.2).state
    expect(s.screen).toBe('promotion')
    expect(s.run.pendingPerkOffer).toHaveLength(3)
    expect(s.rewardsClaimed).toContain('rwd_promotion_f3')

    saveOffice(s)
    const loaded = loadOffice()
    expect(loaded?.run.pendingPerkOffer).toEqual(s.run.pendingPerkOffer)
    expect(loaded?.screen).toBe('promotion')
  })

  it('keeps the roster at three coworkers and F3–5 bosses as reviews, not recruits', () => {
    expect(PARTY_MAX).toBe(3)
    expect(Object.keys(COWORKER_KITS)).toEqual([
      'cw_desk_challenger',
      'cw_meeting_prepper',
      'cw_help_desk_intern',
    ])
    expect(OFFICE_ENCOUNTERS.enc_vp_product.recruit).toBeNull()
    expect(OFFICE_ENCOUNTERS.enc_vp_sales.recruit).toBeNull()
    expect(OFFICE_ENCOUNTERS.enc_ceo_review.recruit).toBeNull()
    expect(OFFICE_ENCOUNTERS.enc_vp_product.boss).toBe(true)
    expect(OFFICE_ENCOUNTERS.enc_ceo_review.phase2?.maxHp).toBe(150)
  })

  it('keeps a landing light pool on every floor so the elevator pin is lit', () => {
    expect(FLOOR_IDS).toHaveLength(5)
    for (const floor of FLOOR_IDS) {
      const pools = OFFICE_LIGHT_POOLS[floor]
      expect(pools.length, floor).toBeGreaterThanOrEqual(4)
      expect(
        pools.some((pool) => pool.kind === 'elevator'),
        floor,
      ).toBe(true)
    }
    expect(OFFICE_LIGHT_POOLS.floor_03.map((p) => p.kind)).toEqual([
      'elevator',
      'war',
      'intake',
      'break',
      'product',
    ])
    expect(OFFICE_LIGHT_POOLS.floor_05.map((p) => p.kind)).toEqual([
      'elevator',
      'ante',
      'break',
      'exec',
    ])
  })

  it('does not retouch Pass F coach chrome', () => {
    expect(COACH_COPY.coach_pin).toEqual({ key: 'PIN', rest: 'gold chip. That is your next stop.' })
    expect(COACH_COPY.coach_elevator).toEqual({ key: 'RIDE', rest: 'face the doors, then E.' })
  })
})
