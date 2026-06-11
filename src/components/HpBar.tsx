import styles from './HpBar.module.css'

export default function HpBar({
  current,
  max,
  label,
  isEnemy,
}: {
  current: number
  max: number
  label: string
  isEnemy?: boolean
}) {
  // Clamp display to the meter's range — a tampered or stale save can
  // carry current HP above max, which would render e.g. "200 / 110".
  const shown = Math.max(0, Math.min(max, current))
  const pct = (shown / max) * 100
  const color = pct > 50 ? '#48D868' : pct > 20 ? '#F8D030' : '#F85858'
  const lvl = isEnemy ? Math.ceil(max / 25) : '??'

  return (
    <div className={styles.plate}>
      <div className={styles.header}>
        <span className={styles.name}>{label}</span>
        <span className={styles.level}>
          <span className={styles.levelPrefix}>Lv</span>
          {lvl}
        </span>
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
          <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <div className={styles.numbers}>
        {shown}
        <span className={styles.numbersMax}> / {max}</span>
      </div>
    </div>
  )
}
