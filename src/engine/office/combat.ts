import { newBattle } from '../run'
import { battleIntroLine } from '../enemy'
import { resolveItemUse, resolvePartySwitch, resolvePlayerMove, type TurnContext } from '../turn'
import type { Rng } from '../rng'
import type { BattleEvent } from '../events'
import { ENCOUNTER_RECEIPT, OFFICE_ENCOUNTERS, type EncounterId } from '@/content/office'
import { defeatRespawnForFloor } from '@/content/office'
import { applyActivePostBattleHeal, applyOfficeXp, effectiveKit, restoreParty } from './party'
import {
  enqueueOverlays,
  firstStandingIndex,
  pushOverlay,
  standingBench,
  type EncounterContext,
  type OfficeState,
  type Overlay,
} from './state'

export function buildEncounter(state: OfficeState, encounterId: EncounterId): EncounterContext {
  const def = OFFICE_ENCOUNTERS[encounterId]
  const activeIndex = firstStandingIndex(state.party)
  return {
    encounterId,
    enemy: def,
    boss: def.boss,
    declinable: def.declinable,
    rewards: { xp: def.xp, options: def.options },
    party: state.party.map((m) => ({ ...m, pp: [...m.pp] })),
    activeIndex,
  }
}

export function startEncounter(state: OfficeState, encounterId: EncounterId): OfficeState {
  if (state.encounters[encounterId] === 'won') return state
  if (state.party.every((m) => m.hp <= 0)) {
    return pushOverlay(state, { kind: 'confirm', prompt: 'take_five' })
  }
  const encounter = buildEncounter(state, encounterId)
  const battle = newBattle(encounter.enemy, state.run.perks)
  const active = encounter.party[encounter.activeIndex]
  return {
    ...state,
    screen: 'battle',
    overlay: null,
    overlayQueue: [],
    encounter,
    battle,
    benchOpen: false,
    run: { ...state.run, hp: active.hp, pp: [...active.pp] },
  }
}

export function encounterIntro(encounterId: EncounterId): string {
  return battleIntroLine(OFFICE_ENCOUNTERS[encounterId])
}

function turnCtx(state: OfficeState): TurnContext {
  const enc = state.encounter!
  const member = enc.party[enc.activeIndex]
  return {
    run: { ...state.run, hp: member.hp, pp: [...member.pp] },
    battle: state.battle!,
    effectivePlayer: effectiveKit(state, member),
    encounterEnemy: enc.enemy,
    partyHp: enc.party.map((m, i) => (i === enc.activeIndex ? member.hp : m.hp)),
    activeIndex: enc.activeIndex,
    activeSlot: member.slot,
  }
}

function writeBack(state: OfficeState, runHp: number, runPp: number[]): OfficeState {
  const enc = state.encounter!
  const party = enc.party.map((m, i) =>
    i === enc.activeIndex ? { ...m, hp: runHp, pp: [...runPp] } : m,
  )
  return {
    ...state,
    encounter: { ...enc, party },
    party: state.party.map((m, i) => (party[i] ? { ...party[i] } : m)),
    run: { ...state.run, hp: party[0]?.hp ?? runHp, pp: party[0]?.pp ?? runPp },
  }
}

export function applyOfficeTurn(
  state: OfficeState,
  kind: 'move' | 'item',
  idx: number,
  rng: Rng,
): { state: OfficeState; events: BattleEvent[] } {
  if (!state.encounter || !state.battle) return { state, events: [] }
  const ctx = turnCtx(state)
  const result = kind === 'move' ? resolvePlayerMove(ctx, idx, rng) : resolveItemUse(ctx, idx, rng)
  let next = writeBack(
    {
      ...state,
      run: result.run,
      battle: result.battle,
    },
    result.run.hp,
    result.run.pp,
  )
  if (result.battle.phase === 'won') {
    return { state: finishWin(next), events: result.events }
  }
  if (result.battle.phase === 'lost') {
    return { state: finishWipe(next), events: result.events }
  }
  if (result.battle.phase === 'switch_required') {
    next = { ...next, benchOpen: true }
  }
  return { state: next, events: result.events }
}

