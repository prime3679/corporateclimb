import type { CSSProperties } from 'react'
import {
  PARTY_MAX,
  maxHpFor,
  memberName,
  type OfficeState,
  type PartyMember,
} from '@/engine/office'
import Headshot from './Headshot'
import { memberRing, memberSprite } from './cast'
import styles from './PartyStrip.module.css'

export function hpTone(hp: number, max: number): 'high' | 'mid' | 'low' {
  const pct = max > 0 ? (hp / max) * 100 : 0
  return pct > 50 ? 'high' : pct > 25 ? 'mid' : 'low'
}

export function shortName(member: PartyMember): string {
  return member.def.kind === 'lead' ? 'YOU' : memberName(member).toUpperCase()
}

/**
 * The party as a row of badge chips: headshot + HP number + HP bar, with an
 * open (dotted) slot for every empty seat. `emptyHighlight` outlines the first
 * open seat in gold — the recruit card's "he goes here".
 */
export function PartyChips({
  state,
  members = state.party,
  active,
  size = 54,
  emptyHighlight = false,
  showNames = false,
  className,
}: {
  state: OfficeState
  members?: PartyMember[]
  active?: number
  size?: number
  emptyHighlight?: boolean
  showNames?: boolean
  className?: string
}) {
  const headshot = Math.round(size * 0.74)
  let highlighted = false
  return (
    <div
      className={[styles.row, className].filter(Boolean).join(' ')}
      style={{ '--chip-size': `${size}px` } as CSSProperties}
    >
      {Array.from({ length: PARTY_MAX }, (_, i) => {
        const m = members[i]
        if (!m) {
          const highlight = emptyHighlight && !highlighted
          highlighted = highlighted || highlight
          return (
            <div key={`empty-${i}`} className={styles.chip} aria-label="Open seat">
              <span
                className={`${styles.empty} ${highlight ? styles.emptyHot : ''}`}
                style={{ width: headshot, height: headshot }}
              >
                +
              </span>
              {showNames && <span className={styles.name}>OPEN</span>}
            </div>
          )
        }
        const max = maxHpFor(state, m)
        const out = m.hp <= 0
        const tone = hpTone(m.hp, max)
        return (
          <div
            key={m.slot}
            className={`${styles.chip} ${active === i ? styles.active : ''}`}
            aria-label={`${shortName(m)} ${out ? 'out' : `${m.hp} of ${max} HP`}`}
          >
            <span className={styles.portrait}>
              <Headshot spriteId={memberSprite(m)} size={headshot} ring={memberRing(m)} out={out} />
              {out ? (
                <span className={styles.outTag}>OUT</span>
              ) : (
                <span className={styles.hpNum}>{m.hp}</span>
              )}
            </span>
            <span className={styles.track}>
              <span
                className={`${styles.fill} ${styles[tone]}`}
                style={{ width: `${Math.max(0, Math.min(100, (m.hp / max) * 100))}%` }}
              />
            </span>
            {showNames && <span className={styles.name}>{shortName(m)}</span>}
          </div>
        )
      })}
    </div>
  )
}

/** HUD party strip: the party during the overworld, the battle party in combat. */
export default function PartyStrip({ state }: { state: OfficeState }) {
  const members = state.encounter?.party ?? state.party
  const active = state.encounter ? state.encounter.activeIndex : undefined
  return (
    <div aria-label="Party" className={styles.strip}>
      <PartyChips state={state} members={members} active={active} />
    </div>
  )
}
