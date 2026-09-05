import { describe, expect, it } from 'vitest'
import { DIALOGUE, OFFICE_FLOOR_COUNT, POI_INSPECT, officeBattleChrome } from '@/content/office'
import { headshotFocal } from '@/sprites'
import { PLAYER_CLASSES } from '@/data'
import {
  OFFICE_VENDING_STOCK_UPPER,
  currentObjective,
  destChip,
  dispatchOfficeAction,
  newOfficeCampaign,
  recruitCoworker,
  resolveNpcTalk,
  type OfficeState,
} from '@/engine/office'
import { hudKeyChips } from '@/screens/office/cast'

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

describe('Office should-fix fidelity', () => {
  it('prints the employee badge after a pause beat, not an inspect-then-instant receipt', () => {
    let s: OfficeState = {
      ...start(),
      floorId: 'floor_02',
      encounters: { ...start().encounters, enc_director_review: 'won' },
      keyItems: { key_access_badge: 1 },
    }
    s = dispatchOfficeAction(at(s, 11, 3, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'pause', reason: 'badge_print' })
    expect(s.keyItems.key_employee_badge).toBeUndefined()
    expect(s.overlayQueue[0]).toMatchObject({ kind: 'receipt', receiptId: 'rcpt_employee_badge' })
    s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
    expect(s.overlay).toMatchObject({ kind: 'receipt', receiptId: 'rcpt_employee_badge' })
    s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    expect(s.keyItems.key_employee_badge).toBe(1)
  })

  it('asks before sending a coworker to their desk', () => {
    let s = start()
    s = { ...s, keyItems: { key_offer_letter: 1 }, overlay: { kind: 'team', mode: 'roster' } }
    s = recruitCoworker(
      { ...s, encounters: { ...s.encounters, enc_desk_challenger: 'won' } },
      'cw_desk_challenger',
    )
    s = { ...s, overlay: { kind: 'team', mode: 'roster' }, overlayQueue: [] }
    expect(s.party).toHaveLength(2)
    s = dispatchOfficeAction(s, { type: 'REQUEST_DISMISS', slot: 1 }).state
    expect(s.overlay).toMatchObject({ kind: 'confirm', prompt: 'send_to_desk', slot: 1 })
    expect(s.overlayQueue[0]).toMatchObject({ kind: 'team', mode: 'roster' })
    expect(s.party).toHaveLength(2)
    s = dispatchOfficeAction(s, { type: 'CLOSE_OVERLAY' }).state
    expect(s.overlay).toMatchObject({ kind: 'team', mode: 'roster' })
    expect(s.party).toHaveLength(2)
    s = dispatchOfficeAction(s, { type: 'REQUEST_DISMISS', slot: 1 }).state
    s = dispatchOfficeAction(s, { type: 'DISMISS_MEMBER', slot: 1 }).state
    expect(s.party).toHaveLength(1)
    expect(s.hired).toContain('cw_desk_challenger')
  })

  it('keeps the objective on a skipped floor instead of yanking back to Floor 3', () => {
    const base: OfficeState = {
      ...start(),
      keyItems: { key_access_badge: 1, key_employee_badge: 1 },
      flags: ['flag_preview_complete', 'flag_visited_f2', 'flag_floor2_complete'],
    }
    const fromLobby = currentObjective({ ...base, floorId: 'floor_01' })
    expect(fromLobby).toMatchObject({ destFloor: 'floor_03', pin: { x: 3, y: 1 } })
    expect(destChip({ ...base, floorId: 'floor_01' }, fromLobby).label).toBe('▲ → FLOOR 3')

    const jumped: OfficeState = {
      ...base,
      floorId: 'floor_05',
      flags: [...base.flags, 'flag_visited_f5'],
    }
    expect(currentObjective(jumped).text).toBe('Talk to Marlowe')
    const back: OfficeState = { ...jumped, floorId: 'floor_01' }
    expect(currentObjective(back)).toMatchObject({
      text: 'Take the elevator to Floor 5',
      destFloor: 'floor_05',
    })
  })

  it('wires Renata’s audit line, Whitlock’s letter line, and Kessler’s mapped climb', () => {
    const audit: OfficeState = {
      ...start(),
      assignments: { ...start().assignments, asg_audit: 'accepted' },
    }
    expect(resolveNpcTalk(audit, 'npc_receptionist')).toBe('dlg_renata_audit')

    const letter: OfficeState = {
      ...start(),
      encounters: { ...start().encounters, enc_auditor: 'won' },
      keyItems: { key_offer_letter: 1 },
    }
    expect(resolveNpcTalk(letter, 'npc_auditor')).toBe('dlg_whitlock_recruit')
    const seen = dispatchOfficeAction(
      { ...letter, overlay: { kind: 'dialogue', nodeId: 'dlg_whitlock_recruit', line: 0 } },
      { type: 'ADVANCE' },
    ).state
    expect(seen.flags).toContain('flag_whitlock_recruit_seen')
    expect(resolveNpcTalk({ ...seen, overlay: null }, 'npc_auditor')).toBe('dlg_whitlock_after')

    expect(DIALOGUE.dlg_kessler_after.lines[0]).toContain('Floors 3 through 5')
    expect(DIALOGUE.dlg_kessler_after.lines[0]).not.toContain('unmapped')
  })

  it('lets the pipeline board inspect its own line', () => {
    let s: OfficeState = { ...start(), floorId: 'floor_04' }
    s = dispatchOfficeAction(at(s, 13, 2, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_pipeline_board}`,
    })
    expect(s.overlay?.kind === 'dialogue' && s.overlay.nodeId).not.toContain(
      POI_INSPECT.poi_leavebehind,
    )
    s = dispatchOfficeAction(at({ ...s, overlay: null, overlayQueue: [] }, 19, 5, 'n'), {
      type: 'INTERACT',
    }).state
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_leavebehind}`,
    })
  })

  it('makes the shared S cabinet a real inspect on Floors 3–5', () => {
    let s: OfficeState = { ...start(), floorId: 'floor_03' }
    s = dispatchOfficeAction(at(s, 3, 12, 'n'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_supply_cabinet_upper}`,
    })
    expect(s.firedTriggers).toContain('poi_supply_cabinet_upper:opened')
  })

  it('stocks Floors 2–5 with the upper vending SKUs without touching Floor 1', () => {
    const fresh = start()
    expect(fresh.vendingStock.floor_01).toEqual(['espresso', 'espresso', 'side_hustle'])
    expect(fresh.vendingStock.floor_02).toEqual(OFFICE_VENDING_STOCK_UPPER)
    let s = dispatchOfficeAction(at({ ...fresh, floorId: 'floor_02' }, 13, 12, 'e'), {
      type: 'INTERACT',
    }).state
    expect(s.screen).toBe('vending')
    expect(s.run.shopStock).toEqual(OFFICE_VENDING_STOCK_UPPER)
    s = dispatchOfficeAction(s, { type: 'CLOSE_OVERLAY' }).state
    expect(s.screen).toBe('overworld')
    expect(s.vendingStock.floor_02).toEqual(OFFICE_VENDING_STOCK_UPPER)
    s = dispatchOfficeAction(at({ ...s, floorId: 'floor_01' }, 21, 9, 'e'), {
      type: 'INTERACT',
    }).state
    expect(s.run.shopStock).toEqual(['espresso', 'espresso', 'side_hustle'])
  })

  it('marks a floor visited on elevator arrival so a peek-and-bounce keeps the pin', () => {
    let s: OfficeState = {
      ...start(),
      keyItems: { key_access_badge: 1, key_employee_badge: 1 },
      flags: ['flag_preview_complete', 'flag_visited_f2', 'flag_floor2_complete'],
    }
    s = dispatchOfficeAction(s, { type: 'RIDE_ELEVATOR', to: 'floor_05' }).state
    s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
    expect(s.floorId).toBe('floor_05')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
    expect(s.flags).toContain('flag_visited_f5')
    expect(s.firedTriggers.some((t) => t.startsWith('trg_first_step_f5'))).toBe(false)
    expect(currentObjective(s).text).toBe('Talk to Marlowe')

    s = dispatchOfficeAction(
      { ...s, overlay: null, overlayQueue: [], player: { x: 3, y: 2, facing: 'n' } },
      { type: 'RIDE_ELEVATOR', to: 'floor_01' },
    ).state
    s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
    expect(s.floorId).toBe('floor_01')
    expect(currentObjective(s)).toMatchObject({
      text: 'Take the elevator to Floor 5',
      destFloor: 'floor_05',
    })
    expect(destChip(s).label).toBe('▲ → FLOOR 5')
  })

  it('crops intern / vp / boss and Floor 3–5 stand-ins to a real headshot focal', () => {
    const missing = headshotFocal('no-such-sprite')
    expect(headshotFocal('intern')).not.toEqual(missing)
    expect(headshotFocal('vp')).not.toEqual(missing)
    expect(headshotFocal('boss')).not.toEqual(missing)
    expect(headshotFocal('reyes')).toEqual(headshotFocal('intern'))
    expect(headshotFocal('quincy')).toEqual(headshotFocal('vp'))
    expect(headshotFocal('caldwell')).toEqual(headshotFocal('boss'))
    expect(headshotFocal('sloane')).toEqual(headshotFocal('product_manager'))
    expect(headshotFocal('harper')).toEqual(headshotFocal('recruiter'))
  })

  it('shows Office combat chrome as FLOOR n/5, never Classic rank / 30', () => {
    expect(OFFICE_FLOOR_COUNT).toBe(5)
    expect(officeBattleChrome('floor_01')).toEqual({ floor: 1, floorTotal: 5 })
    expect(officeBattleChrome('floor_03')).toEqual({ floor: 3, floorTotal: 5 })
    expect(officeBattleChrome('floor_05')).toEqual({ floor: 5, floorTotal: 5 })
  })

  it('shows distinct HUD chips for visitor / employee / product / client badges', () => {
    const chips = hudKeyChips({
      ...start(),
      keyItems: {
        key_access_badge: 1,
        key_employee_badge: 1,
        key_product_badge: 1,
        key_client_badge: 1,
      },
      run: { ...start().run, inventory: [] },
    })
    expect(chips.map((c) => c.label)).toEqual([
      '🪪 Visitor',
      '🪪 Employee',
      '🪪 Product',
      '🪪 Client',
    ])
  })
})
