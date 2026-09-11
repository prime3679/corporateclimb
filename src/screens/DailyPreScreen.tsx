import { useState } from 'react'
import type { PlayerClass } from '@/types'
import { PLAYER_CLASSES } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import {
  getDailySeed,
  getDailyModifier,
  getDailyStreak,
  getRecentDailyHistory,
  hasPlayedToday,
  getDailyResult,
  getDailyDayNumber,
} from '@/daily'
import { Button } from '@/ui'
import styles from './DailyPreScreen.module.css'

export default function DailyPreScreen({
  onStart,
  onBack,
}: {
  onStart: (cls: PlayerClass) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState(0)
  const sprites = getSpriteUrls()
  const seed = getDailySeed()
  const modifier = getDailyModifier(seed)
  const alreadyPlayed = hasPlayedToday()
  const pastResult = getDailyResult(seed)

  const isReorg = modifier.id === 'reorg'
  const dayNum = getDailyDayNumber(seed)
  const streak = getDailyStreak()
  const history = getRecentDailyHistory(7)

  return (
    <div className={styles.screen}>
      <div className={`t-display ${styles.title}`}>DAILY CHALLENGE #{dayNum}</div>

      {/* Brief (left on the wide canvas) and roster (right) are `display:
          contents` on the phone column, so the stack there is untouched. */}
      <div className={styles.brief}>
        {/* Modifier card */}
        <div className={styles.modCard}>
          <div className={styles.modIcon}>{modifier.icon}</div>
          <div className={`t-display ${styles.modName}`}>{modifier.name.toUpperCase()}</div>
          <div className={`t-body ${styles.modDesc}`}>{modifier.desc}</div>
        </div>

        <div className={`t-display ${styles.rules}`}>
          NG+1 DIFFICULTY &bull; 15 FLOORS &bull; NO SAVES
        </div>

        {/* Streak + last-7-days strip */}
        <div className={styles.streakRow}>
          {streak.current > 0 && (
            <div className={`t-display ${styles.streak}`}>
              STREAK {streak.current} DAY{streak.current === 1 ? '' : 'S'}
            </div>
          )}
          <div
            className={styles.days}
            role="img"
            aria-label={`Last 7 days: ${history.filter((h) => h.result).length} played`}
          >
            {history.map(({ seed: s, result }) => (
              <span
                key={s}
                title={`Daily #${getDailyDayNumber(s)}`}
                className={`${styles.day} ${
                  result ? (result.won ? styles.dayWon : styles.dayLost) : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.roster}>
        {/* Class selection (unless reorg) */}
        {!isReorg && !alreadyPlayed && (
          <div className={styles.classes}>
            {PLAYER_CLASSES.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className={`${styles.classCard} ${selected === i ? styles.classOn : ''}`}
              >
                <div className={`sprite-idle ${styles.classSprite}`}>
                  <img src={sprites[c.spriteId]} alt="" draggable={false} />
                </div>
                <span className={`t-display ${styles.classLabel}`}>{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {alreadyPlayed && pastResult ? (
          <div className={styles.result}>
            <div className={`t-display ${styles.resultLabel}`}>TODAY'S RESULT</div>
            <div className={`t-body ${styles.resultLine}`}>
              {pastResult.won ? 'CLEARED' : 'FELL'} &bull; Floor {pastResult.floorsCleared}/15
            </div>
            <div className={`t-display ${styles.resultScore}`}>
              {pastResult.score.toLocaleString()}
            </div>
            <div className={`t-body ${styles.resultNote}`}>
              Come back tomorrow for a new challenge
            </div>
          </div>
        ) : (
          <Button variant="accent" size="lg" onClick={() => onStart(PLAYER_CLASSES[selected])}>
            BEGIN CHALLENGE
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" className={styles.back} onClick={onBack}>
        BACK
      </Button>
    </div>
  )
}
