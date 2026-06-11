import { useCallback, useEffect, useRef, useState } from 'react'
import { SFX } from './sfx'
import { Music } from './music'
import { buildSpriteUrls } from './sprites'
import type { HallwayEvent, Move, PlayerClass, PromotionTier, Screen } from './types'
import { Button, Stage } from './ui'
import {
  ACHIEVEMENTS,
  ENEMY_POOLS,
  ITEMS,
  PLAYER_CLASSES,
  checkAchievements,
  getAct,
  getBestNgPlus,
  getEffectivePlayer,
  getPromotion,
  getUnlockedAchievements,
  saveBestNgPlus,
} from './data'
import {
  TitleScreen,
  ClassSelect,
  BattleScreen,
  VictoryScreen,
  GameOverScreen,
  WinScreen,
  HallwayEventScreen,
  FloorIntro,
  RouteChoice,
} from './screens'
import PromotionScreen from './screens/PromotionScreen'
import ActTransitionScreen from './screens/ActTransitionScreen'
import DailyPreScreen from './screens/DailyPreScreen'
import DailyResultScreen from './screens/DailyResultScreen'
import { DAILY_FLOOR_COUNT, calculateDailyScore, saveDailyResult } from './daily'
import { STRUGGLE_MOVE } from './battle'
import {
  GameRng,
  applyEventChoice,
  applyPostBattlePerk,
  applyVictory,
  battleIntroLine,
  clearSave,
  loadRun,
  newBattle,
  newDailyRun,
  newNgPlusRun,
  newRun,
  pickTwoEvents,
  resolveEnemy,
  resolveItemUse,
  resolvePlayerMove,
  saveRun,
  type BattleState,
  type RunState,
  type TurnResult,
} from './engine'
import { Sequencer, initialBattleView, type BattleView } from './sequencer'
import { TEXT_SPEED_MS, loadSettings, saveSettings } from './settings'
import SettingsPanel from './components/SettingsPanel'

// ─── SPRITE PRELOADER ────────────────────────────────────────
function useSpritePreloader(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const urls = Object.values(buildSpriteUrls())
    let cancelled = false
    Promise.all(
      urls.map((u) => {
        const img = new Image()
        img.src = u
        return img.decode().catch(() => {})
      }),
    ).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return ready
}

