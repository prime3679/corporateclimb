import { useState } from 'react'
import type { HallwayEvent } from '../types'

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        padding: 20,
        background: 'linear-gradient(180deg, #1A237E 0%, #263238 100%)',
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
        CHOOSE YOUR PATH
      </div>
      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-md)',
          lineHeight: 1.2,
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        Two opportunities ahead...
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 380 }}>
        {options.map((evt, i) => {
          const isHovered = hoveredIdx === i
          return (
            <button
              key={evt.id}
              onClick={() => onPick(evt)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '18px 12px',
                background: isHovered ? 'var(--ink-soft)' : 'var(--ink)',
                border: `var(--border-w) solid ${isHovered ? 'var(--gold)' : 'var(--ink-soft)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isHovered
                  ? 'var(--shadow-md), 0 0 16px rgba(255,193,7,0.3)'
                  : 'var(--shadow-md)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              <span style={{ fontSize: 32 }}>{evt.emoji}</span>
              <span
                className="t-display"
                style={{
                  fontSize: 'var(--display-2xs)',
                  color: 'var(--gold-bright)',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                {evt.title}
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
                {evt.desc.length > 60 ? evt.desc.slice(0, 57) + '...' : evt.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
