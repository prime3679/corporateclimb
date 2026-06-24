import styles from './HpBar.module.css'

export default function HpBar({
  current,
  max,
  label,
  isEnemy,
  accent,
  level,
}: {
  current: number
  max: number
  label: string
  isEnemy?: boolean
  /** Leading/trailing accent-bar color (defaults to the combatant's role). */
  accent?: string
  /** Optional explicit level for player resource plates. */
  level?: number
}) {
  // Clamp display to the meter's range — a tampered or stale save can
  // carry current HP above max, which would render e.g. "200 / 110".
  const shown = Math.max(0, Math.min(max, current))
  const pct = (shown / max) * 100
  const fill =
    pct > 50
      ? 'linear-gradient(90deg, var(--cc-hp-high), var(--cc-hp-high-2))'
      : pct > 25
        ? 'linear-gradient(90deg, var(--cc-hp-mid), var(--cc-hp-mid-2))'
        : 'linear-gradient(90deg, var(--cc-hp-low), var(--cc-hp-low-2))'
  const lvl = level ?? (isEnemy ? Math.ceil(max / 25) : null)
  const bar = accent ?? (isEnemy ? 'var(--cc-type-strategy)' : 'var(--cc-gold)')

  return (
    <div
      className={`${styles.plate} ${isEnemy ? styles.enemy : styles.player}`}
      style={{ '--plate-accent': bar } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span className={styles.name}>{label}</span>
        {lvl !== null && (
          <span className={styles.level}>
            <span className={styles.levelPrefix}>Lv</span>
            {lvl}
          </span>
        )}
      </div>
      <div className={styles.barRow}>
        <span className={styles.hpLabel}>HP</span>
        <div
          className={styles.track}
          role="meter"
          aria-label={`${label} HP`}
          aria-valuenow={shown}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div className={styles.fill} style={{ width: `${pct}%`, background: fill }} />
        </div>
        <span className={styles.numbers}>
          {shown}
          <span className={styles.numbersMax}>/{max}</span>
        </span>
      </div>
    </div>
  )
}
