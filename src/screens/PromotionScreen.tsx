import { useState, useEffect } from 'react'
import type { PromotionTier, PlayerClass } from '@/types'
import { getSpriteUrls } from '@/components/PixelSprite'
import { Panel } from '@/ui'

export default function PromotionScreen({
  player,
  oldTier,
  newTier,
  onContinue,
}: {
  player: PlayerClass
  oldTier: PromotionTier
  newTier: PromotionTier
  onContinue: () => void
}) {
  const [show, setShow] = useState(false)
  const sprites = getSpriteUrls()

  useEffect(() => {
    setTimeout(() => setShow(true), 300)
  }, [])

  const boost = newTier.statBoost
  const upgrades = newTier.moveUpgrades

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 18,
        padding: 24,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #2a1a0e 50%, #3a2a0e 100%)',
        cursor: 'pointer',
      }}
      onClick={onContinue}
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
          width: 96,
          height: 110,
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

      {/* Old title fading out */}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--muted)',
          textDecoration: 'line-through',
          opacity: show ? 0.5 : 0,
          transition: 'opacity 0.5s ease 0.3s',
        }}
      >
        {oldTier.title}
      </div>

      {/* Arrow */}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-sm)',
          color: 'var(--gold)',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease 0.4s',
        }}
      >
        &darr;
      </div>

      {/* New title */}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-sm)',
          color: 'var(--gold-bright)',
          textAlign: 'center',
          lineHeight: 1.8,
          textShadow: '2px 2px 0 #E65100',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.6s ease 0.5s',
        }}
      >
        {newTier.title}
      </div>

      {/* Stat boosts */}
      {boost && (
        <Panel
          variant="glass"
          style={{
            padding: '10px 16px',
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.5s ease 0.6s',
          }}
        >
          {boost.maxHp && (
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--green)' }}
            >
              HP +{boost.maxHp}
            </div>
          )}
          {boost.atk && (
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--red)' }}
            >
              ATK +{boost.atk}
            </div>
          )}
          {boost.def && (
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--sky)' }}
            >
              DEF +{boost.def}
            </div>
          )}
        </Panel>
      )}

      {/* Move upgrades */}
      {upgrades && upgrades.length > 0 && (
        <div
          style={{
            background: 'rgba(255,193,7,0.1)',
            border: '2px solid var(--gold)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            maxWidth: 300,
            width: '100%',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.5s ease 0.7s',
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--gold)',
              marginBottom: 6,
            }}
          >
            MOVE EVOLVED!
          </div>
          {upgrades.map((u) => (
            <div
              key={u.fromName}
              className="t-body"
              style={{
                fontSize: 'var(--body-md)',
                color: 'var(--paper)',
                lineHeight: 1.2,
              }}
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
          color: '#616161',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.8s ease 1s',
          animation: show ? 'pulse 2s infinite' : 'none',
        }}
      >
        TAP TO CONTINUE
      </div>
    </div>
  )
}
