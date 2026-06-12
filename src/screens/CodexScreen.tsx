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
    <div
      key={opts.key}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--ink)',
        border: 'var(--border-w) solid var(--ink-soft)',
        borderRadius: 'var(--radius-md)',
        opacity: opts.locked ? 0.55 : 1,
      }}
    >
      <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>
        {opts.locked ? '❓' : opts.icon}
      </span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          className="t-display"
          style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)', lineHeight: 1.4 }}
        >
          {opts.locked ? '???' : opts.name}
        </span>
        <span
          className="t-body"
          style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', lineHeight: 1.2 }}
        >
          {opts.locked ? (opts.hint ?? 'Keep climbing.') : opts.desc}
        </span>
      </span>
    </div>
  )

  const section = (title: string, children: React.ReactNode) => (
    <>
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--gold)',
          letterSpacing: 2,
          marginTop: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {children}
      </div>
    </>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        gap: 8,
        padding: '20px 20px 12px',
        background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
        overflowY: 'auto',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          textShadow: '2px 2px 0 #E65100',
          letterSpacing: 2,
        }}
      >
        📖 THE CODEX
      </div>
      <div className="t-body" style={{ fontSize: 'var(--body-sm)', color: 'var(--muted)' }}>
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

      <div style={{ marginTop: 12, marginBottom: 8 }}>
        <Button variant="primary" size="md" onClick={onBack}>
          BACK
        </Button>
      </div>
    </div>
  )
}
