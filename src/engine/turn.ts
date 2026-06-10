// ─── TURN RESOLUTION ─────────────────────────────────────────
// A full battle round — player action, burnout ticks, phase-2
// trigger, enemy response, faints — resolves synchronously into an
// ordered BattleEvent list plus the final canonical state. The UI
// plays the events back; nothing about the outcome depends on
// animation timing anymore. All randomness flows through the injected
// rng, so seeded daily runs stay deterministic.

import type { Move, PlayerClass, StatusEffectOnMove, StatusInstance } from '../types'
import { ITEMS, STATUS_DEFS, getTypeMultiplier } from '../data'
import {
  STRUGGLE_MOVE,
  calcDamage,
  chooseEnemyMove,
  getBurnDamage,
  getClassPerkMods,
  getStatusAtkMod,
  getStatusCritBonus,
  getStatusDefMod,
} from '../battle'
import type { Rng } from './rng'
import type { BattleState, RunState } from './state'
import type { BattleEvent, Effectiveness, ViewPatch } from './events'
import { resolveEnemy, resolveNgBaseEnemy } from './enemy'

export interface TurnContext {
  run: RunState
  battle: BattleState
  /** Class with promotion stat boosts / move upgrades applied. */
  effectivePlayer: PlayerClass
}

export interface TurnResult {
  run: RunState
  battle: BattleState
  events: BattleEvent[]
}

const STRUGGLE_RECOIL = 5

/** Working copy of everything a round mutates. */
interface Working {
  playerHp: number
  enemyHp: number
  pp: number[]
  playerStatuses: StatusInstance[]
  enemyStatuses: StatusInstance[]
  enemyPhase: 1 | 2
  damageDealt: number
}

function effLabel(mult: number): Effectiveness {
  return mult > 1 ? 'super' : mult < 1 ? 'weak' : null
}

