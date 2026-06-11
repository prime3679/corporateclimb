import { useState, useEffect } from 'react'
import type { PerkDef, PerkId, PromotionTier, PlayerClass } from '@/types'
import { getSpriteUrls } from '@/components/PixelSprite'

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

export default function PromotionScreen({
  player,
  oldTier,
  newTier,
  offers,
  onPick,
}: {
  player: PlayerClass
  oldTier: PromotionTier
  newTier: PromotionTier
  /** The pick-1-of-3 perk offer (keys 1-3 also select). */
  offers: PerkDef[]
  onPick: (id: PerkId) => void
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        padding: 20,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #2a1a0e 50%, #3a2a0e 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--gold)',
          letterSpacing: 4,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease',
          textShadow: '1px 1px 0 #E65100',
        }}
      >
        &#x2726; PROMOTED &#x2726;
      </div>

      <div
        className="sprite-idle"
        style={{
          width: 72,
          height: 84,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          transform: show ? 'scale(1)' : 'scale(0.8)',
        }}
      >
        <img
          src={sprites[player.spriteId]}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'auto',
            padding: '8% 2% 0 2%',
            objectFit: 'contain',
          }}
          draggable={false}
        />
      </div>

      {/* Old title → new title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease 0.3s',
        }}
      >
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--muted)',
            textDecoration: 'line-through',
          }}
        >
          {oldTier.title}
        </div>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-sm)',
            color: 'var(--gold-bright)',
            textAlign: 'center',
            lineHeight: 1.6,
            textShadow: '2px 2px 0 #E65100',
          }}
        >
          {newTier.title}
        </div>
      </div>

      {/* Move upgrades (automatic at floors 10/20) */}
      {upgrades && upgrades.length > 0 && (
        <div
          style={{
            background: 'rgba(255,193,7,0.1)',
            border: '2px solid var(--gold)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            maxWidth: 320,
            width: '100%',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.5s ease 0.4s',
          }}
        >
          <div
            className="t-display"
            style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold)', marginBottom: 4 }}
          >
            MOVE EVOLVED!
          </div>
          {upgrades.map((u) => (
            <div
              key={u.fromName}
              className="t-body"
              style={{ fontSize: 'var(--body-md)', color: 'var(--paper)', lineHeight: 1.2 }}
            >
              {u.fromName} &rarr; {u.to.name}
            </div>
          ))}
        </div>
      )}

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--sky-soft)',
          letterSpacing: 2,
          marginTop: 4,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease 0.5s',
        }}
      >
        CHOOSE A PERK
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: 340,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease 0.6s',
        }}
      >
        {offers.map((perk, i) => (
          <button
            key={perk.id}
            onClick={() => onPick(perk.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              background: 'var(--ink)',
              border: `var(--border-w) solid ${KIND_COLORS[perk.kind]}`,
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span style={{ fontSize: 26 }}>{perk.icon}</span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                className="t-display"
                style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)', lineHeight: 1.4 }}
              >
                {perk.name}
              </span>
              <span
                className="t-body"
                style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', lineHeight: 1.2 }}
              >
                {perk.desc}
              </span>
            </span>
            <span
              className="t-display"
              style={{
                fontSize: 'var(--display-2xs)',
                color: KIND_COLORS[perk.kind],
                whiteSpace: 'nowrap',
              }}
            >
              [{i + 1}] {KIND_LABELS[perk.kind]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
