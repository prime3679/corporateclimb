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
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100%',
        gap: 10,
        padding: '56px 20px 18px',
        background:
          'radial-gradient(circle at 50% 16%, rgba(255,211,77,.18), transparent 28%), linear-gradient(180deg, rgba(5,7,13,.18), rgba(5,7,13,.72))',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 14,
          width: 136,
          height: 172,
          border: '1px solid rgba(255,211,77,.22)',
          borderRadius: 18,
          background: 'linear-gradient(180deg, rgba(255,211,77,.12), rgba(13,19,32,.28))',
          boxShadow: 'inset 0 0 30px rgba(255,211,77,.10)',
        }}
      />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${6 + ((i * 17) % 88)}%`,
            top: `${8 + ((i * 23) % 48)}%`,
            width: i % 2 ? 7 : 3,
            height: i % 2 ? 3 : 7,
            background: i % 3 === 0 ? 'var(--gold)' : 'var(--compliance-blue)',
            opacity: show ? 0.62 : 0,
            transform: show ? 'translateY(18px) rotate(18deg)' : 'translateY(-16px)',
            transition: `opacity .4s ease ${i * 0.03}s, transform 1.4s ease ${i * 0.03}s`,
          }}
        />
      ))}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--gold)',
          letterSpacing: 2,
          lineHeight: 1.6,
          maxWidth: 330,
          textAlign: 'center',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease',
          textShadow: '1px 1px 0 #E65100',
        }}
      >
        ✦ PROMOTED ✦ ACCESS CARD UPGRADED
      </div>

      <div
        className="sprite-idle"
        style={{
          width: 60,
          height: 70,
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
        CHOOSE A PERK • PICK YOUR ADVANTAGE
      </div>

      <div
        aria-label="Promotion reward choices"
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
              minHeight: 82,
              padding: '12px 12px',
              background: 'rgba(13, 19, 32, 0.92)',
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
                style={{ fontSize: '10px', color: KIND_COLORS[perk.kind], letterSpacing: 1.2 }}
              >
                OPTION {i + 1} • {KIND_LABELS[perk.kind]}
              </span>
              <span
                className="t-display"
                style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)', lineHeight: 1.4 }}
              >
                {perk.name}
              </span>
              <span
                className="t-body"
                style={{ fontSize: 'var(--body-sm)', color: 'var(--text-main)', lineHeight: 1.2 }}
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
              [{i + 1}] TAP
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
