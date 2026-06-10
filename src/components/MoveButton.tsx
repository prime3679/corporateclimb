import type { Move } from '../types'
import { STATUS_DEFS } from '../data'
import TypeBadge from './TypeBadge'
import styles from './MoveButton.module.css'

export default function MoveButton({
  move,
  currentPp,
  onClick,
  disabled,
}: {
  move: Move
  currentPp?: number
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button className={styles.move} onClick={onClick} disabled={disabled}>
      <div className={styles.header}>
        <span className={styles.name}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div className={styles.meta}>
        <span>
          PWR {move.dmg}
          {move.status ? ` ${STATUS_DEFS[move.status.id].icon}` : ''}
          {move.acc != null && move.acc < 100 ? ` ${move.acc}%` : ''}
        </span>
        <span>
          PP {currentPp ?? move.pp}/{move.pp}
        </span>
      </div>
    </button>
  )
}
