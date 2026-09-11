import {
  ACHIEVEMENTS,
  ALL_ITEM_IDS,
  ALL_PERK_IDS,
  ALL_RELIC_IDS,
  ITEMS,
  PERKS,
  RELICS,
  getUnlockedAchievements,
} from '@/data'
import type { AchievementId } from '@/types'
import { Button } from '@/ui'
import styles from './CodexScreen.module.css'

/**
 * The collection browser: every perk, Status Symbol, item, and
 * achievement — with locked entries shown as silhouettes plus the
 * achievement that unlocks them. Earned achievements ARE the
 * meta-progression keys, so this screen doubles as the unlock map.
 */
export default function CodexScreen({ onBack }: { onBack: () => void }) {
  const unlocked = getUnlockedAchievements()

  const achievementName = (id: AchievementId) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id

  const row = (opts: {
    key: string
    icon: string
    name: string
    desc: string
    locked: boolean
    hint?: string
  }) => (
    <div key={opts.key} className={`${styles.row} ${opts.locked ? styles.rowLocked : ''}`}>
      <span className={styles.icon}>{opts.locked ? '❓' : opts.icon}</span>
      <span className={styles.text}>
        <span className={`t-display ${styles.name}`}>{opts.locked ? '???' : opts.name}</span>
        <span className={`t-body ${styles.desc}`}>
          {opts.locked ? (opts.hint ?? 'Keep climbing.') : opts.desc}
        </span>
      </span>
    </div>
  )

  const section = (title: string, children: React.ReactNode) => (
    <section className={styles.section}>
      <div className={`t-display ${styles.sectionTitle}`}>{title}</div>
      <div className={styles.list}>{children}</div>
    </section>
  )

  return (
    <div className={styles.screen}>
      <div className={`t-display ${styles.title}`}>THE CODEX</div>
      <div className={`t-body ${styles.lede}`}>
        Achievements unlock new perks and Status Symbols for future runs.
      </div>

      {section(
        `PERKS (${ALL_PERK_IDS.filter((id) => !PERKS[id].unlockedBy || unlocked.has(PERKS[id].unlockedBy!)).length}/${ALL_PERK_IDS.length})`,
        ALL_PERK_IDS.map((id) => {
          const p = PERKS[id]
          const locked = !!p.unlockedBy && !unlocked.has(p.unlockedBy)
          return row({
            key: id,
            icon: p.icon,
            name: p.name,
            desc: p.desc,
            locked,
            hint: p.unlockedBy ? `Unlock: ${achievementName(p.unlockedBy)}` : undefined,
          })
        }),
      )}

      {section(
        `STATUS SYMBOLS (${ALL_RELIC_IDS.filter((id) => !RELICS[id].unlockedBy || unlocked.has(RELICS[id].unlockedBy!)).length}/${ALL_RELIC_IDS.length})`,
        ALL_RELIC_IDS.map((id) => {
          const r = RELICS[id]
          const locked = !!r.unlockedBy && !unlocked.has(r.unlockedBy)
          return row({
            key: id,
            icon: r.icon,
            name: r.name,
            desc: r.desc,
            locked,
            hint: r.unlockedBy ? `Unlock: ${achievementName(r.unlockedBy)}` : undefined,
          })
        }),
      )}

      {section(
        'ITEMS',
        ALL_ITEM_IDS.map((id) => {
          const item = ITEMS[id]
          return row({ key: id, icon: item.emoji, name: item.name, desc: item.desc, locked: false })
        }),
      )}

      {section(
        `ACHIEVEMENTS (${[...unlocked].length}/${ACHIEVEMENTS.length})`,
        ACHIEVEMENTS.map((a) =>
          row({
            key: a.id,
            icon: a.icon,
            name: a.name,
            desc: a.desc,
            locked: !unlocked.has(a.id),
            hint: a.desc,
          }),
        ),
      )}

      <div className={styles.foot}>
        <Button variant="primary" size="md" onClick={onBack}>
          BACK
        </Button>
      </div>
    </div>
  )
}
