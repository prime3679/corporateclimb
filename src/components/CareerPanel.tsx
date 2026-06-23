import type { PlayerClass } from '@/types'
import { CURRENCY_NAME, RELICS, TOTAL_FLOORS, groupPerks } from '@/data'
import type { RunState } from '@/engine'
import { DAILY_FLOOR_COUNT } from '@/daily'
import { Button, IconChip, Panel, getIconGlyph } from '@/ui'
import styles from './CareerPanel.module.css'

/**
 * Read-only mid-run overview: current title, effective stats (with the
 * bonus earned over the base class), Stock Options, and every perk
 * picked so far. Purely presentational — everything shown is derived
 * from RunState by the caller.
 */
export default function CareerPanel({
  run,
  baseClass,
  effective,
  title,
  onClose,
}: {
  run: RunState
  baseClass: PlayerClass
  effective: PlayerClass
  title: string
  onClose: () => void
}) {
  const perks = groupPerks(run.perks)
  const totalFloors = run.mode.kind === 'daily' ? DAILY_FLOOR_COUNT : TOTAL_FLOORS

  const stat = (label: string, value: number, base: number, meta?: string) => (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {value > base ? (
        <span className={styles.statDelta}>+{value - base}</span>
      ) : meta ? (
        <span className={styles.statMeta}>{meta}</span>
      ) : null}
    </div>
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <Panel
        variant="dark"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Career profile"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.title}>CAREER PROFILE</div>
        <div className={styles.jobTitle}>{title}</div>
        <div className={styles.subline}>
          {baseClass.name} &bull; Lv.{run.level} &bull; Floor {run.floor + 1}/{totalFloors}
          {run.ngPlus > 0 && run.mode.kind === 'normal' && ` • NG+${run.ngPlus}`}
        </div>

        <div className={styles.statGrid}>
          {stat('HP', effective.maxHp, baseClass.maxHp)}
          {stat('ATK', effective.atk, baseClass.atk)}
          {stat('DEF', effective.def, baseClass.def)}
          {stat('OPT', run.stockOptions, Number.POSITIVE_INFINITY, 'STOCK')}
        </div>

        <div className={styles.sectionLabel}>PERKS ({run.perks.length})</div>
        {perks.length === 0 ? (
          <div className={styles.empty}>
            No perks yet — your first pick comes with the promotion after floor 5.
          </div>
        ) : (
          <div className={styles.perkList}>
            {perks.map(({ perk, count }) => (
              <div key={perk.id} className={styles.perkRow}>
                <IconChip
                  glyph={getIconGlyph(perk.icon, perk.name)}
                  tone="gold"
                  size="sm"
                  className={styles.perkIcon}
                />
                <span className={styles.perkText}>
                  <span className={styles.perkName}>{perk.name}</span>
                  <span className={styles.perkDesc}>{perk.desc}</span>
                </span>
                {count > 1 && <span className={styles.perkCount}>×{count}</span>}
              </div>
            ))}
          </div>
        )}

        {run.relics.length > 0 && (
          <>
            <div className={styles.sectionLabel}>STATUS SYMBOLS ({run.relics.length})</div>
            <div className={styles.perkList}>
              {run.relics.map((id) => {
                const relic = RELICS[id]
                if (!relic) return null
                return (
                  <div key={id} className={styles.perkRow}>
                    <IconChip
                      glyph={getIconGlyph(relic.icon, relic.name)}
                      tone="blue"
                      size="sm"
                      className={styles.perkIcon}
                    />
                    <span className={styles.perkText}>
                      <span className={styles.perkName}>{relic.name}</span>
                      <span className={styles.perkDesc}>{relic.desc}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className={styles.subline}>
          {CURRENCY_NAME} are paid out after every battle and spent at the Company Store.
        </div>

        <Button variant="primary" size="md" onClick={onClose}>
          BACK
        </Button>
      </Panel>
    </div>
  )
}
