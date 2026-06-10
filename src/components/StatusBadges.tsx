import type { StatusInstance } from '../types'
import { STATUS_DEFS } from '../data'

export default function StatusBadges({ statuses }: { statuses: StatusInstance[] }) {
  if (statuses.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
      {statuses.map((s) => {
        const def = STATUS_DEFS[s.id]
        return (
          <span
            key={s.id}
            title={`${def.name} (${def.desc}) - ${s.turnsLeft} turns`}
            className="t-display"
            style={{
              background: def.color,
              color: '#fff',
              borderRadius: 4,
              padding: '2px 5px',
              fontSize: 'var(--display-2xs)',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              border: '1px solid rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: 10 }}>{def.icon}</span>
            <span>{s.turnsLeft}</span>
          </span>
        )
      })}
    </div>
  )
}
