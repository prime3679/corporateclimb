import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CURRENCY_ICON, PERKS } from '@/data'
import { STRUGGLE_MOVE } from '@/battle'
import { Sequencer, initialBattleView, type BattleView } from '@/sequencer'
import BattleScreen from './BattleScreen'
import PromotionScreen from './PromotionScreen'
import ShopScreen from './ShopScreen'
import { Button } from '@/ui'
import {
  dispatchOfficeAction,
  effectiveKit,
  encounterIntro,
  interactTarget,
  kitFor,
  maxHpFor,
  memberName,
  currentObjective,
  destChip,
  type OfficeState,
  type PartyMember,
} from '@/engine/office'
import { GameRng } from '@/engine'
import {
  MOVE_MS,
  OFFICE_ENCOUNTERS,
  floorLabel,
  officeBattleChrome,
  type Facing,
} from '@/content/office'
import { Haptics } from '@/platform'
import { SFX } from '@/sfx'
import WorldMap from './office/WorldMap'
import PartyStrip, { hpTone } from './office/PartyStrip'
import OfficeOverlays, { CoachMark, ElevatorRide, Interstitial } from './office/overlays'
import Headshot from './office/Headshot'
import {
  ZONE_ACCENT,
  hudKeyChips,
  memberRing,
  memberSprite,
  promptText,
  promptVerb,
} from './office/cast'
import { useDeferredWallet, useOfficeFeedback } from './office/useOfficeFeedback'
import styles from './office/OfficeScreen.module.css'

const OFFICE_OLD = { floor: 0, title: 'New Hire' }
const OFFICE_NEW = { floor: 1, title: 'Cleared Probation' }

/** ACT's label becomes the verb of the faced prompt so the thumb knows first. */
function actVerb(prompt: string | null, state: OfficeState): string {
  if (state.overlay && state.overlay.kind !== 'coach') {
    if (state.overlay.kind === 'dialogue') return 'Next'
    return 'OK'
  }
  if (!prompt) return 'Act'
  return promptVerb(prompt)
}

