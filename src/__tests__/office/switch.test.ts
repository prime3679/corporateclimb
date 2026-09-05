import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { newBattle, resolvePartySwitch, resolvePlayerMove } from '@/engine'
import { effectiveKit, newOfficeCampaign, recruitCoworker, type OfficeState } from '@/engine/office'
import { OFFICE_ENCOUNTERS } from '@/content/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function partyState(): OfficeState {
  let s = newOfficeCampaign(PM)
  s = {
    ...s,
    overlay: null,
    overlayQueue: [],
    keyItems: { key_offer_letter: 1 },
    encounters: { ...s.encounters, enc_desk_challenger: 'won' },
  }
  return recruitCoworker(s, 'cw_desk_challenger')
}

describe('office party switch', () => {
  it('voluntary switch spends the turn — the enemy acts', () => {
    const s = partyState()
    const enemy = OFFICE_ENCOUNTERS.enc_supervisor_1on1
    const incoming = s.party[1]
    const ctx = {
      run: { ...s.run, hp: incoming.hp, pp: [...incoming.pp] },
      battle: { ...newBattle(enemy), enemyHp: 40 },
      effectivePlayer: effectiveKit(s, incoming),
      encounterEnemy: enemy,
      partyHp: [s.party[0].hp, incoming.hp],
      activeIndex: 1,
      switchSlots: { out: s.party[0].slot, in: incoming.slot },
    }
    const result = resolvePartySwitch(ctx, () => 0.01, false)
    expect(result.events.some((e) => e.kind === 'switch_out')).toBe(true)
    expect(result.events.some((e) => e.kind === 'switch_in')).toBe(true)
    expect(result.events.some((e) => e.kind === 'attack' && e.side === 'enemy')).toBe(true)
    expect(result.battle.phase).toBe('player')
  })

  it('forced switch does not give the enemy a turn', () => {
    const s = partyState()
    const enemy = OFFICE_ENCOUNTERS.enc_supervisor_1on1
    const incoming = s.party[1]
    const ctx = {
      run: { ...s.run, hp: incoming.hp, pp: [...incoming.pp] },
      battle: newBattle(enemy),
      effectivePlayer: effectiveKit(s, incoming),
      encounterEnemy: enemy,
      partyHp: [0, incoming.hp],
      activeIndex: 1,
      switchSlots: { out: s.party[0].slot, in: incoming.slot },
    }
    const result = resolvePartySwitch(ctx, () => 0.01, true)
    expect(result.events.some((e) => e.kind === 'attack' && e.side === 'enemy')).toBe(false)
    expect(result.battle.phase).toBe('player')
    expect(result.battle.playerStatuses).toEqual([])
  })

  it('a KO with a standing bench becomes switch_required, not lost', () => {
    const s = partyState()
    const enemy = OFFICE_ENCOUNTERS.enc_desk_challenger
    const lead = s.party[0]
    const ctx = {
      run: { ...s.run, hp: 1, pp: [...lead.pp] },
      battle: { ...newBattle(enemy), enemyHp: 70 },
      effectivePlayer: effectiveKit(s, lead),
      encounterEnemy: enemy,
      partyHp: [1, s.party[1].hp],
      activeIndex: 0,
      activeSlot: lead.slot,
    }
    const result = resolvePlayerMove(ctx, 0, () => 0.99)
    expect(result.battle.phase).toBe('switch_required')
    expect(result.events.some((e) => e.kind === 'member_faint')).toBe(true)
  })

  it('a KO with no bench still loses — Classic path stays lost', () => {
    const s = newOfficeCampaign(PM)
    const enemy = OFFICE_ENCOUNTERS.enc_desk_challenger
    const lead = s.party[0]
    const ctx = {
      run: { ...s.run, hp: 1, pp: [...lead.pp] },
      battle: newBattle(enemy),
      effectivePlayer: effectiveKit(s, lead),
      encounterEnemy: enemy,
    }
    const result = resolvePlayerMove(ctx, 0, () => 0.99)
    expect(result.battle.phase).toBe('lost')
  })
})