function tickStatuses(statuses: StatusInstance[]): StatusInstance[] {
  return statuses.map((s) => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter((s) => s.turnsLeft > 0)
}

/**
 * Roll a move's status effect. Always consumes one rng draw (matching
 * the original applyStatus). Returns the applied status name or null,
 * mutating the working statuses.
 */
function rollStatus(
  w: Working,
  effect: StatusEffectOnMove,
  isPlayerAttacking: boolean,
  rng: Rng,
): string | null {
  const chance = effect.chance ?? 1
  if (rng() > chance) return null
  const def = STATUS_DEFS[effect.id]
  const instance: StatusInstance = { id: effect.id, turnsLeft: def.duration }
  const applyToPlayer =
    (isPlayerAttacking && effect.target === 'self') ||
    (!isPlayerAttacking && effect.target === 'enemy')
  if (applyToPlayer) {
    w.playerStatuses = [...w.playerStatuses.filter((s) => s.id !== effect.id), instance]
  } else {
    w.enemyStatuses = [...w.enemyStatuses.filter((s) => s.id !== effect.id), instance]
  }
  return def.name
}

function statusPatch(w: Working): ViewPatch {
  return { playerStatuses: w.playerStatuses, enemyStatuses: w.enemyStatuses }
}

function finish(
  ctx: TurnContext,
  w: Working,
  events: BattleEvent[],
  phase: BattleState['phase'],
): TurnResult {
  return {
    run: {
      ...ctx.run,
      hp: w.playerHp,
      pp: w.pp,
      stats: {
        ...ctx.run.stats,
        totalDamageDealt: ctx.run.stats.totalDamageDealt + w.damageDealt,
      },
    },
    battle: {
      enemyHp: w.enemyHp,
      enemyPhase: w.enemyPhase,
      playerStatuses: w.playerStatuses,
      enemyStatuses: w.enemyStatuses,
      phase,
    },
    events,
  }
}

/** Player picks a move (or Struggle when all PP is gone). */
export function resolvePlayerMove(ctx: TurnContext, moveIdx: number, rng: Rng): TurnResult {
  const { run, battle, effectivePlayer } = ctx
  const enemy = resolveEnemy(run, battle.enemyPhase)
  const events: BattleEvent[] = []
  const w: Working = {
    playerHp: run.hp,
    enemyHp: battle.enemyHp,
    pp: [...run.pp],
    playerStatuses: battle.playerStatuses,
    enemyStatuses: battle.enemyStatuses,
    enemyPhase: battle.enemyPhase,
    damageDealt: 0,
  }
  const runWithTurn: TurnContext = {
    ...ctx,
    run: { ...run, stats: { ...run.stats, totalTurns: run.stats.totalTurns + 1 } },
  }

  const isStruggling = w.pp.every((pp) => pp <= 0)
  const move: Move = isStruggling ? STRUGGLE_MOVE : effectivePlayer.moves[moveIdx]

  if (!isStruggling) {
    w.pp[moveIdx]--
    events.push({ kind: 'spend' })
  }

  events.push({ kind: 'attack', side: 'player', moveType: move.type })

  // Accuracy
  const acc = move.acc ?? 100
  if (rng() * 100 >= acc) {
    events.push({ kind: 'miss', target: 'enemy' })
    events.push({ kind: 'log', text: `${effectivePlayer.name} used ${move.name}! But it missed!` })
    // On a miss the enemy acts without its statuses ticking (original behavior).
    return resolveEnemyTurn(runWithTurn, w, events, rng)
  }

  // Damage
  const atkMod = getStatusAtkMod(w.playerStatuses)
  const defMod = getStatusDefMod(w.enemyStatuses)
  const critBonus = getStatusCritBonus(w.playerStatuses)
  const { dmgMult, critBonus: perkCrit } = getClassPerkMods(run.classId)
  const typeResult = getTypeMultiplier(move.type, enemy.types)
  const [rawDmg, isCrit] = calcDamage(
    rng,
    effectivePlayer.atk + run.level * 2 + run.atkBuff + atkMod,
    enemy.def + defMod,
    move.dmg,
    critBonus + perkCrit,
    typeResult.mult,
  )
  const dmg = Math.round(rawDmg * dmgMult)
  w.enemyHp = Math.max(0, w.enemyHp - dmg)
  w.damageDealt += dmg

  events.push({
    kind: 'hit',
    target: 'enemy',
    amount: dmg,
    crit: isCrit,
    eff: effLabel(typeResult.mult),
    patch: { enemyHp: w.enemyHp },
  })

  let logMsg = `${effectivePlayer.name} used ${move.name}! ${dmg} damage!`
  if (isCrit) logMsg += ' Critical hit!'
  if (typeResult.label) logMsg += ` ${typeResult.label}`

  if (isStruggling) {
    w.playerHp = Math.max(0, w.playerHp - STRUGGLE_RECOIL)
    events.push({ kind: 'recoil', amount: STRUGGLE_RECOIL, patch: { playerHp: w.playerHp } })
    logMsg += ` Recoil: -${STRUGGLE_RECOIL} HP!`
  }

  if (move.status) {
    const applied = rollStatus(w, move.status, true, rng)
    if (applied) {
      const target = move.status.target === 'self' ? effectivePlayer.name : enemy.name
      events.push({
        kind: 'status',
        target: move.status.target === 'self' ? 'player' : 'enemy',
        statusName: applied,
        patch: statusPatch(w),
      })
      logMsg += ` ${target} is ${applied}!`
    }
  }

  if (move.heal) {
    const healAmt = Math.min(move.heal + run.level, effectivePlayer.maxHp - w.playerHp)
    if (healAmt > 0) {
      w.playerHp = Math.min(effectivePlayer.maxHp, w.playerHp + healAmt)
      events.push({
        kind: 'heal',
        target: 'player',
        amount: healAmt,
        patch: { playerHp: w.playerHp },
      })
      logMsg += ` Recovered ${healAmt} HP!`
    }
  }

  events.push({ kind: 'log', text: logMsg })

  // Phase-2 transition: threshold measured against the NG+-scaled base
  // enemy (daily HP multipliers don't move the trigger point).
  const ngBase = resolveNgBaseEnemy(run)
  if (w.enemyPhase === 1 && ngBase.phase2 && w.enemyHp > 0 && w.enemyHp <= ngBase.maxHp * 0.5) {
    const phase2 = resolveEnemy(run, 2)
    w.enemyPhase = 2
    w.enemyHp = phase2.maxHp
    w.enemyStatuses = []
    events.push({ kind: 'pause', ms: 600 })
    events.push({ kind: 'log', text: `💥 ${ngBase.phase2.taunt}` })
    events.push({ kind: 'pause', ms: 500 })
    events.push({ kind: 'log', text: '⚠️ PHASE 2' })
    events.push({
      kind: 'phase2',
      patch: { enemyPhase: 2, enemyHp: w.enemyHp, enemyStatuses: w.enemyStatuses },
    })
    events.push({ kind: 'pause', ms: 800 })
    // The enemy spends its turn transforming.
    return finish(runWithTurn, w, events, 'player')
  }

  if (w.enemyHp <= 0) {
    events.push({ kind: 'faint', side: 'enemy' })
    return finish(runWithTurn, w, events, 'won')
  }

  // End-of-turn burnout on the enemy — can finish it off.
  const enemyBurn = getBurnDamage(w.enemyStatuses)
  if (enemyBurn > 0) {
    w.enemyHp = Math.max(0, w.enemyHp - enemyBurn)
    events.push({ kind: 'burn', target: 'enemy', amount: enemyBurn, patch: { enemyHp: w.enemyHp } })
    events.push({ kind: 'log', text: `${enemy.name} is burned out! -${enemyBurn} HP!` })
    if (w.enemyHp <= 0) {
      events.push({ kind: 'faint', side: 'enemy' })
      return finish(runWithTurn, w, events, 'won')
    }
  }

  w.enemyStatuses = tickStatuses(w.enemyStatuses)
  events.push({ kind: 'tick', patch: statusPatch(w) })

  return resolveEnemyTurn(runWithTurn, w, events, rng)
}

/** Use an inventory item (consumes the turn; the enemy then acts). */
export function resolveItemUse(ctx: TurnContext, itemIdx: number, rng: Rng): TurnResult {
  const { run, effectivePlayer, battle } = ctx
  const itemId = run.inventory[itemIdx]
  const item = ITEMS[itemId]
  const events: BattleEvent[] = []
  const w: Working = {
    playerHp: run.hp,
    enemyHp: battle.enemyHp,
    pp: [...run.pp],
    playerStatuses: battle.playerStatuses,
    enemyStatuses: battle.enemyStatuses,
    enemyPhase: battle.enemyPhase,
    damageDealt: 0,
  }
  let { atkBuff, defBuff } = run

  let logMsg = `Used ${item.name}!`
  events.push({ kind: 'item', itemName: item.name })

  if (item.effect.hp) {
    const healAmt = Math.min(item.effect.hp, effectivePlayer.maxHp - w.playerHp)
    if (healAmt > 0) {
      w.playerHp = Math.min(effectivePlayer.maxHp, w.playerHp + healAmt)
      events.push({
        kind: 'heal',
        target: 'player',
        amount: healAmt,
        patch: { playerHp: w.playerHp },
      })
      logMsg += ` Restored ${healAmt} HP!`
    }
  }
  if (item.effect.atk) {
    atkBuff += item.effect.atk
    logMsg += ` ATK +${item.effect.atk}!`
  }
  if (item.effect.def) {
    defBuff += item.effect.def
    logMsg += ` DEF +${item.effect.def}!`
  }
  if (item.effect.ppRestore) {
    const baseMoves = effectivePlayer.moves
    w.pp = w.pp.map((v, i) => Math.min(baseMoves[i].pp, v + item.effect.ppRestore!))
    events.push({ kind: 'spend' })
    logMsg += ' PP restored!'
  }
  if (item.effect.status) {
    const applied = rollStatus(
      w,
      { id: item.effect.status.id, target: 'self', chance: 1 },
      true,
      rng,
    )
    if (applied) {
      events.push({ kind: 'status', target: 'player', statusName: applied, patch: statusPatch(w) })
      logMsg += ` ${applied}!`
    }
  }

  events.push({ kind: 'log', text: logMsg })
  events.push({ kind: 'pause', ms: 600 })

  const ctxWithItem: TurnContext = {
    ...ctx,
    run: {
      ...run,
      atkBuff,
      defBuff,
      inventory: run.inventory.filter((_, i) => i !== itemIdx),
      stats: { ...run.stats, itemsUsed: run.stats.itemsUsed + 1 },
    },
  }
  return resolveEnemyTurn(ctxWithItem, w, events, rng)
}

/** The enemy's half of the round. Appends to `events` and finishes the result. */
function resolveEnemyTurn(
  ctx: TurnContext,
  w: Working,
  events: BattleEvent[],
  rng: Rng,
): TurnResult {
  const { run, effectivePlayer } = ctx
  const enemy = resolveEnemy(run, w.enemyPhase)

  // Burnout chips the player before the enemy acts — and can end the run.
  const playerBurn = getBurnDamage(w.playerStatuses)
  if (playerBurn > 0) {
    w.playerHp = Math.max(0, w.playerHp - playerBurn)
    events.push({
      kind: 'burn',
      target: 'player',
      amount: playerBurn,
      patch: { playerHp: w.playerHp },
    })
    events.push({ kind: 'log', text: `${effectivePlayer.name} is burned out! -${playerBurn} HP!` })
    if (w.playerHp <= 0) {
      events.push({ kind: 'faint', side: 'player' })
      return finish(ctx, w, events, 'lost')
    }
  }

  const eMove = chooseEnemyMove(
    rng,
    enemy.moves,
    w.enemyHp / enemy.maxHp,
    w.playerHp / effectivePlayer.maxHp,
    w.playerStatuses.length,
  )

  events.push({ kind: 'attack', side: 'enemy', moveType: eMove.type || 'normal' })

  const acc = eMove.acc ?? 100
  if (rng() * 100 >= acc) {
    events.push({ kind: 'miss', target: 'player' })
    events.push({ kind: 'log', text: `${enemy.name} used ${eMove.name}! But it missed!` })
    w.playerStatuses = tickStatuses(w.playerStatuses)
    events.push({ kind: 'tick', patch: statusPatch(w) })
    return finish(ctx, w, events, 'player')
  }

  const enemyAtkMod = getStatusAtkMod(w.enemyStatuses)
  const playerDefMod = getStatusDefMod(w.playerStatuses)
  const enemyCritBonus = getStatusCritBonus(w.enemyStatuses)
  const typeResult = getTypeMultiplier(eMove.type || 'normal', effectivePlayer.types)
  const dailyDefMult = run.mode.kind === 'daily' ? run.mode.modifier.playerDefMult : 1
  const [dmg, isCrit] = calcDamage(
    rng,
    enemy.atk + enemyAtkMod,
    Math.round((effectivePlayer.def + run.level + run.defBuff + playerDefMod) * dailyDefMult),
    eMove.dmg,
    enemyCritBonus,
    typeResult.mult,
  )

  let logMsg = `${enemy.name} used ${eMove.name}! ${dmg} damage!`
  if (isCrit) logMsg += ' Critical hit!'
  if (typeResult.label) logMsg += ` ${typeResult.label}`

  if (eMove.status) {
    const applied = rollStatus(w, eMove.status, false, rng)
    if (applied) {
      const target = eMove.status.target === 'self' ? enemy.name : effectivePlayer.name
      events.push({
        kind: 'status',
        target: eMove.status.target === 'self' ? 'enemy' : 'player',
        statusName: applied,
        patch: statusPatch(w),
      })
      logMsg += ` ${target} is ${applied}!`
    }
  }

  w.playerHp = Math.max(0, w.playerHp - dmg)
  events.push({
    kind: 'hit',
    target: 'player',
    amount: dmg,
    crit: isCrit,
    eff: effLabel(typeResult.mult),
    patch: { playerHp: w.playerHp },
  })

  if (eMove.heal) {
    w.enemyHp = Math.min(enemy.maxHp, w.enemyHp + eMove.heal)
    events.push({
      kind: 'heal',
      target: 'enemy',
      amount: eMove.heal,
      patch: { enemyHp: w.enemyHp },
    })
    logMsg += ` Recovered ${eMove.heal} HP!`
  }

  events.push({ kind: 'log', text: logMsg })

  w.playerStatuses = tickStatuses(w.playerStatuses)
  events.push({ kind: 'tick', patch: statusPatch(w) })

  if (w.playerHp <= 0) {
    events.push({ kind: 'pause', ms: 400 })
    events.push({ kind: 'faint', side: 'player' })
    return finish(ctx, w, events, 'lost')
  }

  return finish(ctx, w, events, 'player')
}
