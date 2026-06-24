import { useState } from 'react'
import { getSpriteUrls } from '@/components/PixelSprite'
import { Button } from '@/ui'

export default function TitleScreen({
  onStart,
  onContinue,
  onDaily,
  onCodex,
}: {
  onStart: () => void
  onContinue?: () => void
  onDaily: () => void
  onCodex: () => void
}) {
  const [confirmNew, setConfirmNew] = useState(false)
  const sprites = getSpriteUrls()

  // Starting over with a save in place erases it — make that explicit.
  const handleStart = () => {
    if (onContinue && !confirmNew) {
      setConfirmNew(true)
      return
    }
    onStart()
  }

  return (
    <div
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 20,
        padding: 30,
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0 12%, rgba(255,255,255,.06) 12.4% 12.8%, transparent 13% 49%, rgba(255,211,77,.10) 49.4% 50.6%, transparent 51% 87%, rgba(255,255,255,.06) 87.2% 87.6%, transparent 88%), linear-gradient(180deg, rgba(255,255,255,.035) 0 1px, transparent 1px 84px)',
          opacity: 0.85,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 42,
          width: 120,
          height: 30,
          border: '1px solid rgba(255,211,77,.42)',
          borderRadius: 8,
          background: 'rgba(5,7,13,.72)',
          boxShadow: '0 0 28px rgba(255,211,77,.18)',
          color: 'var(--gold-bright)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--display-2xs)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 1,
          letterSpacing: 2,
        }}
      >
        ▲ FLOOR 30
      </div>
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${8 + ((i * 29) % 84)}%`,
            top: `${16 + ((i * 17) % 38)}%`,
            width: 6,
            height: 2,
            background: i % 4 === 0 ? 'var(--gold)' : 'rgba(77,163,255,.55)',
            borderRadius: 2,
            opacity: 0.18 + (i % 4) * 0.08,
            animation: `twinkle ${2.5 + (i % 3) * 0.5}s infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-sm)',
            color: 'var(--gold)',
            letterSpacing: 4,
            marginBottom: 12,
            textShadow: '0 0 18px rgba(255,211,77,.26)',
          }}
        >
          ▲ Q4 LADDER SIMULATION ▲
        </div>
        <h1
          className="t-display"
          style={{
            fontSize: 'var(--display-xl)',
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.4,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFE58A 42%, #F5A623 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter:
              'drop-shadow(0 8px 16px rgba(0,0,0,.7)) drop-shadow(0 0 18px rgba(255,211,77,.18))',
          }}
        >
          CORPORATE
          <br />
          CLIMB
        </h1>
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-md)',
            color: 'var(--sky-soft)',
            marginTop: 14,
            letterSpacing: 3,
          }}
        >
          BOARD-LEVEL ROGUELITE • ELEVATOR ACCESS PENDING
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 1,
          margin: '8px 0 14px',
          padding: '0 18px 24px',
        }}
      >
        {['product_manager', 'eng', 'design'].map((id) => (
          <div key={id} style={{ position: 'relative', width: 72, height: 88 }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 8,
                width: 54,
                height: 14,
                transform: 'translateX(-50%)',
                borderRadius: '999px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,.56), rgba(0,0,0,0) 72%)',
                filter: 'blur(2.5px)',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 10,
                right: 10,
                bottom: 10,
                height: 3,
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, rgba(255,211,77,0), rgba(255,211,77,.65) 18%, rgba(142,193,255,.55) 82%, rgba(255,211,77,0))',
                opacity: 0.72,
              }}
            />
            <div className="sprite-idle" style={{ width: '100%', height: '100%' }}>
              <img
                src={sprites[id]}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  imageRendering: 'auto',
                  padding: '5% 1% 10% 1%',
                  objectFit: 'contain',
                  filter:
                    'drop-shadow(0 10px 12px rgba(0,0,0,.42)) drop-shadow(0 0 10px rgba(255,211,77,.08))',
                }}
                draggable={false}
              />
            </div>
          </div>
        ))}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            width: 236,
            height: 28,
            transform: 'translateX(-50%)',
            borderTop: '1px solid rgba(255,211,77,.28)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,.06), transparent 40%), linear-gradient(90deg, rgba(255,211,77,0), rgba(255,211,77,.08) 16%, rgba(77,163,255,.08) 84%, rgba(255,211,77,0))',
            clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,.24)',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 136,
          background:
            'linear-gradient(0deg, rgba(2,6,23,.98) 0%, rgba(13,19,32,.78) 52%, rgba(13,19,32,.34) 76%, transparent 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 4,
          padding: '0 20px',
        }}
      >
        {[60, 90, 70, 110, 80, 95, 65, 85, 100, 75].map((h, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: h,
              background: 'linear-gradient(180deg, #111827, #05070d)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '3px 3px 0 0',
              position: 'relative',
            }}
          >
            {Array.from({ length: Math.floor(h / 15) }).map((_, j) => (
              <div
                key={j}
                style={{
                  position: 'absolute',
                  left: 4,
                  top: 8 + j * 15,
                  width: 5,
                  height: 5,
                  borderRadius: 1,
                  background: (i + j) % 3 === 0 ? '#FFD54F' : '#1d4ed8',
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {confirmNew ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            zIndex: 2,
            background: 'rgba(0,0,0,0.55)',
            border: '2px solid var(--gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
          }}
        >
          <div
            className="t-body"
            style={{ fontSize: 'var(--body-lg)', color: '#fff', textAlign: 'center' }}
          >
            Start over? Your saved climb will be erased.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="accent" size="md" onClick={onStart}>
              ERASE &amp; START
            </Button>
            <Button variant="secondary" size="md" onClick={() => setConfirmNew(false)}>
              KEEP SAVE
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          style={{
            zIndex: 2,
            minWidth: 210,
            boxShadow:
              '0 18px 32px rgba(255,211,77,.24), var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,.3)',
          }}
        >
          {onContinue ? 'NEW CLIMB' : 'START CLIMB'}
        </Button>
      )}

      {onContinue && !confirmNew && (
        <Button variant="secondary" size="md" onClick={onContinue} style={{ zIndex: 2 }}>
          CONTINUE
        </Button>
      )}

      <Button variant="accent" size="sm" onClick={onDaily} style={{ zIndex: 2 }}>
        DAILY CHALLENGE
      </Button>

      <Button variant="ghost" size="sm" onClick={onCodex} style={{ zIndex: 2 }}>
        📖 CODEX
      </Button>

      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-sm)',
          color: '#64B5F6',
          position: 'absolute',
          bottom: 28,
          zIndex: 2,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(5,7,13,.58)',
          textShadow: '0 1px 0 rgba(5,7,13,.72)',
        }}
      >
        Q4 ladder simulation • HR approved-ish
      </div>
    </div>
  )
}
