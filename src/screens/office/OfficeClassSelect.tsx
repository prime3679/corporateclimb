import { useEffect, useState, type CSSProperties } from 'react'
import type { PlayerClass } from '@/types'
import { PLAYER_CLASSES } from '@/data'
import TypeBadge from '@/components/TypeBadge'
import { Button, IconChip, getIconGlyph } from '@/ui'
import { SFX } from '@/sfx'
import Headshot from './Headshot'
import { ringColorFor } from './ringColor'
import { CLIMB_FLOORS, FLOOR_INK } from './floorInk'
import styles from './OfficeClassSelect.module.css'

/**
 * Office-only role select. Classic ClassSelect is a different screen and
 * must stay visually untouched. Teaching copy from #85 is kept; this file
 * only raises the chrome to Office inks / hairlines / Headshot portraits.
 */
export default function OfficeClassSelect({
  onSelect,
  onBack,
}: {
  onSelect: (cls: PlayerClass) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState(0)
  const cls = PLAYER_CLASSES[selected]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        SFX.menuSelect()
        setSelected((i) => (i + PLAYER_CLASSES.length - 1) % PLAYER_CLASSES.length)
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        SFX.menuSelect()
        setSelected((i) => (i + 1) % PLAYER_CLASSES.length)
        return
      }
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const idx = Number(e.key) - 1
        if (PLAYER_CLASSES[idx]) {
          SFX.menuSelect()
          setSelected(idx)
        }
        return
      }
      if (e.key === 'Enter') {
        if (document.activeElement instanceof HTMLButtonElement) return
        e.preventDefault()
        onSelect(PLAYER_CLASSES[selected])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        SFX.menuBack()
        onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack, onSelect, selected])

  return (
    <div className={`premium-screen ${styles.screen}`}>
      <button
        type="button"
        className={styles.back}
        onClick={() => {
          SFX.menuBack()
          onBack()
        }}
        aria-label="Back to title"
      >
        ‹ Title
      </button>

      <div className={styles.eyebrow}>YOUR ROLE · FLOORS 1–5</div>
      <h1 className={styles.title}>SELECT CAREER ARCHETYPE</h1>
      <div className={styles.rule} aria-hidden />

      <ol className={styles.climb} aria-label="Floors 1 through 5">
        {CLIMB_FLOORS.map((row) => (
          <li key={row.id} style={{ '--fl': FLOOR_INK[row.number] } as CSSProperties}>
            <b>{row.number}</b>
            <span>{row.name}</span>
          </li>
        ))}
      </ol>

      <p className={styles.blurb}>Reception to the board. Five floors. One badge at a time.</p>

      <div className={styles.roles} role="radiogroup" aria-label="Career archetype">
        {PLAYER_CLASSES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            onClick={() => {
              if (i !== selected) SFX.menuSelect()
              setSelected(i)
            }}
            aria-checked={selected === i}
            aria-pressed={selected === i}
            className={`${styles.role} ${selected === i ? styles.roleOn : ''}`}
          >
            <Headshot spriteId={c.spriteId} size={44} ring={ringColorFor(c.types, true)} />
            <span className={styles.roleName}>{c.name}</span>
            {/* Keys 1–3 already select; the wide canvas has room to say so. */}
            <kbd className={styles.roleKey} aria-hidden="true">
              {i + 1}
            </kbd>
          </button>
        ))}
      </div>

      <div className={styles.plate}>
        <div className={styles.hero}>
          <Headshot spriteId={cls.spriteId} size={72} ring={ringColorFor(cls.types, true)} />
          <div>
            <div className={styles.heroName}>{cls.name}</div>
            <div className={styles.heroDesc}>{cls.desc}</div>
          </div>
        </div>

        <div className={styles.stats}>
          {(
            [
              ['HP', cls.maxHp, 100, 'var(--cc-hp-high)'],
              ['ATK', cls.atk, 20, 'var(--cc-type-strategy)'],
              ['DEF', cls.def, 20, 'var(--cc-info)'],
              ['SPD', cls.spd, 20, 'var(--cc-amber-deep)'],
            ] as const
          ).map(([label, val, max, color]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statTrack}>
                <span
                  className={styles.statFill}
                  style={{ width: `${(val / max) * 100}%`, '--stat': color } as CSSProperties}
                />
              </span>
              <span className={styles.statVal}>{val}</span>
            </div>
          ))}
        </div>

        <div className={styles.perk}>
          <IconChip glyph={getIconGlyph(cls.perk.icon, cls.perk.name)} tone="gold" size="sm" />
          <div>
            <div className={styles.perkName}>{cls.perk.name}</div>
            <div className={styles.perkDesc}>{cls.perk.desc}</div>
          </div>
        </div>

        <div className={styles.movesLabel}>MOVES</div>
        <div className={styles.moves}>
          {cls.moves.map((m) => (
            <div key={m.name} className={styles.move}>
              <div className={styles.moveHead}>
                <span className={styles.moveName}>{m.name}</span>
                <TypeBadge type={m.type} />
              </div>
              <span className={styles.moveDesc}>{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        autoFocus
        className={styles.accept}
        onClick={() => onSelect(cls)}
      >
        ACCEPT OFFER
      </Button>
    </div>
  )
}
