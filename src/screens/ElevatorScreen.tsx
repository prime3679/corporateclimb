import { useEffect } from 'react'
import { CURRENCY_ICON } from '@/data'
import { IconChip, getIconGlyph } from '@/ui'
import styles from './InterludeScreen.module.css'

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
    tone: 'blue' | 'gold' | 'muted'
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
        padding: '20px 14px',
        background:
          'linear-gradient(180deg, rgba(255,255,255,.09), transparent 24%), linear-gradient(180deg, rgba(42,30,21,.98), rgba(14,20,32,.96))',
        border: `1px solid ${opts.border}`,
        borderRadius: 20,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md), inset 0 1px 0 rgba(255,255,255,.1)',
      }}
    >
      <IconChip glyph={getIconGlyph(opts.icon, opts.title)} tone={opts.tone} size="lg" />
      <span
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: opts.border,
          textAlign: 'center',
          lineHeight: 1.7,
          textShadow: '0 1px 0 rgba(5,7,13,.34)',
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
            color: 'color-mix(in srgb, var(--muted-light) 88%, var(--paper) 12%)',
            textAlign: 'center',
            lineHeight: 1.22,
            textShadow: '0 1px 0 rgba(5,7,13,.3)',
          }}
        >
          {line}
        </span>
      ))}
    </button>
  )

  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.executive}`}
      style={{
        gap: 16,
        padding: '20px 20px 28px',
        justifyContent: 'flex-start',
      }}
    >
      <div className={styles.board} />
      <div className={`${styles.glow} ${styles.glowTop}`} />
      <div className={styles.columns}>
        <div className={styles.column} />
        <div className={styles.column} />
        <div className={styles.column} />
      </div>
      <div
        className={`t-display ${styles.header}`}
        style={{
          fontSize: 'var(--display-xs)',
          letterSpacing: 2,
          marginTop: 166,
        }}
      >
        THE ELEVATOR BANK
      </div>
      <div className={`t-body ${styles.caption}`} style={{ fontSize: 'var(--body-md)' }}>
        Floor {floorNumber}. Three elevators. One choice.
      </div>

      <div className={styles.choiceGrid} style={{ gap: 10, maxWidth: 390 }}>
        {card({
          key: 'standard',
          elite: false,
          icon: '🛗',
          title: '[1] STANDARD FLOOR',
          lines: ['The meeting on your calendar.', 'Normal fight, normal payout.'],
          border: 'rgba(167,196,255,0.34)',
          tone: 'blue',
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
          border: 'rgba(255,211,77,0.34)',
          tone: 'gold',
        })}
        <button
          onClick={onPickMystery}
          className={styles.card}
          style={{
            flex: 1,
            gap: 10,
            padding: '20px 14px',
            background:
              'linear-gradient(180deg, rgba(255,255,255,.06), transparent 24%), linear-gradient(180deg, rgba(27,28,35,.98), rgba(10,12,19,.96))',
            border: '1px dashed rgba(214,224,236,0.62)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md), inset 0 1px 0 rgba(255,255,255,.08)',
          }}
        >
          <IconChip glyph={getIconGlyph('🚪', 'MYS')} tone="muted" size="lg" />
          <span
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'color-mix(in srgb, var(--paper) 78%, var(--muted-light) 22%)',
              textAlign: 'center',
              lineHeight: 1.7,
              textShadow: '0 1px 0 rgba(5,7,13,.42)',
            }}
          >
            [3] MYSTERY FLOOR
          </span>
          <span
            className="t-body"
            style={{
              fontSize: 'var(--body-sm)',
              color: 'color-mix(in srgb, var(--paper) 86%, var(--muted-light) 14%)',
              textAlign: 'center',
              lineHeight: 1.22,
              textShadow: '0 1px 0 rgba(5,7,13,.38)',
            }}
          >
            Unmarked button. HR won’t say.
          </span>
        </button>
      </div>
    </div>
  )
}
