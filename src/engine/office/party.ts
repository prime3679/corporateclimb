import { PLAYER_CLASSES } from '@/data'
import { applyPostBattlePerk } from '../run'
import { getEffectivePlayer } from '../player'
import { COWORKER_KITS, PARTY_MAX, type CoworkerId } from '@/content/office'
import { classById, kitFor, type OfficeState, type PartyMember, withKey } from './state'

export function effectiveKit(state: OfficeState, member: PartyMember) {
  const base = kitFor(member)
  if (member.def.kind === 'lead') {
    return getEffectivePlayer(
      base,
      state.run.classId,
      state.run.floor,
      state.run.perks,
      state.run.relics,
    )
  }
  return getEffectivePlayer(base, 'coworker', 0, state.run.perks, state.run.relics)
}

export function maxHpFor(state: OfficeState, member: PartyMember): number {
  return effectiveKit(state, member).maxHp
}

export function restoreParty(state: OfficeState): OfficeState {
  const party = state.party.map((m) => {
    const kit = kitFor(m)
    const max = maxHpFor(state, m)
    return { ...m, hp: max, pp: kit.moves.map((mv) => mv.pp) }
  })
  return {
    ...state,
    party,
    run: { ...state.run, hp: party[0].hp, pp: party[0].pp, atkBuff: 0, defBuff: 0 },
  }
}

export function markHired(state: OfficeState, id: CoworkerId): OfficeState {
  if ((state.hired ?? []).includes(id)) return state
  return { ...state, hired: [...(state.hired ?? []), id] }
}

export function recruitCoworker(state: OfficeState, id: CoworkerId): OfficeState {
  if (state.party.length >= PARTY_MAX) return state
  if (state.party.some((m) => m.def.kind === 'coworker' && m.def.id === id)) return state
  if ((state.keyItems.key_offer_letter ?? 0) < 1) return state
  const kit = COWORKER_KITS[id]
  const slot = `party_slot_${state.party.length}` as PartyMember['slot']
  const member: PartyMember = {
    slot,
    def: { kind: 'coworker', id },
    hp: kit.maxHp,
    pp: kit.moves.map((m) => m.pp),
  }
  const hired = markHired(state, id)
  return withKey({ ...hired, party: [...hired.party, member] }, 'key_offer_letter', -1)
}

export function dismissCoworker(state: OfficeState, slot: number): OfficeState {
  if (slot <= 0 || slot >= state.party.length) return state
  const member = state.party[slot]
  if (member.def.kind !== 'coworker') return state
  const id = member.def.id
  const bench = { ...state.bench, [id]: { hp: member.hp, pp: [...member.pp] } }
  const party = state.party
    .filter((_, i) => i !== slot)
    .map((m, i) => ({ ...m, slot: `party_slot_${i}` as PartyMember['slot'] }))
  return markHired({ ...state, party, bench }, id)
}

export function rejoinCoworker(state: OfficeState, id: CoworkerId): OfficeState {
  if (state.party.length >= PARTY_MAX) return state
  if (state.party.some((m) => m.def.kind === 'coworker' && m.def.id === id)) return state
  if (!(state.hired ?? []).includes(id)) return state
  const kit = COWORKER_KITS[id]
  const stored = state.bench[id]
  const slot = `party_slot_${state.party.length}` as PartyMember['slot']
  const member: PartyMember = {
    slot,
    def: { kind: 'coworker', id },
    hp: stored?.hp ?? kit.maxHp,
    pp: stored?.pp ? [...stored.pp] : kit.moves.map((m) => m.pp),
  }
  const bench = { ...state.bench }
  delete bench[id]
  return { ...state, party: [...state.party, member], bench }
}

export function applyOfficeXp(state: OfficeState, xp: number): OfficeState {
  let run = { ...state.run, xp: state.run.xp + xp }
  let party = state.party
  let leveled = false
  while (run.xp >= run.xpToNext) {
    run = {
      ...run,
      level: run.level + 1,
      xp: run.xp - run.xpToNext,
      xpToNext: run.xpToNext + 25,
    }
    leveled = true
  }
  if (leveled) {
    party = party.map((m) => {
      if (m.hp <= 0) return m
      const max = maxHpFor({ ...state, run }, m)
      return { ...m, hp: Math.min(max, m.hp + 20) }
    })
  }
  return { ...state, run, party }
}

export function applyActivePostBattleHeal(state: OfficeState, activeIndex: number): OfficeState {
  const member = state.party[activeIndex]
  if (!member || member.hp <= 0) return state
  const kit = effectiveKit(state, member)
  const healed = applyPostBattlePerk({ ...state.run, hp: member.hp }, kit.maxHp)
  const party = state.party.map((m, i) => (i === activeIndex ? { ...m, hp: healed.hp } : m))
  return { ...state, party, run: { ...healed, hp: party[0].hp, pp: party[0].pp } }
}

export function leadClassName(classId: string): string {
  return PLAYER_CLASSES.find((c) => c.id === classId)?.name ?? classById(classId).name
}