export default function OfficeScreen({
  state,
  onChange,
  onExit,
  textMsPerChar = 17,
  reduceMotion = false,
}: {
  state: OfficeState
  onChange: (next: OfficeState) => void
  onExit: () => void
  textMsPerChar?: number
  reduceMotion?: boolean
}) {
  const [view, setView] = useState<BattleView | null>(null)
  const [busy, setBusy] = useState(false)
  const [battleMode, setBattleMode] = useState<'fight' | 'items'>('fight')
  const [sceneFx, setSceneFx] = useState<'battle-in' | 'battle-out' | null>(null)
  const busyRef = useRef(false)
  const prevScreenRef = useRef(state.screen)
  const [sequencer] = useState(() => new Sequencer((mutate) => setView((v) => (v ? mutate(v) : v))))
  const announce = useOfficeFeedback(state)
  const wallet = useDeferredWallet(state)

  // Time on floor accrues between inputs (idle gaps over 30 s don't count).
  const lastTickRef = useRef(0)
  const withTime = useCallback(
    (next: OfficeState): OfficeState => {
      const now = performance.now()
      const last = lastTickRef.current || now
      const delta = Math.min(30_000, Math.max(0, now - last))
      lastTickRef.current = now
      if (next === state || delta === 0) return next
      return { ...next, stats: { ...next.stats, msOnFloor: next.stats.msOnFloor + delta } }
    },
    [state],
  )

  const act = useCallback(
    (action: Parameters<typeof dispatchOfficeAction>[1], rng = Math.random) => {
      const result = dispatchOfficeAction(state, action, rng)
      if (action.type === 'MOVE' && state.screen === 'overworld') {
        const moved =
          result.state.player.x !== state.player.x || result.state.player.y !== state.player.y
        const blockedByOverlay = !!state.overlay && state.overlay.kind !== 'coach'
        if (moved) {
          SFX.step()
          Haptics.selection()
        } else if (!blockedByOverlay) {
          SFX.bump()
          Haptics.impact('light')
        }
      }
      onChange(withTime(result.state))
      return result
    },
    [state, onChange, withTime],
  )

  useEffect(() => () => sequencer.cancel(), [sequencer])

  useEffect(() => {
    const prev = prevScreenRef.current
    if (prev === state.screen) return
    prevScreenRef.current = state.screen
    if (reduceMotion) {
      const t = window.setTimeout(() => setSceneFx(null), 0)
      return () => window.clearTimeout(t)
    }
    const nextFx =
      prev === 'overworld' && state.screen === 'battle'
        ? ('battle-in' as const)
        : prev === 'battle' && state.screen === 'overworld'
          ? ('battle-out' as const)
          : null
    const t = window.setTimeout(() => setSceneFx(nextFx), 0)
    return () => window.clearTimeout(t)
  }, [state.screen, reduceMotion])

  useEffect(() => {
    if (!sceneFx) return
    const t = window.setTimeout(() => setSceneFx(null), 520)
    return () => window.clearTimeout(t)
  }, [sceneFx])

  // The switch coach mark dies on the action it teaches.
  useEffect(() => {
    if (state.overlay?.kind === 'coach' && state.overlay.id === 'coach_switch' && state.benchOpen) {
      onChange(dispatchOfficeAction(state, { type: 'ADVANCE' }).state)
    }
  }, [state, onChange])

  const liveView =
    view ??
    (state.screen === 'battle' && state.encounter && state.battle
      ? initialBattleView(
          state.encounter.party[state.encounter.activeIndex].hp,
          state.battle.enemyHp,
          encounterIntro(state.encounter.encounterId),
        )
      : null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.screen === 'overworld' && (!state.overlay || state.overlay.kind === 'coach')) {
        const dir =
          e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W'
            ? 'n'
            : e.key === 'ArrowDown' || e.key === 's' || e.key === 'S'
              ? 's'
              : e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'
                ? 'w'
                : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'
                  ? 'e'
                  : null
        if (dir) {
          e.preventDefault()
          act({ type: 'MOVE', dir })
          return
        }
        if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
          e.preventDefault()
          act({ type: 'INTERACT' })
          return
        }
        if (e.key === 'p' || e.key === 'P') {
          act({ type: 'OPEN_TEAM' })
          return
        }
      }
      if (state.overlay) {
        const ov = state.overlay
        if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
          // The dialogue box owns Enter (it completes the typewriter first), the
          // interstitial owns it (1.2 s minimum); focused buttons own it natively.
          if (ov.kind === 'dialogue' || ov.kind === 'interstitial') return
          if (document.activeElement instanceof HTMLButtonElement) return
          e.preventDefault()
          act({ type: 'ADVANCE' })
        }
        if (e.key === 'Escape') {
          if (ov.kind === 'dialogue') {
            const node = ov.nodeId
            const choices = (
              {
                dlg_gavin_challenge: 'not_now',
                dlg_gavin_offer: 'not_yet',
                dlg_priya_request: 'pass',
                dlg_priya_spar: 'rain_check',
                dlg_priya_offer: 'not_yet',
              } as Record<string, string>
            )[node]
            if (choices) {
              SFX.menuBack()
              act({ type: 'CHOOSE', choice: choices })
            } else act({ type: 'ADVANCE' })
          } else if (ov.kind === 'confirm') {
            SFX.menuBack()
            act({ type: ov.prompt === 'door' ? 'DOOR_STEP_BACK' : 'CLOSE_OVERLAY' })
          } else if (ov.kind === 'team') {
            SFX.menuBack()
            act({ type: 'CLOSE_TEAM' })
          } else if (ov.kind === 'stakes') {
            const enc = OFFICE_ENCOUNTERS[ov.encounterId]
            if (enc.declinable) {
              SFX.menuBack()
              act({ type: 'DECLINE_STAKES' })
            }
          } else if (ov.kind === 'recruit') {
            SFX.menuBack()
            act({ type: 'DECLINE_OFFER' })
          } else act({ type: 'ADVANCE' })
        }
        if (e.key === 'p' || e.key === 'P') {
          if (ov.kind === 'team') {
            SFX.menuBack()
            act({ type: 'CLOSE_TEAM' })
          }
        }
      }
      if (state.screen === 'battle' && (e.key === '5' || e.key === 'Tab')) {
        e.preventDefault()
        if (state.battle?.phase === 'switch_required') return
        act({ type: state.benchOpen ? 'CANCEL_SWITCH' : 'OPEN_SWITCH' })
      }
      if (state.screen === 'battle' && state.benchOpen && e.key === 'Escape') {
        if (state.battle?.phase !== 'switch_required') act({ type: 'CANCEL_SWITCH' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act, state])

  const playBattle = async (action: Parameters<typeof dispatchOfficeAction>[1]) => {
    if (busyRef.current || !state.battle) return
    busyRef.current = true
    setBusy(true)
    const rng = new GameRng(state.run.rngState)
    const result = dispatchOfficeAction(state, action, rng.next)
    onChange(withTime({ ...result.state, run: { ...result.state.run, rngState: rng.serialize() } }))
    if (result.events.length) {
      if (!view && state.encounter && state.battle) {
        setView(
          initialBattleView(
            state.encounter.party[state.encounter.activeIndex].hp,
            state.battle.enemyHp,
            encounterIntro(state.encounter.encounterId),
          ),
        )
      }
      const ok = await sequencer.play(result.events)
      if (!ok) {
        busyRef.current = false
        setBusy(false)
        return
      }
    }
    busyRef.current = false
    setBusy(false)
    if (result.state.screen !== 'battle') setView(null)
  }

  if (state.screen === 'promotion' && state.run.pendingPerkOffer) {
    return (
      <PromotionScreen
        player={effectiveKit(state, state.party[0])}
        oldTier={OFFICE_OLD}
        newTier={OFFICE_NEW}
        offers={state.run.pendingPerkOffer.map((id) => PERKS[id])}
        onPick={(id) => {
          SFX.menuConfirm()
          Haptics.success()
          act({ type: 'PICK_PERK', perkId: id })
        }}
        ownedPerks={state.run.perks}
      />
    )
  }

  if (state.screen === 'vending') {
    return (
      <ShopScreen
        run={state.run}
        maxHp={effectiveKit(state, state.party[0]).maxHp}
        inventoryFull={state.run.inventory.length >= 4}
        hideWellness
        title="VENDING"
        onBuyItem={(idx) => {
          const id = state.run.shopStock?.[idx]
          if (!id) return
          const result = act({ type: 'BUY_VENDING', itemId: id })
          if (result.state === state) {
            SFX.eventBad()
            Haptics.warning()
          } else {
            SFX.coin()
            Haptics.success()
          }
        }}
        onBuyWellness={() => {}}
        onLeave={() => {
          SFX.menuBack()
          act({ type: 'CLOSE_OVERLAY' })
        }}
      />
    )
  }

  // Cab ride keeps the map mounted: doors close over the avatar, fade, then arrive.

  if (state.screen === 'battle' && state.encounter && state.battle && liveView) {
    const member = state.encounter.party[state.encounter.activeIndex]
    const player = effectiveKit(state, member)
    const enemy = OFFICE_ENCOUNTERS[state.encounter.encounterId]
    const battleFloor = officeBattleChrome(state.floorId)
    const forced = state.battle.phase === 'switch_required'
    const showBench = state.benchOpen || forced
    const turn = busy || state.battle.phase !== 'player' || showBench ? 'wait' : 'player'
    const bench = state.encounter.party
    const firstStanding = bench.findIndex((m, i) => i !== state.encounter!.activeIndex && m.hp > 0)
    return (
      <div
        className={`${styles.sceneStage} ${sceneFx === 'battle-in' ? styles.sceneBattleIn : ''}`}
        style={{ height: '100%', position: 'relative' }}
      >
        {sceneFx === 'battle-in' && <span className={styles.sceneVeil} aria-hidden />}
        <BattleScreen
          player={player}
          enemy={enemy}
          playerHp={liveView.playerHp}
          enemyHp={liveView.enemyHp}
          onMove={(idx) => playBattle({ type: 'BATTLE_MOVE', moveIdx: idx })}
          onUseItem={(idx) => playBattle({ type: 'BATTLE_ITEM', itemIdx: idx })}
          log={liveView.log}
          turn={turn}
          playerPp={member.pp}
          xp={state.run.xp}
          xpToNext={state.run.xpToNext}
          level={state.run.level}
          floor={battleFloor.floor}
          floorTotal={battleFloor.floorTotal}
          playerAnim={liveView.playerAnim}
          enemyAnim={liveView.enemyAnim}
          damagePopups={liveView.popups}
          screenShake={liveView.shake}
          moveTypeColor={liveView.typeFlash}
          playerStatuses={liveView.playerStatuses}
          enemyStatuses={liveView.enemyStatuses}
          activeMoves={member.pp.every((p) => p <= 0) ? [STRUGGLE_MOVE] : player.moves}
          inventory={state.run.inventory}
          battleMode={battleMode}
          onSetBattleMode={setBattleMode}
          playerMaxHp={player.maxHp}
          stockOptions={state.run.stockOptions}
          onTextTap={() => sequencer.skip()}
          textMsPerChar={textMsPerChar}
          onSwitch={
            bench.filter((m) => m.hp > 0).length >= 2
              ? () => {
                  SFX.menuSelect()
                  act({ type: showBench && !forced ? 'CANCEL_SWITCH' : 'OPEN_SWITCH' })
                }
              : undefined
          }
        />
        {showBench && (
          <div className={styles.bench} role="dialog" aria-label="Switch party member">
            <div className={styles.benchHead}>
              <div className={`${styles.eyebrow} ${forced ? styles.benchDanger : ''}`}>
                {forced ? 'Send in the next person' : 'Switch · costs your turn'}
              </div>
              <span className={styles.benchSub}>
                {forced ? `${shortLabel(member)} is out.` : 'They take the next hit.'}
              </span>
            </div>
            <div className={styles.benchCards}>
              {bench.map((m, i) => {
                if (i === state.encounter!.activeIndex) return null
                const max = maxHpFor(state, m)
                const out = m.hp <= 0
                const kit = kitFor(m)
                return (
                  <button
                    key={m.slot}
                    type="button"
                    className={styles.benchCard}
                    disabled={out || busy}
                    autoFocus={i === firstStanding}
                    onClick={() => {
                      SFX.menuConfirm()
                      Haptics.selection()
                      playBattle({ type: 'BATTLE_SWITCH', to: i })
                    }}
                  >
                    <Headshot spriteId={memberSprite(m)} size={44} ring={memberRing(m)} out={out} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className={styles.benchName}>{shortLabel(m)}</span>
                      <span className={`${styles.benchMeta} ${out ? styles.benchOut : ''}`}>
                        {out ? 'OUT' : `${m.hp} / ${max} · PP ${m.pp.join(' · ')}`}
                      </span>
                      <span className={styles.benchHp}>
                        <span
                          className={`${styles.benchHpFill} ${styles[hpTone(m.hp, max)]}`}
                          style={{ width: `${Math.max(0, (m.hp / max) * 100)}%` }}
                        />
                      </span>
                      <span className={styles.benchMeta}>
                        {kit.types.join(' · ').toUpperCase()}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            {!forced && (
              <div className={styles.benchFoot}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    SFX.menuBack()
                    act({ type: 'CANCEL_SWITCH' })
                  }}
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        )}
        {state.overlay?.kind === 'coach' && state.overlay.id === 'coach_switch' && !showBench && (
          <CoachMark
            id="coach_switch"
            className={styles.coachSwitch}
            onDismiss={() => act({ type: 'ADVANCE' })}
          />
        )}
        <OfficeOverlays
          state={state}
          onChange={onChange}
          textMsPerChar={textMsPerChar}
          reduceMotion={reduceMotion}
        />
        <div className={styles.srOnly} aria-live="polite">
          {announce}
        </div>
      </div>
    )
  }

  return (
    <Overworld
      state={state}
      act={act}
      onChange={onChange}
      onExit={onExit}
      textMsPerChar={textMsPerChar}
      reduceMotion={reduceMotion}
      announce={announce}
      wallet={wallet}
      sceneFx={sceneFx}
    />
  )
}

function shortLabel(m: PartyMember) {
  return m.def.kind === 'lead' ? 'You' : memberName(m)
}

/* ─── overworld ─────────────────────────────────────────── */

function Overworld({
  state,
  act,
  onChange,
  onExit,
  textMsPerChar,
  reduceMotion,
  announce,
  wallet,
  sceneFx,
}: {
  state: OfficeState
  act: (action: Parameters<typeof dispatchOfficeAction>[1]) => unknown
  onChange: (next: OfficeState) => void
  onExit: () => void
  textMsPerChar: number
  reduceMotion: boolean
  announce: string
  wallet: { shown: number; pulse: boolean }
  sceneFx: 'battle-in' | 'battle-out' | null
}) {
  const target = interactTarget(state)
  const prompt = target ? promptText(target, state) : null
  const obj = currentObjective(state)
  const overlayOpen =
    (!!state.overlay && state.overlay.kind !== 'coach') || state.screen === 'elevator_ride'
  const verb = actVerb(prompt, state)
  const chips = hudKeyChips(state)
  const holdRef = useRef<number | null>(null)
  const [held, setHeld] = useState<Facing | null>(null)
  // The repeat timer must dispatch against the latest state, not the one
  // captured when the thumb first landed.
  const actRef = useRef(act)
  useEffect(() => {
    actRef.current = act
  })

  const stopHold = useCallback(() => {
    if (holdRef.current) window.clearInterval(holdRef.current)
    holdRef.current = null
    setHeld(null)
  }, [])
  useEffect(() => stopHold, [stopHold])

  // Hold-to-walk: the D-pad repeats at tile cadence while pressed.
  const startHold = (dir: Facing) => {
    stopHold()
    setHeld(dir)
    actRef.current({ type: 'MOVE', dir })
    holdRef.current = window.setInterval(() => actRef.current({ type: 'MOVE', dir }), MOVE_MS)
  }

  return (
    <div className={`${styles.screen} ${sceneFx === 'battle-out' ? styles.sceneBattleOut : ''}`}>
      {sceneFx === 'battle-out' && <span className={styles.sceneVeil} aria-hidden />}
      <div className={styles.hud}>
        <div className={styles.objective} aria-label="Objective">
          <div className={styles.objectiveHead}>
            <div className={styles.eyebrow}>
              {state.floorId !== 'floor_01' || state.flags.includes('flag_preview_complete')
                ? floorLabel(state.floorId)
                : 'Objective'}
            </div>
            <span
              className={styles.dest}
              style={
                {
                  '--dest-accent': destChip(state, obj).accent ?? ZONE_ACCENT[obj.zone],
                } as CSSProperties
              }
            >
              {destChip(state, obj).label}
            </span>
          </div>
          <div key={obj.text} className={`${styles.objectiveLine} ${styles.objectiveSwap}`}>
            {obj.text}
          </div>
        </div>
        <div className={styles.hudRow}>
          <PartyStrip state={state} />
          <div className={styles.wallet}>
            <span
              className={`${styles.walletChip} ${wallet.pulse ? styles.walletPulse : ''}`}
              aria-label={`${wallet.shown} Stock Options`}
            >
              {CURRENCY_ICON} {wallet.shown}
            </span>
            {chips.length > 0 && (
              <div className={styles.keyRow}>
                {chips.map((chip) => (
                  <span key={chip.id} className={styles.keyChip}>
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mapRegion}>
        <WorldMap state={state} />
        {state.screen === 'elevator_ride' && (
          <ElevatorRide state={state} onChange={onChange} reduceMotion={reduceMotion} />
        )}
        <OfficeOverlays
          state={state}
          onChange={onChange}
          textMsPerChar={textMsPerChar}
          reduceMotion={reduceMotion}
          onExit={onExit}
        />
      </div>

      <div className={styles.ctl}>
        <div
          className={`${styles.dpad} ${overlayOpen ? styles.ctlDim : ''}`}
          aria-label="Move"
          role="group"
        >
          {(
            [
              ['n', styles.padN, '▲'],
              ['w', styles.padW, '◀'],
              ['e', styles.padE, '▶'],
              ['s', styles.padS, '▼'],
            ] as [Facing, string, string][]
          ).map(([dir, cls, glyph]) => (
            <button
              key={dir}
              type="button"
              className={`${styles.pad} ${cls} ${held === dir ? styles.padHeld : ''}`}
              aria-label={`Move ${dir === 'n' ? 'up' : dir === 's' ? 'down' : dir === 'w' ? 'left' : 'right'}`}
              onPointerDown={(e) => {
                e.preventDefault()
                startHold(dir)
              }}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onContextMenu={(e) => e.preventDefault()}
            >
              {glyph}
            </button>
          ))}
          <span className={styles.padHub} aria-hidden />
        </div>

        <div className={styles.legend} aria-hidden>
          <span className={styles.legendNearby}>
            {prompt && !overlayOpen ? (
              <>
                <span className={styles.kbd}>E</span> · {prompt}
              </>
            ) : (
              ' '
            )}
          </span>
          <span className={styles.legendKeys}>
            Move <span className={styles.kbd}>↑↓←→</span> · Interact{' '}
            <span className={styles.kbd}>E</span> · Team <span className={styles.kbd}>P</span> ·
            Menu <span className={styles.kbd}>Esc</span>
          </span>
        </div>

        <div className={styles.ctlRight}>
          <button type="button" className={styles.exit} onClick={onExit}>
            Title
          </button>
          <div className={styles.ctlButtons}>
            <button
              type="button"
              className={styles.team}
              aria-label="Team"
              onClick={() => {
                Haptics.selection()
                act({ type: state.overlay?.kind === 'team' ? 'CLOSE_TEAM' : 'OPEN_TEAM' })
              }}
            >
              <span className={styles.teamIcon} aria-hidden />
              TEAM
              <span className={styles.teamBadge}>{state.party.length}</span>
            </button>
            <button
              type="button"
              className={`${styles.act} ${!prompt && !overlayOpen ? styles.actIdle : ''}`}
              aria-label={verb}
              onClick={() => {
                Haptics.selection()
                act({ type: 'INTERACT' })
              }}
            >
              {verb}
            </button>
          </div>
        </div>
      </div>

      {state.overlay?.kind === 'coach' && state.overlay.id === 'coach_move' && (
        <CoachMark
          id="coach_move"
          className={styles.coachMove}
          onDismiss={() => act({ type: 'ADVANCE' })}
        />
      )}
      {state.overlay?.kind === 'coach' && state.overlay.id === 'coach_interact' && (
        <CoachMark
          id="coach_interact"
          className={styles.coachInteract}
          onDismiss={() => act({ type: 'ADVANCE' })}
        />
      )}
      {state.overlay?.kind === 'coach' && state.overlay.id === 'coach_roster' && (
        <CoachMark
          id="coach_roster"
          className={styles.coachInteract}
          onDismiss={() => act({ type: 'ADVANCE' })}
        />
      )}
      {state.overlay?.kind === 'interstitial' && <Interstitial state={state} onChange={onChange} />}
      <div className={styles.srOnly} aria-live="polite">
        {announce}
      </div>
    </div>
  )
}