export function applyOfficeSwitch(
  state: OfficeState,
  to: number,
  rng: Rng,
  forced: boolean,
): { state: OfficeState; events: BattleEvent[] } {
  if (!state.encounter || !state.battle) return { state, events: [] }
  const enc = state.encounter
  if (to === enc.activeIndex || !enc.party[to] || enc.party[to].hp <= 0)
    return { state, events: [] }
  const incoming = enc.party[to]
  const outgoing = enc.party[enc.activeIndex]
  const projected: OfficeState = {
    ...state,
    encounter: { ...enc, activeIndex: to },
    run: { ...state.run, hp: incoming.hp, pp: [...incoming.pp] },
    battle: { ...state.battle, playerStatuses: [], phase: 'player' },
    stats: { ...state.stats, switches: state.stats.switches + 1 },
    benchOpen: false,
  }
  const ctx = {
    ...turnCtx(projected),
    switchSlots: { out: outgoing.slot, in: incoming.slot },
  }
  const result = resolvePartySwitch(ctx, rng, forced)
  let next = writeBack(
    { ...projected, run: result.run, battle: result.battle },
    result.run.hp,
    result.run.pp,
  )
  if (result.battle.phase === 'lost') return { state: finishWipe(next), events: result.events }
  if (result.battle.phase === 'won') return { state: finishWin(next), events: result.events }
  if (result.battle.phase === 'switch_required') next = { ...next, benchOpen: true }
  return { state: next, events: result.events }
}

function finishWin(state: OfficeState): OfficeState {
  const enc = state.encounter!
  const def = OFFICE_ENCOUNTERS[enc.encounterId]
  const rewardId = `rwd_${enc.encounterId}`
  let next: OfficeState = {
    ...state,
    screen: 'overworld',
    battle: null,
    encounter: null,
    benchOpen: false,
    lastLossEncounter: null,
    encounters: { ...state.encounters, [enc.encounterId]: 'won' },
    stats: { ...state.stats, battlesWon: state.stats.battlesWon + 1 },
    party: enc.party,
  }
  if (!next.rewardsClaimed.includes(rewardId)) {
    next = applyOfficeXp(next, def.xp)
    next = {
      ...next,
      run: { ...next.run, stockOptions: next.run.stockOptions + def.options },
      rewardsClaimed: [...next.rewardsClaimed, rewardId],
    }
  }
  next = applyActivePostBattleHeal(next, enc.activeIndex)
  if (enc.encounterId === 'enc_supervisor_1on1') {
    next = { ...next, keyItems: { ...next.keyItems, key_access_badge: 1 } }
  }
  const follow: Overlay[] = [{ kind: 'receipt', receiptId: ENCOUNTER_RECEIPT[enc.encounterId] }]
  return enqueueOverlays(next, follow)
}

function finishWipe(state: OfficeState): OfficeState {
  const enc = state.encounter!
  const respawn = defeatRespawnForFloor(state.floorId)
  return {
    ...restoreParty({
      ...state,
      screen: 'overworld',
      battle: null,
      encounter: null,
      benchOpen: false,
      lastLossEncounter: enc.encounterId,
      player: respawn,
      stats: { ...state.stats, losses: state.stats.losses + 1 },
    }),
    overlay: { kind: 'interstitial', encounterId: enc.encounterId },
    overlayQueue: [{ kind: 'toast', text: "You take five. Everyone's back." }],
  }
}

export function shouldCoachSwitch(state: OfficeState): boolean {
  if (state.flags.includes('flag_switch_coached')) return false
  if (!state.encounter || !state.battle || state.battle.phase !== 'player') return false
  if (state.encounter.party.filter((m) => m.hp > 0).length < 2) return false
  const active = state.encounter.party[state.encounter.activeIndex]
  const max = effectiveKit(state, active).maxHp
  return standingBench(state.encounter.party, state.encounter.activeIndex) && active.hp < max * 0.5
}
