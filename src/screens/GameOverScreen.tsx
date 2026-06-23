import { Button, IconChip } from '@/ui'
import styles from './InterludeScreen.module.css'

const DEFEAT_FLAVOR: [number, number, string][] = [
  [1, 5, 'HR sends a polite rejection email. Better luck next quarter.'],
  [6, 10, 'Your badge stops working on Monday. So close to management.'],
  [11, 15, 'Security escorts you out. You could see the corner office from here.'],
  [16, 20, 'The board sends a form letter. Your parking spot is already reassigned.'],
  [21, 30, 'Your resignation makes the front page. At least they spelled your name right.'],
]

function getDefeatText(floor: number): string {
  for (const [lo, hi, text] of DEFEAT_FLAVOR) {
    if (floor >= lo && floor <= hi) return text
  }
  return 'The corporate ladder claims another soul.'
}

export default function GameOverScreen({
  floor,
  onRestart,
}: {
  floor: number
  onRestart: () => void
}) {
  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{
        gap: 24,
        padding: 30,
      }}
    >
      <div className={styles.board} />
      <div
        className={`t-display ${styles.header}`}
        style={{
          fontSize: 'var(--display-md)',
          color: 'var(--red)',
          textShadow: '2px 2px 0 #B71C1C',
        }}
      >
        GAME OVER
      </div>
      <IconChip glyph="EXIT" tone="red" size="lg" />
      <div
        className={`t-body ${styles.caption}`}
        style={{
          fontSize: 'var(--body-lg)',
          lineHeight: 1.2,
          maxWidth: 280,
        }}
      >
        You were eliminated on
        <br />
        Floor {floor}.
      </div>
      <div
        className={`t-body ${styles.caption}`}
        style={{
          fontSize: 'var(--body-md)',
          lineHeight: 1.2,
          maxWidth: 280,
          fontStyle: 'italic',
        }}
      >
        {getDefeatText(floor)}
      </div>
      <Button variant="primary" size="lg" onClick={onRestart}>
        TRY AGAIN
      </Button>
    </div>
  )
}