// ─── MAIN GAME ───────────────────────────────────────────────
// Thin shell over the engine: canonical state is one RunState + one
// BattleState; the sequencer drives the displayed BattleView during
// turn playback. No state mirrors, no timing-dependent outcomes.
export default function CorporateClimb() {
  const spritesReady = useSpritePreloader()
  const [screen, setScreenRaw] = useState<Screen>('title')
  const [fadeClass, setFadeClass] = useState<'in' | 'out'>('in')

  // Canonical game state
  const [run, setRun] = useState<RunState | null>(null)
  const [battle, setBattle] = useState<BattleState | null>(null)
  // Displayed battle state, updated beat-by-beat by the sequencer
  const [view, setView] = useState<BattleView | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  // Screen-flow state
  const [battleMode, setBattleMode] = useState<'fight' | 'items'>('fight')
  const [xpResult, setXpResult] = useState({ xpGained: 0, leveledUp: false })
  const [routeOptions, setRouteOptions] = useState<[HallwayEvent, HallwayEvent] | null>(null)
  const [currentEvent, setCurrentEvent] = useState<HallwayEvent | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{
    old: PromotionTier
    new: PromotionTier
  } | null>(null)
  const [pendingActTransition, setPendingActTransition] = useState<number | null>(null)
  const [newAchievements, setNewAchievements] = useState<import('./types').AchievementId[]>([])
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('cc_muted') === '1'
    } catch {
      return false
    }
  })
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  // Managed timers: every delayed flow step goes through after() so
  // restart/unmount can cancel the lot (the old code leaked timeouts
  // into the next run).
  const timersRef = useRef<Set<number>>(new Set())
  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
  }, [])
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current.clear()
  }, [])

  const [sequencer] = useState(() => new Sequencer((mutate) => setView((v) => (v ? mutate(v) : v))))

  useEffect(
    () => () => {
      clearTimers()
      sequencer.cancel()
    },
    [clearTimers, sequencer],
  )

  const setScreen = useCallback(
    (next: Screen) => {
      setFadeClass('out')
      after(200, () => {
        setScreenRaw(next)
        setFadeClass('in')
      })
    },
    [after],
  )

  // ─── Derived state ─────────────────────────────────────────
  const player: PlayerClass | null = run
    ? (PLAYER_CLASSES.find((c) => c.id === run.classId) ?? null)
    : null
  const effectivePlayer = player && run ? getEffectivePlayer(player, run.classId, run.floor) : null
  const promotionTier = run ? getPromotion(run.classId, run.floor) : null
  const enemy = run ? resolveEnemy(run, view?.enemyPhase ?? 1) : null

  const allPpDepleted = run ? run.pp.every((pp) => pp <= 0) : false
  const activeMoves: Move[] = effectivePlayer
    ? allPpDepleted
      ? [STRUGGLE_MOVE]
      : effectivePlayer.moves
    : []
  const turn = !busy && battle?.phase === 'player' ? 'player' : 'waiting'

  // Music: sync mute state on mount and when toggled
  useEffect(() => {
    Music.setMuted(muted)
    try {
      localStorage.setItem('cc_muted', muted ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }, [muted])

  // Settings: apply volumes and persist whenever they change
  useEffect(() => {
    Music.setVolume(settings.musicVolume)
    SFX.setVolume(settings.sfxVolume)
    saveSettings(settings)
  }, [settings])

  // Music: play track based on current screen
  const floor = run?.floor ?? 0
  useEffect(() => {
    switch (screen) {
      case 'title':
      case 'classSelect':
        Music.playTitle()
        break
      case 'battle':
        if (floor % 10 >= 8) Music.playBoss()
        else Music.playBattle()
        break
      case 'hallwayEvent':
      case 'floorIntro':
      case 'routeChoice':
        Music.playEvent()
        break
      case 'victory':
      case 'win':
      case 'gameOver':
        Music.stop()
        break
    }
  }, [screen, floor])

  // ─── Battle outcome flows ──────────────────────────────────
  const handleWin = useCallback(
    (winRun: RunState) => {
      const cls = PLAYER_CLASSES.find((c) => c.id === winRun.classId)!
      const effMaxHp = getEffectivePlayer(cls, winRun.classId, winRun.floor).maxHp
      after(500, () => {
        SFX.victory()
        const { run: next, xpGained, leveledUp } = applyVictory(winRun, effMaxHp)
        setRun(next)
        setXpResult({ xpGained, leveledUp })
        if (leveledUp) after(600, () => SFX.levelUp())
        setScreen('victory')
      })
    },
    [after, setScreen],
  )

  const handleLoss = useCallback(
    (lossRun: RunState) => {
      if (lossRun.mode.kind === 'daily') {
        const mode = lossRun.mode
        saveDailyResult({
          seed: mode.seed,
          classId: lossRun.classId,
          score: calculateDailyScore({
            floorsCleared: lossRun.floor,
            totalTurns: lossRun.stats.totalTurns,
            totalDamageDealt: lossRun.stats.totalDamageDealt,
            hpRemaining: 0,
            won: false,
          }),
          floorsCleared: lossRun.floor,
          totalTurns: lossRun.stats.totalTurns,
          totalDamageDealt: lossRun.stats.totalDamageDealt,
          hpRemaining: 0,
          won: false,
          modifierId: mode.modifierId,
        })
        SFX.gameOver()
        setScreen('dailyResult')
      } else {
        clearSave()
        SFX.gameOver()
        setScreen('gameOver')
      }
    },
    [setScreen],
  )

  // ─── Turn dispatch ─────────────────────────────────────────
  const playTurn = useCallback(
    (result: TurnResult, rngState: number | null) => {
      const nextRun = { ...result.run, rngState }
      setRun(nextRun)
      setBattle(result.battle)
      setBattleMode('fight')
      busyRef.current = true
      setBusy(true)
      sequencer.play(result.events).then((completed) => {
        if (!completed) return
        busyRef.current = false
        setBusy(false)
        if (result.battle.phase === 'won') handleWin(nextRun)
        else if (result.battle.phase === 'lost') handleLoss(nextRun)
      })
    },
    [sequencer, handleWin, handleLoss],
  )

  const doPlayerMove = (moveIdx: number) => {
    if (!run || !battle || !effectivePlayer) return
    if (busyRef.current || battle.phase !== 'player') return
    const rng = new GameRng(run.rngState)
    const result = resolvePlayerMove({ run, battle, effectivePlayer }, moveIdx, rng.next)
    playTurn(result, rng.serialize())
  }

  const useItem = (itemIdx: number) => {
    if (!run || !battle || !effectivePlayer || !run.inventory[itemIdx]) return
    if (busyRef.current || battle.phase !== 'player') return
    const rng = new GameRng(run.rngState)
    const result = resolveItemUse({ run, battle, effectivePlayer }, itemIdx, rng.next)
    playTurn(result, rng.serialize())
  }

  // ─── Run lifecycle ─────────────────────────────────────────
  const startGame = () => {
    clearSave()
    SFX.menuSelect()
    setScreen('classSelect')
  }

  const continueGame = () => {
    const saved = loadRun()
    if (!saved) return
    SFX.menuConfirm()
    setRun(saved)
    setScreen('floorIntro')
  }

  const selectClass = (cls: PlayerClass) => {
    SFX.menuConfirm()
    setRun(newRun(cls))
    setScreen('floorIntro')
  }

  const startDaily = (cls: PlayerClass) => {
    SFX.menuConfirm()
    setRun(newDailyRun(cls))
    setScreen('floorIntro')
  }

  const startNgPlus = () => {
    if (!run || !player) return
    SFX.menuConfirm()
    setRun(newNgPlusRun(run, player))
    setView(null)
    setBattle(null)
    setScreen('floorIntro')
  }

  const restart = () => {
    sequencer.cancel()
    clearTimers()
    busyRef.current = false
    clearSave()
    SFX.menuSelect()
    setRun(null)
    setBattle(null)
    setView(null)
    setBusy(false)
    setBattleMode('fight')
    setRouteOptions(null)
    setCurrentEvent(null)
    setPendingPromotion(null)
    setPendingActTransition(null)
    setNewAchievements([])
    setScreenRaw('title')
    setFadeClass('in')
  }

  // ─── Battle entry ──────────────────────────────────────────
  const startBattle = () => {
    if (!run) return
    const foe = resolveEnemy(run, 1)
    setBattle(newBattle(foe))
    setView(initialBattleView(run.hp, foe.maxHp, battleIntroLine(foe)))
    setBattleMode('fight')
    if (run.floor % 10 >= 8) SFX.bossIntro()
    else SFX.enemyAppear()
    setScreen('battle')
  }

  // ─── Between-floor flow ────────────────────────────────────
  const proceedToRouteChoice = (current: RunState) => {
    if (current.mode.kind === 'daily' && !current.mode.modifier.eventsEnabled) {
      setScreen('floorIntro')
      return
    }
    const rng = new GameRng(current.rngState)
    const { options, run: next } = pickTwoEvents(current, rng.next)
    setRun({ ...next, rngState: rng.serialize() })
    setRouteOptions(options)
    setScreen('routeChoice')
  }

  const handleVictoryContinue = () => {
    if (!run) return
    SFX.menuConfirm()
    setView(null)
    setBattle(null)
    const cls = PLAYER_CLASSES.find((c) => c.id === run.classId)!
    const effMaxHp = getEffectivePlayer(cls, run.classId, run.floor).maxHp
    let next = applyPostBattlePerk(run, effMaxHp)

    const totalFloors = next.mode.kind === 'daily' ? DAILY_FLOOR_COUNT : ENEMY_POOLS.length
    if (next.floor >= totalFloors - 1) {
      if (next.mode.kind === 'daily') {
        const mode = next.mode
        saveDailyResult({
          seed: mode.seed,
          classId: next.classId,
          score: calculateDailyScore({
            floorsCleared: next.floor + 1,
            totalTurns: next.stats.totalTurns,
            totalDamageDealt: next.stats.totalDamageDealt,
            hpRemaining: next.hp,
            won: true,
          }),
          floorsCleared: next.floor + 1,
          totalTurns: next.stats.totalTurns,
          totalDamageDealt: next.stats.totalDamageDealt,
          hpRemaining: next.hp,
          won: true,
          modifierId: mode.modifierId,
        })
        SFX.fanfare()
        setRun(next)
        setScreen('dailyResult')
      } else {
        clearSave()
        saveBestNgPlus(next.ngPlus)
        setNewAchievements(
          checkAchievements({
            classId: next.classId,
            totalTurns: next.stats.totalTurns,
            totalDamageDealt: next.stats.totalDamageDealt,
            ngLevel: next.ngPlus,
            itemsUsed: next.stats.itemsUsed,
            finalHp: next.hp,
          }),
        )
        SFX.fanfare()
        setRun(next)
        setScreen('win')
      }
      return
    }

    const prevFloor = next.floor
    next = { ...next, floor: prevFloor + 1 }
    setRun(next)
    if (next.mode.kind === 'normal') saveRun(next)

    const isDaily = next.mode.kind === 'daily'
    const prevPromo = isDaily ? null : getPromotion(next.classId, prevFloor)
    const nextPromo = isDaily ? null : getPromotion(next.classId, next.floor)
    const hasPromotion = !!(prevPromo && nextPromo && prevPromo.title !== nextPromo.title)
    const hasActTransition = !isDaily && getAct(prevFloor) !== getAct(next.floor)

    if (hasPromotion && prevPromo && nextPromo) {
      setPendingPromotion({ old: prevPromo, new: nextPromo })
      if (hasActTransition) setPendingActTransition(getAct(next.floor))
      SFX.fanfare()
      setScreen('promotion')
    } else if (hasActTransition) {
      setPendingActTransition(getAct(next.floor))
      setScreen('actTransition')
    } else {
      proceedToRouteChoice(next)
    }
  }

  const handlePromotionContinue = () => {
    if (!run || !player) return
    SFX.menuConfirm()
    const fullHp = getEffectivePlayer(player, run.classId, run.floor).maxHp
    const next = { ...run, hp: fullHp }
    setRun(next)
    setPendingPromotion(null)
    if (pendingActTransition) {
      setScreen('actTransition')
    } else {
      proceedToRouteChoice(next)
    }
  }

  const handleActTransitionContinue = () => {
    if (!run) return
    SFX.menuConfirm()
    setPendingActTransition(null)
    proceedToRouteChoice(run)
  }

  const handleRoutePick = (event: HallwayEvent) => {
    SFX.menuConfirm()
    setCurrentEvent(event)
    setScreen('hallwayEvent')
  }

  /** Apply a hallway choice; returns the bonus item name (if any) for display. */
  const handleEventChoose = (choiceIdx: number): { itemGained: string | null } => {
    if (!run || !currentEvent || !effectivePlayer) return { itemGained: null }
    const rng = new GameRng(run.rngState)
    const { run: next, itemGained } = applyEventChoice(
      run,
      effectivePlayer,
      currentEvent,
      choiceIdx,
      rng.next,
    )
    setRun({ ...next, rngState: rng.serialize() })
    return { itemGained: itemGained ? ITEMS[itemGained].name : null }
  }

  const handleEventContinue = () => {
    setScreen('floorIntro')
  }

  const handleDailyBack = () => {
    setRun(null)
    setBattle(null)
    setView(null)
    setScreen('title')
  }

  if (!spritesReady) {
    return (
      <Stage>
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: 'var(--sky)',
          }}
        >
          <div className="t-display" style={{ fontSize: 'var(--display-md)' }}>
            LOADING...
          </div>
          <div className="t-body" style={{ fontSize: 'var(--body-md)', color: 'var(--muted)' }}>
            Preparing sprites
          </div>
        </div>
      </Stage>
    )
  }

  return (
    <Stage>
      {/* Mute + settings — always visible */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 100, display: 'flex', gap: 6 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMuted((m) => !m)}
          style={{ padding: '6px 10px' }}
          title={muted ? 'Unmute music' : 'Mute music'}
          aria-label={muted ? 'Unmute music' : 'Mute music'}
        >
          {muted ? '🔇' : '🔊'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          style={{ padding: '6px 10px' }}
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
        </Button>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div
        className={`${fadeClass === 'in' ? 'screen-fade-in' : 'screen-fade-out'}${settings.reduceMotion ? ' reduce-motion' : ''}`}
        style={{ width: '100%', height: '100%' }}
      >
        {screen === 'title' && (
          <TitleScreen
            onStart={startGame}
            onContinue={loadRun() ? continueGame : undefined}
            onDaily={() => setScreen('dailyPre')}
          />
        )}
        {screen === 'dailyPre' && (
          <DailyPreScreen onStart={startDaily} onBack={() => setScreen('title')} />
        )}
        {screen === 'classSelect' && <ClassSelect onSelect={selectClass} />}
        {screen === 'hallwayEvent' && currentEvent && run && effectivePlayer && (
          <HallwayEventScreen
            event={currentEvent}
            onChoose={handleEventChoose}
            onContinue={handleEventContinue}
            playerHp={run.hp}
            playerMaxHp={effectivePlayer.maxHp}
          />
        )}
        {screen === 'routeChoice' && routeOptions && (
          <RouteChoice options={routeOptions} onPick={handleRoutePick} />
        )}
        {screen === 'floorIntro' && run && enemy && (
          <FloorIntro
            enemy={enemy}
            floor={run.floor}
            player={player ?? undefined}
            onReady={startBattle}
            totalFloors={run.mode.kind === 'daily' ? DAILY_FLOOR_COUNT : undefined}
          />
        )}
        {screen === 'battle' && run && battle && view && effectivePlayer && enemy && (
          <BattleScreen
            player={effectivePlayer}
            enemy={enemy}
            playerHp={view.playerHp}
            enemyHp={view.enemyHp}
            onMove={doPlayerMove}
            onUseItem={useItem}
            log={view.log}
            turn={turn}
            playerPp={run.pp}
            xp={run.xp}
            xpToNext={run.xpToNext}
            level={run.level}
            floor={run.floor + 1}
            playerAnim={view.playerAnim}
            enemyAnim={view.enemyAnim}
            damagePopups={view.popups}
            screenShake={view.shake}
            moveTypeColor={view.typeFlash}
            playerStatuses={view.playerStatuses}
            enemyStatuses={view.enemyStatuses}
            activeMoves={activeMoves}
            inventory={run.inventory}
            battleMode={battleMode}
            onSetBattleMode={setBattleMode}
            promotionTitle={promotionTier?.title}
            playerMaxHp={effectivePlayer.maxHp}
            onTextTap={() => sequencer.skip()}
            textMsPerChar={TEXT_SPEED_MS[settings.textSpeed]}
          />
        )}
        {screen === 'victory' && run && enemy && (
          <VictoryScreen
            enemy={enemy}
            xpGained={xpResult.xpGained}
            leveledUp={xpResult.leveledUp}
            newLevel={run.level}
            onContinue={handleVictoryContinue}
          />
        )}
        {screen === 'promotion' && player && pendingPromotion && (
          <PromotionScreen
            player={player}
            oldTier={pendingPromotion.old}
            newTier={pendingPromotion.new}
            onContinue={handlePromotionContinue}
          />
        )}
        {screen === 'actTransition' && pendingActTransition && (
          <ActTransitionScreen
            act={pendingActTransition}
            onContinue={handleActTransitionContinue}
          />
        )}
        {screen === 'dailyResult' && run && player && run.mode.kind === 'daily' && (
          <DailyResultScreen
            player={player}
            score={calculateDailyScore({
              floorsCleared: run.floor + (run.hp > 0 ? 1 : 0),
              totalTurns: run.stats.totalTurns,
              totalDamageDealt: run.stats.totalDamageDealt,
              hpRemaining: Math.max(0, run.hp),
              won: run.hp > 0,
            })}
            floorsCleared={run.floor + (run.hp > 0 ? 1 : 0)}
            totalTurns={run.stats.totalTurns}
            totalDamageDealt={run.stats.totalDamageDealt}
            hpRemaining={Math.max(0, run.hp)}
            won={run.hp > 0}
            seed={run.mode.seed}
            modifierId={run.mode.modifierId}
            onBack={handleDailyBack}
          />
        )}
        {screen === 'gameOver' && <GameOverScreen floor={floor + 1} onRestart={restart} />}
        {screen === 'win' && run && player && (
          <WinScreen
            player={effectivePlayer || player}
            onRestart={restart}
            onNgPlus={startNgPlus}
            ngLevel={run.ngPlus}
            bestNgLevel={getBestNgPlus()}
            totalTurns={run.stats.totalTurns}
            totalDamageDealt={run.stats.totalDamageDealt}
            floorsCleared={ENEMY_POOLS.length}
            newAchievements={newAchievements}
            allAchievements={ACHIEVEMENTS}
            unlockedAchievements={getUnlockedAchievements()}
          />
        )}
      </div>
    </Stage>
  )
}
