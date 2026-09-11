import type { PlayerClass } from '@/types'
import {
  DAILY_MODIFIERS,
  buildShareGrid,
  getDailyDayNumber,
  getDailyModifier,
  getDailyStreak,
} from '@/daily'
import { Button } from '@/ui'
import DailyLeaderboard from '@/components/DailyLeaderboard'
import InstallNudge from '@/components/InstallNudge'
import { useShareFeedback } from './useShareFeedback'
import styles from './DailyResultScreen.module.css'

export default function DailyResultScreen({
  player,
  score,
  floorsCleared,
  totalTurns,
  totalDamageDealt,
  hpRemaining,
  won,
  seed,
  modifierId,
  onBack,
}: {
  player: PlayerClass
  score: number
  floorsCleared: number
  totalTurns: number
  totalDamageDealt: number
  hpRemaining: number
  won: boolean
  seed: number
  modifierId: string
  onBack: () => void
}) {
  const modifier = DAILY_MODIFIERS.find((m) => m.id === modifierId) ?? getDailyModifier(seed)
  const dayNum = getDailyDayNumber(seed)
  const grid = buildShareGrid(floorsCleared, won)
  const streak = getDailyStreak()

  const stars = won
    ? '\u2B50\u2B50\u2B50'
    : floorsCleared >= 10
      ? '\u2B50\u2B50'
      : floorsCleared >= 5
        ? '\u2B50'
        : ''

  const shareText = [
    `Corporate Climb Daily #${dayNum} ${stars}`,
    `${modifier.icon} ${modifier.name}`,
    grid,
    `${player.emoji} ${player.name} | Floor ${floorsCleared}/15`,
    `\u26A1 ${totalTurns} turns | \uD83D\uDCA5 ${totalDamageDealt.toLocaleString()} dmg`,
    `\uD83C\uDFC6 Score: ${score.toLocaleString()}${streak.current > 1 ? ` | \uD83D\uDD25 ${streak.current}-day streak` : ''}`,
    `corporateclimb.vercel.app`,
  ].join('\n')

  const { handleShare, shared, shareLabel } = useShareFeedback(shareText, 'SHARE RESULT')

  const stat = (label: string, value: React.ReactNode) => (
    <>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </>
  )

  return (
    <div className={`${styles.screen} ${won ? styles.won : ''}`}>
      <div className={`t-display ${styles.verdict}`}>
        DAILY #{dayNum} {won ? 'CLEARED' : 'FAILED'}
      </div>

      <div className={styles.modIcon}>{modifier.icon}</div>
      <div className={`t-display ${styles.modName}`}>{modifier.name.toUpperCase()}</div>

      {/* Score card */}
      <div className={styles.scoreCard}>
        <div className={`t-display ${styles.score}`}>{score.toLocaleString()}</div>
        <div className={`t-display ${styles.stats}`}>
          {stat(
            'CLASS',
            <>
              {player.emoji} {player.name}
            </>,
          )}
          {stat('FLOORS', `${floorsCleared}/15`)}
          {stat('TURNS', totalTurns)}
          {stat('DAMAGE', totalDamageDealt.toLocaleString())}
          {stat('HP LEFT', hpRemaining)}
        </div>
      </div>

      {/* Shareable floor grid + streak; one line on the wide canvas. */}
      <div className={styles.strip}>
        <pre aria-label={`Floor grid: ${floorsCleared} of 15 cleared`} className={styles.grid}>
          {grid}
        </pre>

        <div className={`t-display ${styles.streak}`}>
          STREAK: {streak.current}
          {streak.best > streak.current ? ` (BEST ${streak.best})` : ''}
        </div>
      </div>

      <Button
        variant="accent"
        size="md"
        onClick={handleShare}
        style={shared ? { background: 'var(--green)' } : undefined}
      >
        {shareLabel}
      </Button>

      <DailyLeaderboard
        seed={seed}
        score={score}
        classId={player.id}
        floorsCleared={floorsCleared}
        won={won}
      />

      <InstallNudge />

      <Button variant="ghost" size="md" onClick={onBack}>
        BACK TO TITLE
      </Button>
    </div>
  )
}
