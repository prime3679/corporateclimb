import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import {
  OFFICE_ENCOUNTERS,
  canRideTo,
  defeatRespawnForFloor,
  elevatorArrivalForFloor,
  isStubFloor,
} from '@/content/office'
import { resolvePlayerMove } from '@/engine'
import {
  currentObjective,
  dispatchOfficeAction,
  effectiveKit,
  newOfficeCampaign,
  startEncounter,
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
  for (let i = 0; i < 28 && s.overlay; i++) {
    if (s.overlay.kind === 'receipt') s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    else if (
      s.overlay.kind === 'stakes' ||
      s.overlay.kind === 'recruit' ||
      s.overlay.kind === 'celebration'
    ) {
      break
    } else s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
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
  return { ...next, overlay: null, overlayQueue: [] }
}

function badged(): OfficeState {
  return {
    ...start(),
    keyItems: { key_access_badge: 1, key_employee_badge: 1 },
    flags: ['flag_preview_complete', 'flag_visited_f2', 'flag_floor2_complete'],
    firedTriggers: ['trg_first_step_f2:arrival'],
  }
}

function arrive(floor: OfficeState['floorId'], extra?: Partial<OfficeState>): OfficeState {
  let s = { ...badged(), ...extra }
  if (s.floorId !== floor) s = ride(s, floor)
  s = {
    ...s,
    overlay: null,
    overlayQueue: [],
    player: { x: 3, y: 2, facing: 's' },
  }
  return s
}

describe('Floors 3–5 assignment + boss reducers', () => {
  it('clears isStubFloor now that the machines are live', () => {
    expect(isStubFloor('floor_03')).toBe(false)
    expect(isStubFloor('floor_04')).toBe(false)
    expect(isStubFloor('floor_05')).toBe(false)
    expect(canRideTo('floor_05', { key_employee_badge: 1 })).toBe(true)
    expect(defeatRespawnForFloor('floor_03')).toEqual({ x: 5, y: 12, facing: 'n' })
    expect(defeatRespawnForFloor('floor_04')).toEqual({ x: 5, y: 12, facing: 'n' })
    expect(defeatRespawnForFloor('floor_05')).toEqual({ x: 5, y: 12, facing: 'n' })
  })

  it('runs Floor 3: Sloane → card → Nico initials → Quincy → product badge', () => {
    let s = arrive('floor_03')
    const wallet = s.run.stockOptions

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_sloane_callout' })
    expect(s.flags).toContain('flag_visited_f3')
    s = drain(s)
    expect(currentObjective(s)).toMatchObject({ text: 'Talk to Sloane', zone: 'zone_war' })

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_sloane_brief' })
    s = drain(s)
    expect(s.assignments.asg_roadmap).toBe('accepted')
    expect(currentObjective(s)).toMatchObject({ text: 'Pull the Q4 card', pin: { x: 13, y: 1 } })

    s = dispatchOfficeAction(at(s, 13, 2, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_roadmap).toBe('card_held')
    expect(s.keyItems.key_roadmap_card).toBe(1)
    expect(currentObjective(s)).toMatchObject({
      text: "Get Nico's initials",
      zone: 'zone_intake',
    })
    s = dispatchOfficeAction(at(s, 13, 2, 'n'), { type: 'INTERACT' }).state
    expect(s.assignments.asg_roadmap).toBe('card_held')
    s = drain(s)

    s = dispatchOfficeAction(at(s, 18, 3, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_nico_waiting' })
    s = drain(s)
    expect(s.assignments.asg_roadmap).toBe('initialled')
    expect(s.keyItems.key_roadmap_card).toBeUndefined()
    expect(s.keyItems.key_research_sticky).toBe(1)
    expect(s.run.stockOptions).toBe(wallet + 14)
    expect(s.rewardsClaimed).toContain('rwd_asg_roadmap')
    expect(currentObjective(s)).toMatchObject({ text: 'Report back to Sloane' })

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_sloane_filed' })
    s = drain(s)
    expect(s.assignments.asg_roadmap).toBe('complete')
    expect(currentObjective(s)).toMatchObject({ text: 'See Quincy', zone: 'zone_product' })

    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_quincy_review' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'begin' }).state
    expect(s.overlay).toMatchObject({ kind: 'stakes', encounterId: 'enc_vp_product' })
    s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
    expect(s.screen).toBe('battle')
    s = smash(s)
    expect(s.encounters.enc_vp_product).toBe('won')
    expect(s.rewardsClaimed).toContain('rwd_enc_vp_product')
    s = drain(s)
    expect(s.keyItems.key_product_badge).toBe(1)
    expect(s.flags).toContain('flag_floor3_complete')
    expect(s.screen).toBe('promotion')
  })

  it('lets Floor 3 file the card on the intake board instead of talking Nico', () => {
    let s = arrive('floor_03')
    s = {
      ...s,
      assignments: { ...s.assignments, asg_roadmap: 'card_held' },
      keyItems: { ...s.keyItems, key_roadmap_card: 1 },
      flags: [...s.flags, 'flag_visited_f3'],
      firedTriggers: [...s.firedTriggers, 'trg_first_step_f3:arrival'],
    }
    s = dispatchOfficeAction(at(s, 19, 5, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_roadmap).toBe('initialled')
    expect(s.keyItems.key_research_sticky).toBe(1)
    expect(s.rewardsClaimed).toContain('rwd_asg_roadmap')
    s = dispatchOfficeAction(at(s, 19, 5, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.rewardsClaimed.filter((id) => id === 'rwd_asg_roadmap')).toHaveLength(1)
  })

  it('keeps Quincy early until the assignment is complete', () => {
    let s = arrive('floor_03')
    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_quincy_early' })
    s = {
      ...drain(s),
      assignments: { ...s.assignments, asg_roadmap: 'initialled' },
      overlay: null,
      overlayQueue: [],
    }
    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_quincy_sloane_pending' })
  })

  it('runs Floor 4: Harper → leave-behind (once) → Reyes → Ashford → client badge', () => {
    let s = arrive('floor_04', {
      keyItems: { key_access_badge: 1, key_employee_badge: 1, key_product_badge: 1 },
      flags: [
        'flag_preview_complete',
        'flag_visited_f2',
        'flag_floor2_complete',
        'flag_floor3_complete',
      ],
    })
    const wallet = s.run.stockOptions

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_harper_callout' })
    s = drain(s)

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_harper_brief' })
    s = drain(s)
    expect(s.assignments.asg_leavebehind).toBe('accepted')
    expect(currentObjective(s)).toMatchObject({ text: 'Pull the leave-behind' })

    s = dispatchOfficeAction(at(s, 13, 2, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_leavebehind).toBe('deck_held')
    expect(s.keyItems.key_leavebehind).toBe(1)
    s = dispatchOfficeAction(at(s, 19, 5, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.keyItems.key_leavebehind).toBe(1)
    expect(currentObjective(s)).toMatchObject({
      text: 'Walk it over to Reyes',
      zone: 'zone_client',
    })

    s = dispatchOfficeAction(at(s, 18, 3, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_reyes_waiting' })
    s = drain(s)
    expect(s.assignments.asg_leavebehind).toBe('delivered')
    expect(s.keyItems.key_leavebehind).toBeUndefined()
    expect(s.run.stockOptions).toBe(wallet + 16)
    expect(s.rewardsClaimed).toContain('rwd_asg_leavebehind')

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_harper_filed' })
    s = drain(s)
    expect(s.assignments.asg_leavebehind).toBe('complete')
    expect(currentObjective(s)).toMatchObject({ text: 'See Ashford', zone: 'zone_sales' })

    s = dispatchOfficeAction(at(s, 16, 11, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_ashford_close' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'begin' }).state
    expect(s.overlay).toMatchObject({ kind: 'stakes', encounterId: 'enc_vp_sales' })
    s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
    s = smash(s)
    expect(s.encounters.enc_vp_sales).toBe('won')
    s = drain(s)
    expect(s.keyItems.key_client_badge).toBe(1)
    expect(s.flags).toContain('flag_floor4_complete')
    expect(s.screen).toBe('promotion')
  })

  it('runs Floor 5: Marlowe → packet → file → Caldwell → the climb (no Floor 6)', () => {
    let s = arrive('floor_05', {
      keyItems: {
        key_access_badge: 1,
        key_employee_badge: 1,
        key_product_badge: 1,
        key_client_badge: 1,
      },
      flags: [
        'flag_preview_complete',
        'flag_visited_f2',
        'flag_floor2_complete',
        'flag_floor3_complete',
        'flag_floor4_complete',
      ],
    })
    const wallet = s.run.stockOptions

    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_marlowe_callout' })
    s = drain(s)

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_marlowe_brief' })
    s = drain(s)
    expect(s.assignments.asg_board_packet).toBe('accepted')

    s = dispatchOfficeAction(at(s, 17, 5, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.assignments.asg_board_packet).toBe('packet_held')
    expect(s.keyItems.key_board_packet).toBe(1)
    expect(currentObjective(s)).toMatchObject({ text: 'File the packet with Marlowe' })

    s = dispatchOfficeAction(at(s, 10, 4, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_marlowe_filed' })
    s = drain(s)
    expect(s.assignments.asg_board_packet).toBe('complete')
    expect(s.keyItems.key_board_packet).toBeUndefined()
    expect(s.run.stockOptions).toBe(wallet + 18)
    expect(s.rewardsClaimed).toContain('rwd_asg_board_packet')
    expect(currentObjective(s)).toMatchObject({ text: 'See Caldwell', zone: 'zone_board' })

    s = dispatchOfficeAction(at(s, 17, 11, 'e'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_caldwell_review' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'begin' }).state
    expect(s.overlay).toMatchObject({ kind: 'stakes', encounterId: 'enc_ceo_review' })
    s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
    s = smash(s)
    expect(s.encounters.enc_ceo_review).toBe('won')
    s = drain(s)
    expect(s.flags).toContain('flag_floor5_complete')
    expect(s.keyItems.key_product_badge).toBe(1)
    expect(s.keyItems.key_client_badge).toBe(1)
    expect(s.screen).toBe('promotion')
  })

  it('transforms Caldwell at half HP (≤ 130) and leaves Classic phase-2 bit-identical', () => {
    let s = arrive('floor_05')
    s = {
      ...s,
      assignments: { ...s.assignments, asg_board_packet: 'complete' },
    }
    s = startEncounter(s, 'enc_ceo_review')
    const enemy = OFFICE_ENCOUNTERS.enc_ceo_review
    const member = s.encounter!.party[s.encounter!.activeIndex]
    const battle = { ...s.battle!, enemyHp: Math.floor(enemy.maxHp * 0.5) + 8 }
    expect(battle.enemyHp).toBeGreaterThan(130)
    const result = resolvePlayerMove(
      {
        run: { ...s.run, hp: member.hp, pp: [...member.pp] },
        battle: { ...battle, enemyHp: 130 },
        effectivePlayer: effectiveKit(s, member),
        encounterEnemy: enemy,
        partyHp: s.encounter!.party.map((m) => m.hp),
        activeIndex: s.encounter!.activeIndex,
        activeSlot: member.slot,
      },
      0,
      () => 0.01,
    )
    expect(result.battle.enemyPhase).toBe(2)
    expect(result.battle.enemyHp).toBe(150)
    expect(result.battle.enemyStatuses).toEqual([])
    expect(result.events.some((e) => e.kind === 'phase2')).toBe(true)
    expect(result.battle.phase).toBe('player')
  })

  it('rides 2 → 3 → 4 → 5, opens the Floor 5 celebration after Caldwell, and backtracks to 1', () => {
    let s = badged()
    s = ride(s, 'floor_02')
    s = ride(s, 'floor_03')
    expect(s.floorId).toBe('floor_03')
    expect(s.player).toEqual(elevatorArrivalForFloor('floor_03'))
    expect(s.flags).toContain('flag_floor2_complete')
    s = ride(s, 'floor_04')
    expect(s.floorId).toBe('floor_04')
    s = ride(s, 'floor_05')
    expect(s.floorId).toBe('floor_05')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
    expect(s.stats.rides).toBeGreaterThanOrEqual(3)

    s = {
      ...s,
      flags: [...s.flags, 'flag_floor5_complete'],
      encounters: { ...s.encounters, enc_ceo_review: 'won' },
      overlay: { kind: 'elevator_panel' },
      overlayQueue: [],
    }
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_05' }).state
    expect(s.overlay).toMatchObject({
      kind: 'celebration',
      screen: 'screen_floor5_complete',
    })
    expect(s.floorId).toBe('floor_05')

    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'continue' }).state
    expect(s.overlay).toBeNull()
    s = ride(s, 'floor_01')
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
  })
})
