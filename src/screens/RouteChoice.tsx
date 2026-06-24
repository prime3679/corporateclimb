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
  const formatRouteCopy = (desc: string) =>
    desc
      .replace(/\.{3,}\s*$/, '.')
      .replace(/\s+/g, ' ')
      .trim()

  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{
        padding: '24px 20px 30px',
      }}
    >
      <div className={styles.board} />
      <div className={styles.columns}>
        <div className={styles.column} />
        <div className={styles.column} />
        <div className={styles.column} />
      </div>
      <div className={styles.stage}>
        <div className={styles.headlineStack}>
          <div
            className={`t-display ${styles.header}`}
            style={{
              fontSize: 'var(--display-xs)',
              letterSpacing: 2,
            }}
          >
            CHOOSE YOUR PATH
          </div>
          <div
            className={`t-body ${styles.caption}`}
            style={{
              fontSize: 'var(--body-md)',
              lineHeight: 1.25,
              maxWidth: 312,
            }}
          >
            Two opportunities ahead. Pick your next office ambush.
          </div>
        </div>

        <div className={styles.choiceGrid} style={{ gap: 12, maxWidth: 396 }}>
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
                  gap: 12,
                  minHeight: 224,
                  padding: '20px 14px 18px',
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
                    lineHeight: 1.55,
                    textShadow: '0 1px 0 rgba(5,7,13,.38)',
                  }}
                >
                  {evt.title}
                </span>
                <div className={styles.rule} />
                <div className={styles.cardBody}>
                  <span
                    className="t-body"
                    style={{
                      fontSize: 'var(--body-sm)',
                      color: 'color-mix(in srgb, var(--muted-light) 86%, var(--paper) 14%)',
                      textAlign: 'center',
                      lineHeight: 1.28,
                      textShadow: '0 1px 0 rgba(5,7,13,.32)',
                    }}
                  >
                    {formatRouteCopy(evt.desc)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
