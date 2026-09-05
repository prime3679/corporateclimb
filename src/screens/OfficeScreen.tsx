import { useCallback, useEffect, useRef, useState } from 'react'
import { PERKS } from '@/data'
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
  objectiveLabel,
  type OfficeState,
} from '@/engine/office'
import { GameRng } from '@/engine'
import { OFFICE_ENCOUNTERS } from '@/content/office'
import WorldMap from './office/WorldMap'
import PartyStrip from './office/PartyStrip'
import OfficeOverlays, { WalletChip } from './office/overlays'
import { SFX } from '@/sfx'

const OFFICE_OLD = { floor: 0, title: 'New Hire' }
const OFFICE_NEW = { floor: 1, title: 'Cleared Probation' }

export default function OfficeScreen({
  state,
  onChange,
  onExit,
}: {
  state: OfficeState
  onChange: (next: OfficeState) => void
  onExit: () => void
}) {
  const [view, setView] = useState<BattleView | null>(null)
  const [busy, setBusy] = useState(false)
  const [battleMode, setBattleMode] = useState<'fight' | 'items'>('fight')
  const busyRef = useRef(false)
  const [sequencer] = useState(() => new Sequencer((mutate) => setView((v) => (v ? mutate(v) : v))))

  const act = useCallback(
    (action: Parameters<typeof dispatchOfficeAction>[1], rng = Math.random) => {
      const result = dispatchOfficeAction(state, action, rng)
      onChange(result.state)
      return result
    },
    [state, onChange],
  )

  useEffect(() => () => sequencer.cancel(), [sequencer])

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
        if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
          e.preventDefault()
          act({ type: 'ADVANCE' })
        }
        if (e.key === 'Escape') {
          const ov = state.overlay
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
            if (choices) act({ type: 'CHOOSE', choice: choices })
            else act({ type: 'ADVANCE' })
          } else if (ov.kind === 'confirm') act({ type: 'CLOSE_OVERLAY' })
          else if (ov.kind === 'team') act({ type: 'CLOSE_TEAM' })
          else act({ type: 'ADVANCE' })
        }
      }
      if (state.screen === 'battle' && (e.key === '5' || e.key === 'Tab')) {
        e.preventDefault()
        act({ type: state.benchOpen ? 'CANCEL_SWITCH' : 'OPEN_SWITCH' })
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
    onChange({ ...result.state, run: { ...result.state.run, rngState: rng.serialize() } })
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
          if (id) act({ type: 'BUY_VENDING', itemId: id })
        }}
        onBuyWellness={() => {}}
        onLeave={() => act({ type: 'CLOSE_OVERLAY' })}
      />
    )
  }

  if (state.screen === 'battle' && state.encounter && state.battle && liveView) {
    const member = state.encounter.party[state.encounter.activeIndex]
    const player = effectiveKit(state, member)
    const enemy = OFFICE_ENCOUNTERS[state.encounter.encounterId]
    const forced = state.battle.phase === 'switch_required'
    const showBench = state.benchOpen || forced
    const turn = busy || state.battle.phase !== 'player' || showBench ? 'wait' : 'player'
    return (
      <div style={{ height: '100%', position: 'relative' }}>
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
          floor={enemy.rank + 1}
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
          onSwitch={
            state.encounter.party.filter((m) => m.hp > 0).length >= 2
              ? () => act({ type: showBench && !forced ? 'CANCEL_SWITCH' : 'OPEN_SWITCH' })
              : undefined
          }
        />
        {showBench && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 16,
              zIndex: 12,
              background: 'var(--cc-surface-2)',
              border: '1px solid var(--cc-gold)',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <div className="t-display" style={{ fontSize: 12, color: 'var(--cc-gold)' }}>
              {forced ? 'Send in the next person.' : 'SWITCH — costs your turn.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {state.encounter.party.map((m, i) => (
                <Button
                  key={m.slot}
                  size="sm"
                  disabled={i === state.encounter!.activeIndex || m.hp <= 0}
                  onClick={() => playBattle({ type: 'BATTLE_SWITCH', to: i })}
                >
                  {m.def.kind === 'lead' ? 'YOU' : kitFor(m).name} {m.hp}
                </Button>
              ))}
              {!forced && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act({ type: 'CANCEL_SWITCH' })}
                >
                  Back
                </Button>
              )}
            </div>
          </div>
        )}
        <OfficeOverlays state={state} onChange={onChange} />
      </div>
    )
  }

  const prompt = interactTarget(state)
  const firstNearby = prompt && !state.flags.includes('flag_interact_coached')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '10px 10px 8px',
        gap: 8,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="t-display" style={{ fontSize: 12, color: 'var(--cc-gold)' }}>
          {objectiveLabel(state)}
        </div>
        <WalletChip state={state} />
      </div>
      <PartyStrip state={state} />
      <WorldMap state={state} />
      <div className="t-body" style={{ minHeight: 20, fontSize: 13, color: 'var(--paper)' }}>
        {prompt ? `${prompt.label}${firstNearby ? ' — press E' : ''}` : ' '}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(['n', 'w', 's', 'e'] as const).map((dir) => (
          <Button key={dir} size="sm" onClick={() => act({ type: 'MOVE', dir })}>
            {dir.toUpperCase()}
          </Button>
        ))}
        <Button size="sm" variant="primary" onClick={() => act({ type: 'INTERACT' })}>
          ACT
        </Button>
        <Button size="sm" variant="secondary" onClick={() => act({ type: 'OPEN_TEAM' })}>
          TEAM
        </Button>
        <Button size="sm" variant="ghost" onClick={onExit}>
          TITLE
        </Button>
      </div>
      <OfficeOverlays state={state} onChange={onChange} />
    </div>
  )
}
