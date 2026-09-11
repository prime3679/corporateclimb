import { useState, useEffect, type CSSProperties } from 'react'
import type { PerkDef, PerkId, PromotionTier, PlayerClass } from '@/types'
import { getSpriteUrls } from '@/components/PixelSprite'
import { getCareerArchetype } from '@/engine'
import styles from './PromotionScreen.module.css'

const KIND_LABELS: Record<PerkDef['kind'], string> = {
  stat: 'STATS',
  passive: 'PASSIVE',
  economy: 'ECONOMY',
}

const KIND_COLORS: Record<PerkDef['kind'], string> = {
  stat: 'var(--green)',
  passive: 'var(--sky)',
  economy: 'var(--gold)',
}

const delay = (s: number) => ({ '--delay': `${s}s` }) as CSSProperties

export default function PromotionScreen({
  player,
  oldTier,
  newTier,
  offers,
  onPick,
  ownedPerks = [],
}: {
  player: PlayerClass
  oldTier: PromotionTier
  newTier: PromotionTier
  /** The pick-1-of-3 perk offer (keys 1-3 also select). */
  offers: PerkDef[]
  onPick: (id: PerkId) => void
  /** Perks accumulated this run; drives the career trajectory read-out. */
  ownedPerks?: PerkId[]
}) {
  const [show, setShow] = useState(false)
  const sprites = getSpriteUrls()

  useEffect(() => {
    setTimeout(() => setShow(true), 300)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = ['1', '2', '3'].indexOf(e.key)
      if (idx >= 0 && offers[idx]) onPick(offers[idx].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [offers, onPick])

  const upgrades = newTier.moveUpgrades
  const archetype = getCareerArchetype(ownedPerks)

  return (
    <div className={`premium-screen ${styles.screen} ${show ? styles.shown : ''}`}>
      <div aria-hidden="true" className={styles.plate} />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={styles.confetti}
          style={{
            left: `${6 + ((i * 17) % 88)}%`,
            top: `${8 + ((i * 23) % 48)}%`,
            width: i % 2 ? 7 : 3,
            height: i % 2 ? 3 : 7,
            background: i % 3 === 0 ? 'var(--gold)' : 'var(--compliance-blue)',
            ...delay(i * 0.03),
          }}
        />
      ))}
      <div className={`t-display ${styles.fade} ${styles.kicker}`}>
        ✦ PROMOTED ✦ ACCESS CARD UPGRADED
      </div>

      <div className={`sprite-idle ${styles.fade} ${styles.sprite}`}>
        <img src={sprites[player.spriteId]} alt="" draggable={false} />
      </div>

      {/* Old title → new title */}
      <div className={`${styles.fade} ${styles.titles}`} style={delay(0.3)}>
        <div className={`t-display ${styles.oldTitle}`}>{oldTier.title}</div>
        <div className={`t-display ${styles.newTitle}`}>{newTier.title}</div>
      </div>

      {/* Move upgrades (automatic at floors 10/20) */}
      {upgrades && upgrades.length > 0 && (
        <div className={`${styles.fade} ${styles.evolved}`} style={delay(0.4)}>
          <div className={`t-display ${styles.evolvedTitle}`}>MOVE EVOLVED!</div>
          {upgrades.map((u) => (
            <div key={u.fromName} className={`t-body ${styles.evolvedLine}`}>
              {u.fromName} &rarr; {u.to.name}
            </div>
          ))}
        </div>
      )}

      <div className={`t-display ${styles.fade} ${styles.chooser}`} style={delay(0.5)}>
        CHOOSE A PERK • PICK YOUR ADVANTAGE
      </div>

      <div
        aria-label="Promotion reward choices"
        className={`${styles.fade} ${styles.offers}`}
        style={delay(0.6)}
      >
        {offers.map((perk, i) => (
          <button
            key={perk.id}
            onClick={() => onPick(perk.id)}
            className={styles.offer}
            style={{ '--kind': KIND_COLORS[perk.kind] } as CSSProperties}
          >
            <span className={styles.offerIcon}>{perk.icon}</span>
            <span className={styles.offerBody}>
              <span className={`t-display ${styles.offerLabel}`}>
                OPTION {i + 1} • {KIND_LABELS[perk.kind]}
              </span>
              <span className={`t-display ${styles.offerName}`}>{perk.name}</span>
              <span className={styles.tags} aria-label={`${perk.name} choice tags`}>
                {perk.choiceTags.map((tag) => (
                  <span key={tag} className={`t-display ${styles.tag}`}>
                    {tag}
                  </span>
                ))}
              </span>
              <span className={`t-body ${styles.offerDesc}`}>{perk.desc}</span>
              <span className={`t-body ${styles.offerHint}`}>
                <strong>BEST FOR:</strong> {perk.buildHint}
              </span>
            </span>
            <span className={`t-display ${styles.offerKey}`}>[{i + 1}] TAP</span>
          </button>
        ))}
      </div>

      <div
        aria-label="Current career trajectory"
        data-testid="trajectory-panel"
        className={`${styles.fade} ${styles.trajectory}`}
        style={delay(0.7)}
      >
        <div className={`t-display ${styles.trajectoryLabel}`}>CURRENT TRAJECTORY</div>
        <div className={`t-display ${styles.trajectoryName}`} data-testid="trajectory-name">
          {archetype.name}
        </div>
        <div className={`t-body ${styles.trajectoryDesc}`}>{archetype.description}</div>
      </div>
    </div>
  )
}
