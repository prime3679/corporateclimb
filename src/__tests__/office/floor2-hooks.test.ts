import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { OFFICE_ENCOUNTERS } from '@/content/office'
import { resolvePlayerMove } from '@/engine'
import {
  dispatchOfficeAction,
  effectiveKit,
  newOfficeCampaign,
  recruitCoworker,
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
  for (let i = 0; i < 24 && s.overlay; i++) {
    if (s.overlay.kind === 'receipt') s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    else if (s.overlay.kind === 'stakes' || s.overlay.kind === 'recruit') break
    else s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
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

function filedReady(): OfficeState {
  let s = start()
  s = {
    ...s,
    floorId: 'floor_02',
    player: { x: 10, y: 3, facing: 'w' },
    assignments: { ...s.assignments, asg_transfer: 'filed' },
    keyItems: { ...s.keyItems, key_access_badge: 1, key_offer_letter: 1 },
    flags: [...s.flags, 'flag_visited_f2', 'flag_preview_complete'],
    firedTriggers: [...s.firedTriggers, 'trg_first_step_f2:arrival'],
  }
  return s
}

describe('Floor 2 remaining hooks', () => {
  it('runs compliance training from Teddy filed → stakes → win → offer', () => {
    let s = dispatchOfficeAction(at(filedReady(), 10, 3, 'w'), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_filed' })
    s = drain(s)
    expect(s.assignments.asg_transfer).toBe('complete')
    expect(s.overlay).toMatchObject({ kind: 'stakes', encounterId: 'enc_help_desk_intern' })
    s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
    expect(s.screen).toBe('battle')
    s = smash(s)
    expect(s.encounters.enc_help_desk_intern).toBe('won')
    expect(s.rewardsClaimed).toContain('rwd_enc_help_desk_intern')
    s = drain(s)
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_teddy_offer' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'extend' }).state
    expect(
      s.party.some((m) => m.def.kind === 'coworker' && m.def.id === 'cw_help_desk_intern'),
    ).toBe(true)
    expect(s.hired).toContain('cw_help_desk_intern')
    expect(s.keyItems.key_offer_letter).toBeUndefined()
  })

  it('opens Kessler after compliance, then the badge printer grants the employee badge', () => {
    let s = filedReady()
    s = {
      ...s,
      assignments: { ...s.assignments, asg_transfer: 'complete' },
      encounters: { ...s.encounters, enc_help_desk_intern: 'won' },
      player: { x: 3, y: 8, facing: 's' },
    }
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 's' }).state
    expect(s.player).toEqual({ x: 3, y: 9, facing: 's' })
    expect(s.overlay).toMatchObject({ kind: 'confirm', prompt: 'kessler_door' })
    s = dispatchOfficeAction(s, { type: 'DOOR_STEP_IN' }).state
    expect(s.player).toEqual({ x: 3, y: 10, facing: 's' })
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_kessler_review' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'begin' }).state
    expect(s.overlay).toMatchObject({ kind: 'stakes', encounterId: 'enc_director_review' })
    s = dispatchOfficeAction(s, { type: 'CONFIRM_STAKES' }).state
    s = smash(s)
    expect(s.encounters.enc_director_review).toBe('won')
    expect(s.keyItems.key_employee_badge).toBeUndefined()

    s = { ...s, screen: 'overworld', overlay: null, overlayQueue: [], battle: null }
    s = dispatchOfficeAction(at(s, 11, 3, 'n'), { type: 'INTERACT' }).state
    s = drain(s)
    expect(s.keyItems.key_employee_badge).toBe(1)
  })

  it('benches a coworker and rejoins them without spending a letter', () => {
    let s = start()
    s = { ...s, keyItems: { key_offer_letter: 2 } }
    s = recruitCoworker(
      { ...s, encounters: { ...s.encounters, enc_desk_challenger: 'won' } },
      'cw_desk_challenger',
    )
    s = recruitCoworker(
      { ...s, encounters: { ...s.encounters, enc_meeting_prepper: 'won' } },
      'cw_meeting_prepper',
    )
    expect(s.party).toHaveLength(3)
    const gavinHp = s.party[1].hp
    s = { ...s, party: s.party.map((m, i) => (i === 1 ? { ...m, hp: 12 } : m)) }
    s = dispatchOfficeAction(s, { type: 'DISMISS_MEMBER', slot: 1 }).state
    expect(s.party).toHaveLength(2)
    expect(s.hired).toEqual(expect.arrayContaining(['cw_desk_challenger', 'cw_meeting_prepper']))
    expect(s.bench.cw_desk_challenger?.hp).toBe(12)
    expect(s.keyItems.key_offer_letter).toBeUndefined()
    s = drain(s)
    s = dispatchOfficeAction(s, { type: 'REJOIN', coworkerId: 'cw_desk_challenger' }).state
    expect(s.party).toHaveLength(3)
    expect(
      s.party.some((m) => m.def.kind === 'coworker' && m.def.id === 'cw_desk_challenger'),
    ).toBe(true)
    const back = s.party.find((m) => m.def.kind === 'coworker' && m.def.id === 'cw_desk_challenger')
    expect(back?.hp).toBe(12)
    expect(s.keyItems.key_offer_letter).toBeUndefined()
    void gavinHp
  })

  it('transforms Kessler at half HP and leaves Classic phase-2 bit-identical', () => {
    let s = filedReady()
    s = {
      ...s,
      assignments: { ...s.assignments, asg_transfer: 'complete' },
      encounters: { ...s.encounters, enc_help_desk_intern: 'won' },
    }
    s = startEncounter(s, 'enc_director_review')
    const enemy = OFFICE_ENCOUNTERS.enc_director_review
    const member = s.encounter!.party[s.encounter!.activeIndex]
    const battle = { ...s.battle!, enemyHp: Math.floor(enemy.maxHp * 0.5) + 8 }
    const result = resolvePlayerMove(
      {
        run: { ...s.run, hp: member.hp, pp: [...member.pp] },
        battle,
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
    expect(result.battle.enemyHp).toBe(100)
    expect(result.battle.enemyStatuses).toEqual([])
    expect(result.events.some((e) => e.kind === 'phase2')).toBe(true)
    expect(result.battle.phase).toBe('player')
  })
})
