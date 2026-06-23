import { useState } from 'react'
import type { HallwayEvent } from '@/types'
import { IconChip, getIconGlyph } from '@/ui'
import styles from './InterludeScreen.module.css'

export default function RouteChoice({
  options,
  onPick,
}: {
  options: [HallwayEvent, HallwayEvent]
  onPick: (event: HallwayEvent) => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.warm}`}
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
          marginTop: 170,
        }}
      >
        CHOOSE YOUR PATH
      </div>
      <div
        className={`t-body ${styles.caption}`}
        style={{
          fontSize: 'var(--body-md)',
          lineHeight: 1.25,
          maxWidth: 296,
        }}
      >
        Two opportunities ahead. Pick your next office ambush.
      </div>

      <div className={styles.choiceGrid} style={{ gap: 12, maxWidth: 380 }}>
        {options.map((evt, i) => {
          const isHovered = hoveredIdx === i
          return (
            <button
              key={evt.id}
              onClick={() => onPick(evt)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`${styles.card} ${isHovered ? styles.cardActive : ''}`}
              style={{
                flex: 1,
                gap: 10,
                padding: '18px 12px',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              <IconChip
                glyph={getIconGlyph(evt.emoji, evt.title)}
                tone={i === 0 ? 'ember' : 'blue'}
                size="lg"
              />
              <span
                className="t-display"
                style={{
                  fontSize: 'var(--display-2xs)',
                  color: 'var(--gold-bright)',
                  textAlign: 'center',
                  lineHeight: 1.7,
                  textShadow: '0 1px 0 rgba(5,7,13,.38)',
                }}
              >
                {evt.title}
              </span>
              <div className={styles.rule} />
              <span
                className="t-body"
                style={{
                  fontSize: 'var(--body-sm)',
                  color: 'color-mix(in srgb, var(--muted-light) 86%, var(--paper) 14%)',
                  textAlign: 'center',
                  lineHeight: 1.22,
                  textShadow: '0 1px 0 rgba(5,7,13,.32)',
                }}
              >
                {evt.desc.length > 60 ? evt.desc.slice(0, 57) + '...' : evt.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
