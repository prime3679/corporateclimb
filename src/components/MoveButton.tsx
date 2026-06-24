import type { Move } from '@/types'
import { STATUS_DEFS } from '@/data'
import TypeBadge from './TypeBadge'
import styles from './MoveButton.module.css'

export default function MoveButton({
  move,
  currentPp,
  onClick,
  disabled,
  effectiveness,
}: {
  move: Move
  currentPp?: number
  onClick: () => void
  disabled: boolean
  /** Type matchup hint against the current enemy. */
  effectiveness?: 'super' | 'weak' | null
}) {
  return (
    <button
      className={`${styles.move} ${styles[`type-${move.type}`]}`}
      data-testid="move-button"
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.header}>
        <span className={styles.name}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div className={styles.meta}>
        <span>
          <span className={styles.power}>{move.dmg}</span> PWR
          {move.status ? ` ${STATUS_DEFS[move.status.id].icon}` : ''}
          {move.acc != null && move.acc < 100 ? ` ${move.acc}%` : ''}
        </span>
        <span>
          {effectiveness === 'super' && (
            <span className={styles.effSuper} title="Super effective" aria-label="Super effective">
              ▲{' '}
            </span>
          )}
          {effectiveness === 'weak' && (
            <span
              className={styles.effWeak}
              title="Not very effective"
              aria-label="Not very effective"
            >
              ▼{' '}
            </span>
          )}
          PP {currentPp ?? move.pp}/{move.pp}
        </span>
      </div>
    </button>
  )
}
