import { useEffect } from 'react'
import { CURRENCY_ICON } from '@/data'

/**
 * The elevator bank between floors: ride to the scheduled meeting,
 * take the Executive Track (an elite enemy for double payout and a
 * Status Symbol), or gamble on the unmarked Mystery Floor. Keys 1/2/3
 * select, matching the battle hotkeys.
 */
export default function ElevatorScreen({
  floorNumber,
  onPick,
  onPickMystery,
}: {
  /** 1-based floor number being entered. */
  floorNumber: number
  onPick: (elite: boolean) => void
  onPickMystery: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') onPick(false)
      if (e.key === '2') onPick(true)
      if (e.key === '3') onPickMystery()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPick, onPickMystery])

  const card = (opts: {
    elite: boolean
    icon: string
    title: string
    lines: string[]
    border: string
    key: string
  }) => (
    <button
      key={opts.key}
      onClick={() => onPick(opts.elite)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '20px 12px',
        background: 'var(--ink)',
        border: `var(--border-w) solid ${opts.border}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <span style={{ fontSize: 34 }}>{opts.icon}</span>
      <span
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: opts.border,
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {opts.title}
      </span>
      {opts.lines.map((line) => (
        <span
          key={line}
          className="t-body"
          style={{
            fontSize: 'var(--body-sm)',
            color: 'var(--muted-light)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {line}
        </span>
      ))}
    </button>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        padding: 20,
        background: 'linear-gradient(180deg, #1A1A2E 0%, #263238 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          textShadow: '2px 2px 0 #E65100',
          textAlign: 'center',
          letterSpacing: 2,
        }}
      >
        🛗 THE ELEVATOR BANK
      </div>
      <div
        className="t-body"
        style={{ fontSize: 'var(--body-md)', color: 'var(--muted)', textAlign: 'center' }}
      >
        Floor {floorNumber}. Three elevators. One choice.
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 390 }}>
        {card({
          key: 'standard',
          elite: false,
          icon: '🛗',
          title: '[1] STANDARD FLOOR',
          lines: ['The meeting on your calendar.', 'Normal fight, normal payout.'],
          border: 'var(--sky)',
        })}
        {card({
          key: 'elite',
          elite: true,
          icon: '⚠️',
          title: '[2] EXECUTIVE TRACK',
          lines: [
            'An ELITE version of the boss.',
            `2× ${CURRENCY_ICON} payout · drops a Status Symbol.`,
          ],
          border: 'var(--gold)',
        })}
        <button
          onClick={onPickMystery}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '20px 12px',
            background: 'var(--ink)',
            border: 'var(--border-w) dashed var(--muted)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <span style={{ fontSize: 34 }}>🚪</span>
          <span
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--muted-light)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            [3] MYSTERY FLOOR
          </span>
          <span
            className="t-body"
            style={{
              fontSize: 'var(--body-sm)',
              color: 'var(--muted-light)',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Unmarked button. HR won’t say.
          </span>
        </button>
      </div>
    </div>
  )
}
