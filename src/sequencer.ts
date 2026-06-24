// ─── BATTLE SEQUENCER ────────────────────────────────────────
// Plays a resolved turn's BattleEvent list against the displayed
// battle view: one timing/sfx/animation table instead of nested
// setTimeout chains. Playback is cancellable (restart/unmount can't
// fire callbacks into a new run) and skippable (tap fast-forwards by
// applying the remaining patches without the delays).

import { SFX } from './sfx'
import { TYPE_COLORS } from './data'
import type { BattleEvent, Side } from './engine'
import type { AnimState, DamagePopup, StatusInstance } from './types'

export interface BattleView {
  playerHp: number
  enemyHp: number
  playerStatuses: StatusInstance[]
  enemyStatuses: StatusInstance[]
  enemyPhase: 1 | 2
  log: string[]
  playerAnim: AnimState
  enemyAnim: AnimState
  popups: DamagePopup[]
  shake: boolean
  typeFlash: string | null
}

export function initialBattleView(playerHp: number, enemyHp: number, intro: string): BattleView {
  return {
    playerHp,
    enemyHp,
    playerStatuses: [],
    enemyStatuses: [],
    enemyPhase: 1,
    log: [intro],
    playerAnim: 'idle',
    enemyAnim: 'idle',
    popups: [],
    shake: false,
    typeFlash: null,
  }
}

/** Beat length per event kind (ms). The one place battle pacing lives. */
const DELAY: Record<BattleEvent['kind'], number> = {
  attack: 350,
  miss: 500,
  hit: 500,
  heal: 400,
  recoil: 300,
  burn: 400,
  status: 250,
  tick: 0,
  spend: 0,
  item: 350,
  phase2: 800,
  faint: 1000,
  log: 250,
  pause: 0, // uses the event's own ms
}

const POPUP_LIFETIME = 1100

let popupId = 0

function makePopup(
  value: number,
  target: Side,
  opts: { crit?: boolean; heal?: boolean; label?: string; labelColor?: string } = {},
): DamagePopup {
  const isEnemy = target === 'enemy'
  return {
    id: popupId++,
    value,
    x: isEnemy ? 200 + Math.random() * 60 : 60 + Math.random() * 60,
    y: isEnemy ? 70 + Math.random() * 30 : 130 + Math.random() * 30,
    isCrit: opts.crit ?? false,
    isHeal: opts.heal ?? false,
    label: opts.label,
    labelColor: opts.labelColor,
  }
}

type ViewUpdater = (mutate: (view: BattleView) => BattleView) => void

export class Sequencer {
  private token = 0
  private skipFlag = false

  constructor(private update: ViewUpdater) {}

  /** Invalidate any in-flight playback (restart, unmount). */
  cancel() {
    this.token++
  }

  /** Fast-forward the current playback. */
  skip() {
    this.skipFlag = true
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.skipFlag ? 0 : ms))
  }

  private animKey(side: Side): 'playerAnim' | 'enemyAnim' {
    return side === 'player' ? 'playerAnim' : 'enemyAnim'
  }

  private addPopup(popup: DamagePopup) {
    this.update((v) => ({ ...v, popups: [...v.popups, popup] }))
    const token = this.token
    setTimeout(() => {
      if (token !== this.token) return
      this.update((v) => ({ ...v, popups: v.popups.filter((p) => p.id !== popup.id) }))
    }, POPUP_LIFETIME)
  }

  /** Presentation for one event: sfx, animation, popups, log, patch. */
  private step(e: BattleEvent) {
    const patch = e.patch ?? {}
    switch (e.kind) {
      case 'attack':
        SFX.attackSwing()
        this.update((v) => ({
          ...v,
          ...patch,
          [this.animKey(e.side)]: 'attacking',
          // Only the player's moves flash the screen with their type color.
          typeFlash: e.side === 'player' ? TYPE_COLORS[e.moveType] || null : v.typeFlash,
        }))
        break
      case 'miss':
        SFX.miss()
        this.addPopup(makePopup(0, e.target, { label: 'MISS!', labelColor: '#78909C' }))
        this.update((v) => ({ ...v, ...patch }))
        break
      case 'hit': {
        if (e.eff === 'super') SFX.superEffective()
        else if (e.eff === 'weak') SFX.notEffective()
        else if (e.crit) SFX.critHit()
        else SFX.hit()
        const label =
          e.eff === 'super'
            ? 'Super effective!'
            : e.eff === 'weak'
              ? 'Not effective...'
              : e.target === 'enemy'
                ? 'NICE HIT'
                : undefined
        const labelColor =
          e.eff === 'super'
            ? '#4CAF50'
            : e.eff === 'weak'
              ? '#FF9800'
              : e.target === 'enemy'
                ? '#FFD54F'
                : undefined
        this.addPopup(makePopup(e.amount, e.target, { crit: e.crit, label, labelColor }))
        this.update((v) => ({ ...v, ...patch, [this.animKey(e.target)]: 'hit', shake: true }))
        break
      }
      case 'heal':
        if (e.target === 'player') SFX.heal()
        this.addPopup(makePopup(e.amount, e.target, { heal: true }))
        this.update((v) => ({ ...v, ...patch }))
        break
      case 'recoil':
        this.addPopup(makePopup(e.amount, 'player'))
        this.update((v) => ({ ...v, ...patch }))
        break
      case 'burn':
        this.addPopup(makePopup(e.amount, e.target))
        this.update((v) => ({ ...v, ...patch }))
        break
      case 'item':
        SFX.heal()
        this.update((v) => ({ ...v, ...patch }))
        break
      case 'phase2':
        SFX.bossIntro()
        this.update((v) => ({ ...v, ...patch, shake: true }))
        break
      case 'faint':
        SFX.faint()
        this.update((v) => ({ ...v, ...patch, [this.animKey(e.side)]: 'faint' }))
        break
      case 'log':
        this.update((v) => ({ ...v, ...patch, log: [...v.log, e.text] }))
        break
      default:
        // status / tick / spend / pause: patch only
        this.update((v) => ({ ...v, ...patch }))
    }
  }

  /** Settle transient presentation (animations, shake, flash) after a beat. */
  private settle(e: BattleEvent) {
    switch (e.kind) {
      case 'attack':
        this.update((v) => ({ ...v, [this.animKey(e.side)]: 'idle', typeFlash: null }))
        break
      case 'hit':
        this.update((v) => ({ ...v, [this.animKey(e.target)]: 'idle', shake: false }))
        break
      case 'phase2':
        this.update((v) => ({ ...v, shake: false }))
        break
    }
  }

  /**
   * Play events in order. Resolves true when the sequence ran to
   * completion, false if it was cancelled (caller must not continue
   * the flow).
   */
  async play(events: BattleEvent[]): Promise<boolean> {
    const token = ++this.token
    this.skipFlag = false
    for (const e of events) {
      this.step(e)
      await this.wait(e.kind === 'pause' ? e.ms : DELAY[e.kind])
      if (this.token !== token) return false
      this.settle(e)
    }
    return true
  }
}
