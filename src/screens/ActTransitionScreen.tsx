import { useState, useEffect } from 'react'
import { IconChip } from '@/ui'
import styles from './InterludeScreen.module.css'

const ACT_DATA: Record<
  number,
  {
    title: string
    subtitle: string
    flavor: string
    bg: string
    accent: string
    subtitleShadow: string
  }
> = {
  2: {
    title: 'ACT 2',
    subtitle: 'MANAGEMENT',
    flavor:
      "You've proven yourself on the ground floor. But the real game starts now. Politics. Budgets. Power.",
    bg: styles.executive,
    accent: '#a7c4ff',
    subtitleShadow: '2px 2px 0 rgba(33, 61, 118, 0.9)',
  },
  3: {
    title: 'ACT 3',
    subtitle: 'EXECUTIVE',
    flavor:
      'The org chart bows to you. But above the clouds, the air is thin and the stakes are existential.',
    bg: styles.warm,
    accent: '#ffd8a1',
    subtitleShadow: '2px 2px 0 rgba(122, 55, 15, 0.92)',
  },
}

export default function ActTransitionScreen({
  act,
  onContinue,
}: {
  act: number
  onContinue: () => void
}) {
  const [phase, setPhase] = useState(0)
  const data = ACT_DATA[act]

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1400)
    const t4 = setTimeout(() => setPhase(4), 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  if (!data) return null

  return (
    <div
      className={`premium-screen ${styles.screen} ${data.bg}`}
      style={{
        gap: 28,
        padding: 30,
        cursor: 'pointer',
      }}
      onClick={onContinue}
    >
      <div className={styles.board} />
      <div className={`${styles.glow} ${styles.glowTop}`} />
      <div className={styles.columns}>
        <div className={styles.column} />
        <div className={styles.column} />
        <div className={styles.column} />
      </div>
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'color-mix(in srgb, var(--muted-light) 64%, var(--gold-bright) 36%)',
          letterSpacing: 8,
          opacity: phase >= 1 ? 1 : 0.42,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          textShadow: '0 1px 0 rgba(5,7,13,.34)',
        }}
      >
        {data.title}
      </div>

      <div className={styles.transitionStack}>
        <div className={styles.transitionPlate}>
          <div className={styles.content} style={{ gap: 18 }}>
            <IconChip
              glyph={act === 2 ? 'MGMT' : 'C-SU'}
              tone={act === 2 ? 'blue' : 'ember'}
              size="lg"
              style={{
                opacity: phase >= 1 ? 1 : 0.72,
                transform: phase >= 1 ? 'scale(1)' : 'scale(0.96)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            />
            <div
              className={`t-display ${styles.header}`}
              style={{
                fontSize: 'var(--display-md)',
                color: data.accent,
                lineHeight: 1.8,
                textShadow: data.subtitleShadow,
                letterSpacing: 4,
                opacity: phase >= 2 ? 1 : 0.34,
                transform: phase >= 2 ? 'scale(1)' : 'scale(0.9)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
              }}
            >
              {data.subtitle}
            </div>

            <div
              className={styles.rule}
              style={{
                width: 92,
                background: `linear-gradient(90deg, transparent, ${data.accent}, transparent)`,
                opacity: phase >= 2 ? 1 : 0.38,
                transition: 'opacity 0.6s ease',
              }}
            />

            <div
              className={`t-body ${styles.caption}`}
              style={{
                fontSize: 'var(--body-md)',
                lineHeight: 1.2,
                maxWidth: 300,
                fontStyle: 'italic',
                opacity: phase >= 3 ? 1 : 0.22,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
              }}
            >
              {data.flavor}
            </div>
          </div>
        </div>
        <div
          className={`t-body ${styles.transitionMeta}`}
          style={{
            fontSize: 'var(--body-sm)',
            opacity: phase >= 4 ? 1 : 0.62,
            transition: 'opacity 0.6s ease',
          }}
        >
          Promotion cleared. The next tier is live.
        </div>
      </div>

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'color-mix(in srgb, var(--muted-light) 82%, var(--paper) 18%)',
          opacity: phase >= 4 ? 1 : 0.24,
          transition: 'opacity 0.6s ease',
          animation: phase >= 4 ? 'pulse 2s infinite' : 'none',
          textShadow: '0 1px 0 rgba(5,7,13,.32)',
        }}
      >
        TAP TO CONTINUE
      </div>
    </div>
  )
}
