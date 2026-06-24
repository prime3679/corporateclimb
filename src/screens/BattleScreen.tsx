import { useEffect, useRef, useState } from 'react'
import type {
  PlayerClass,
  Enemy,
  AnimState,
  DamagePopup,
  StatusInstance,
  Move,
  ItemId,
} from '@/types'
import { ITEMS, TOTAL_FLOORS, TYPE_COLORS, getAct, getTypeMultiplier } from '@/data'
import { getScene } from '@/ui/scenes'
import SceneBackdrop from '@/components/SceneBackdrop'
import StagedSprite from '@/components/StagedSprite'
import HpBar from '@/components/HpBar'
import StatusBadges from '@/components/StatusBadges'
import XpBar from '@/components/XpBar'
import TextBox from '@/components/TextBox'
import MoveButton from '@/components/MoveButton'
import DamageNumber from '@/components/DamageNumber'
import TypeBadge from '@/components/TypeBadge'
import styles from './BattleScreen.module.css'

export default function BattleScreen({
  player,
  enemy,
  playerHp,
  enemyHp,
  onMove,
  onUseItem,
  log,
  turn,
  playerPp,
  xp,
  xpToNext,
  level,
  floor,
  playerAnim,
  enemyAnim,
  damagePopups,
  screenShake,
  moveTypeColor,
  playerStatuses,
  enemyStatuses,
  activeMoves,
  inventory,
  battleMode,
  onSetBattleMode,
  promotionTitle,
  playerMaxHp,
  stockOptions,
  onTextTap,
  textMsPerChar,
}: {
  player: PlayerClass
  enemy: Enemy
  playerHp: number
  enemyHp: number
  onMove: (idx: number) => void
  onUseItem: (idx: number) => void
  log: string[]
  turn: string
  playerPp: number[]
  xp: number
  xpToNext: number
  level: number
  floor: number
  playerAnim: AnimState
  enemyAnim: AnimState
  damagePopups: DamagePopup[]
  screenShake: boolean
  moveTypeColor: string | null
  playerStatuses: StatusInstance[]
  enemyStatuses: StatusInstance[]
  activeMoves: Move[]
  inventory: ItemId[]
  battleMode: 'fight' | 'items'
  onSetBattleMode: (mode: 'fight' | 'items') => void
  promotionTitle?: string
  playerMaxHp: number
  /** Stock Options balance shown next to the floor counter. */
  stockOptions?: number
  /** Tap on the text box: fast-forward the current turn's playback. */
  onTextTap?: () => void
  /** Typewriter speed for the battle text box (0 = instant). */
  textMsPerChar?: number
}) {
  const act = getAct(floor)
  const sc = getScene(act, Math.min(floor % 10, 4))
  const [showLog, setShowLog] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Scrollback opens at the latest line.
  useEffect(() => {
    if (showLog) logEndRef.current?.scrollIntoView()
  }, [showLog, log.length])

  // Keyboard: 1-4 fire the corresponding move on the player's turn.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (turn !== 'player' || battleMode !== 'fight') return
      const idx = ['1', '2', '3', '4'].indexOf(e.key)
      if (idx < 0 || idx >= activeMoves.length) return
      if (idx < playerPp.length && playerPp[idx] <= 0 && activeMoves.length > 1) return
      onMove(idx)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn, battleMode, activeMoves, playerPp, onMove])

  return (
    <div
      className={screenShake ? 'screen-shake' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: `linear-gradient(180deg, rgba(9,17,31,.90) 0%, rgba(13,19,32,.92) 54%, ${sc.floor} 54%, ${sc.floorDk} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SceneBackdrop act={act} palette={sc} />

      {/* Wainscoting line + floorboards per act */}
      {act <= 2 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: act === 1 ? '54%' : '53%',
              left: 0,
              right: 0,
              height: 4,
              background: sc.accent,
              opacity: act === 1 ? 0.4 : 0.5,
              zIndex: 1,
            }}
          />
          {(act === 1 ? [60, 70, 82] : [62, 74]).map((pct, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${pct}%`,
                left: 0,
                right: 0,
                height: 1,
                background: sc.floorDk,
                opacity: act === 1 ? 0.2 : 0.15,
                zIndex: 1,
              }}
            />
          ))}
        </>
      )}
      {act === 3 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '53%',
              left: 0,
              right: 0,
              height: 5,
              background: 'linear-gradient(90deg, #B8860B, #FFD700, #B8860B)',
              opacity: 0.6,
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '55%',
              bottom: 0,
              left: '35%',
              right: '35%',
              background: 'linear-gradient(180deg, #8B0000 0%, #B71C1C 100%)',
              opacity: 0.3,
              zIndex: 1,
            }}
          />
        </>
      )}

      {moveTypeColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: moveTypeColor,
            opacity: 0.15,
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'flash-fade 0.4s ease-out forwards',
          }}
        />
      )}

      <div className={styles.battlefield}>
        <div className={styles.enemyDossier}>
          <div className={styles.dossierKicker}>ENEMY DOSSIER</div>
          <HpBar
            current={enemyHp}
            max={enemy.maxHp}
            label={enemy.name.toUpperCase()}
            isEnemy
            accent={TYPE_COLORS[enemy.types[0]]}
          />
          <div className={styles.typeRow}>
            {enemy.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <StatusBadges statuses={enemyStatuses} />
          <div className={styles.intentLine}>INTENT: BLOCK PROMOTION</div>
        </div>

        <div style={{ position: 'absolute', top: '4%', right: 8, zIndex: 2 }}>
          <StagedSprite
            spriteId={enemy.spriteId}
            size={164}
            animState={enemyAnim}
            flip
            ring={TYPE_COLORS[enemy.types[0]]}
            active={turn === 'enemy'}
          />
        </div>

        <div style={{ position: 'absolute', bottom: '2%', left: 12, zIndex: 2 }}>
          <StagedSprite
            spriteId={player.spriteId}
            size={154}
            animState={playerAnim}
            ring={TYPE_COLORS[player.types[0]]}
            active={turn === 'player'}
          />
        </div>

        <div className={styles.playerResourcePanel}>
          <div className={styles.dossierKicker}>PLAYER RESOURCES</div>
          <HpBar
            current={playerHp}
            max={playerMaxHp}
            label={(promotionTitle || player.name).toUpperCase()}
            accent={TYPE_COLORS[player.types[0]]}
            level={level}
          />
          <StatusBadges statuses={playerStatuses} />
          <div style={{ marginTop: 2 }}>
            <XpBar xp={xp} xpToNext={xpToNext} level={level} />
          </div>
        </div>

        <div className={styles.floorCounter}>
          <span className={styles.floorNum}>
            FLOOR <b>{floor}</b>/{TOTAL_FLOORS}
          </span>
          {stockOptions !== undefined && (
            <span className={styles.floorStock}>{stockOptions} OPTIONS</span>
          )}
        </div>

        {damagePopups.map((p) => (
          <DamageNumber key={p.id} popup={p} />
        ))}
      </div>

      {showLog && (
        <div className={styles.logOverlay} onClick={() => setShowLog(false)}>
          <div
            className={styles.logHistory}
            role="log"
            aria-label="Battle log"
            onClick={(e) => e.stopPropagation()}
          >
            {log.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <div ref={logEndRef} />
          </div>
          <button className={styles.logClose} onClick={() => setShowLog(false)}>
            CLOSE
          </button>
        </div>
      )}

      <div className={styles.commandDeck}>
        {log.length > 0 && (
          <TextBox
            lines={
              log.length >= 2 ? [log[log.length - 2], log[log.length - 1]] : [log[log.length - 1]]
            }
            showArrow={turn !== 'player'}
            onAdvance={onTextTap}
            msPerChar={textMsPerChar}
          />
        )}

        {turn === 'player' && (
          <>
            <div className={styles.commandHint}>TAP A MOVE • HOLD THE LADDER</div>
            {/* Mode tabs */}
            <div className={styles.tabs}>
              <button
                onClick={() => onSetBattleMode('fight')}
                aria-pressed={battleMode === 'fight'}
                className={`${styles.tab} ${battleMode === 'fight' ? styles.tabActive : ''}`}
              >
                FIGHT
              </button>
              <button
                onClick={() => onSetBattleMode('items')}
                aria-pressed={battleMode === 'items'}
                className={`${styles.tab} ${battleMode === 'items' ? styles.tabActive : ''}`}
              >
                ITEMS
                {inventory.length > 0 && (
                  <span className={styles.tabBadge}>{inventory.length}</span>
                )}
              </button>
              <button
                onClick={() => setShowLog(true)}
                className={styles.tab}
                style={{ marginLeft: 'auto' }}
                aria-label="Battle log history"
              >
                LOG
              </button>
            </div>

            {battleMode === 'fight' ? (
              <div className={styles.cardGrid}>
                {activeMoves.map((m, i) => (
                  <MoveButton
                    key={m.name}
                    move={m}
                    currentPp={i < playerPp.length ? playerPp[i] : m.pp}
                    disabled={i < playerPp.length && playerPp[i] <= 0}
                    onClick={() => onMove(i)}
                    effectiveness={
                      getTypeMultiplier(m.type, enemy.types).mult > 1
                        ? 'super'
                        : getTypeMultiplier(m.type, enemy.types).mult < 1
                          ? 'weak'
                          : null
                    }
                  />
                ))}
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {inventory.length === 0 ? (
                  <div className={styles.noItems}>No items</div>
                ) : (
                  inventory.map((itemId, i) => {
                    const item = ITEMS[itemId]
                    return (
                      <button
                        key={`${itemId}-${i}`}
                        className={styles.itemBtn}
                        onClick={() => onUseItem(i)}
                      >
                        <div className={styles.itemName}>
                          <span style={{ fontSize: 14 }}>{item.emoji}</span>
                          <span style={{ fontSize: 9 }}>{item.name}</span>
                        </div>
                        <div className={styles.itemDesc}>{item.desc}</div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
