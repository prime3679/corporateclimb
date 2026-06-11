import { Button } from '@/ui'

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 24,
        padding: 30,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-md)',
          color: 'var(--red)',
          textShadow: '2px 2px 0 #B71C1C',
        }}
      >
        GAME OVER
      </div>
      <div style={{ fontSize: 64 }}>&#x1F4BC;</div>
      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-lg)',
          color: 'var(--muted-light)',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 280,
        }}
      >
        You were eliminated on
        <br />
        Floor {floor}.
      </div>
      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-md)',
          color: 'var(--muted)',
          textAlign: 'center',
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
