export default function XpBar({
  xp,
  xpToNext,
  level,
}: {
  xp: number
  xpToNext: number
  level: number
}) {
  const pct = (xp / xpToNext) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        className="t-display"
        style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold-bright)' }}
      >
        Lv.{level}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'var(--ink)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #42A5F5, #66BB6A)',
            transition: 'width 0.8s ease',
            borderRadius: 3,
          }}
        />
      </div>
      <span
        className="t-body"
        style={{ fontSize: 'var(--body-sm)', lineHeight: 1, color: 'var(--muted-light)' }}
      >
        {xp}/{xpToNext}
      </span>
    </div>
  )
}
