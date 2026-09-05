import { maxHpFor, memberName, type OfficeState, type PartyMember } from '@/engine/office'

export default function PartyStrip({ state }: { state: OfficeState }) {
  const members = state.encounter?.party ?? state.party
  const active = state.encounter?.activeIndex ?? 0
  return (
    <div
      aria-label="Party"
      style={{ display: 'flex', gap: 6, justifyContent: 'center', minHeight: 54 }}
    >
      {[0, 1, 2].map((i) => {
        const m = members[i]
        if (!m) {
          return (
            <div
              key={i}
              style={{
                width: 54,
                height: 54,
                border: '1px dashed var(--cc-line-faint)',
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--cc-text-dim)',
                fontSize: 10,
              }}
            >
              —
            </div>
          )
        }
        return <Chip key={m.slot} member={m} state={state} active={i === active} />
      })}
    </div>
  )
}

function Chip({
  member,
  state,
  active,
}: {
  member: PartyMember
  state: OfficeState
  active: boolean
}) {
  const max = maxHpFor(state, member)
  const out = member.hp <= 0
  return (
    <div
      style={{
        width: 88,
        height: 54,
        border: `1px solid ${active ? 'var(--cc-gold)' : 'var(--cc-line)'}`,
        borderRadius: 8,
        padding: '4px 6px',
        background: out ? 'rgba(13,19,32,.5)' : 'var(--cc-surface-2)',
        opacity: out ? 0.55 : 1,
      }}
    >
      <div
        className="t-display"
        style={{ fontSize: 10, color: 'var(--paper)', letterSpacing: 0.6 }}
      >
        {active ? '● ' : ''}
        {member.def.kind === 'lead' ? 'YOU' : memberName(member).toUpperCase()}
        {out ? ' OUT' : ''}
      </div>
      <div className="t-body" style={{ fontSize: 11, color: 'var(--text-main)' }}>
        {member.hp}/{max}
      </div>
      <div style={{ height: 4, background: '#1b2433', borderRadius: 2, marginTop: 4 }}>
        <div
          style={{
            width: `${Math.max(0, (member.hp / max) * 100)}%`,
            height: '100%',
            background: out ? '#78909C' : 'var(--cc-heal)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  )
}
