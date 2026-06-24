import { TYPE_COLORS, TYPE_LABELS } from '@/data'
import type { MoveType } from '@/types'

/** Saturated type chip — the system's only loud color. Space Grotesk
 *  caps on the type's hue, with a soft same-hue glow. */
export default function TypeBadge({ type }: { type: MoveType }) {
  const color = TYPE_COLORS[type] || TYPE_COLORS.normal
  return (
    <span
      style={{
        fontFamily: 'var(--cc-font-body)',
        fontWeight: 700,
        fontSize: 9,
        padding: '2px 6px',
        background: color,
        color: '#fff',
        borderRadius: 'var(--cc-r-chip)',
        letterSpacing: 'var(--cc-track-chip)',
        lineHeight: 1,
        textTransform: 'uppercase',
        boxShadow: `0 1px 5px ${color}66`,
      }}
    >
      {TYPE_LABELS[type] || 'NORM'}
    </span>
  )
}
