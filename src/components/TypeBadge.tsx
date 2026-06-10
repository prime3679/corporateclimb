import { TYPE_COLORS, TYPE_LABELS } from '../data'

export default function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="t-display"
      style={{
        fontSize: 'var(--display-2xs)',
        padding: '2px 6px',
        background: TYPE_COLORS[type] || TYPE_COLORS.normal,
        color: '#fff',
        borderRadius: 3,
        letterSpacing: 1,
        lineHeight: 1.2,
      }}
    >
      {TYPE_LABELS[type] || 'NORM'}
    </span>
  )
}
