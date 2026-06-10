import { useState, useEffect } from 'react'
import { useSpriteUrls } from '../components/PixelSprite'
import { Button } from '../ui'

export default function TitleScreen({
  onStart,
  onContinue,
  onDaily,
}: {
  onStart: () => void
  onContinue?: () => void
  onDaily: () => void
}) {
  const [flicker, setFlicker] = useState(true)
  const sprites = useSpriteUrls()

  useEffect(() => {
    const i = setInterval(() => setFlicker((f) => !f), 700)
    return () => clearInterval(i)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 20,
        padding: 30,
        background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 40%, #1976D2 70%, #42A5F5 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 37) % 100}%`,
            top: `${(i * 23) % 60}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            background: '#fff',
            borderRadius: '50%',
            opacity: 0.3 + (i % 5) * 0.15,
            animation: `twinkle ${1.5 + (i % 3) * 0.5}s infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-sm)',
            color: 'var(--gold-bright)',
            letterSpacing: 4,
            marginBottom: 12,
            textShadow: '2px 2px 0 #E65100',
          }}
        >
          &#x2726; A SATIRICAL RPG &#x2726;
        </div>
        <h1
          className="t-display"
          style={{
            fontSize: 'var(--display-xl)',
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.4,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E3F2FD 50%, #90CAF9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(3px 3px 0 #0D47A1)',
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
          FROM CUBICLE TO CORNER OFFICE
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          margin: '8px 0',
        }}
      >
        {['product_manager', 'eng', 'design'].map((id) => (
          <div key={id} className="sprite-idle" style={{ width: 48, height: 56 }}>
            <img
              src={sprites[id]}
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
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(0deg, #0D47A1 0%, transparent 100%)',
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
              background: '#0D47A1',
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
                  background: (i + j) % 3 === 0 ? '#FFD54F' : '#1565C0',
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        style={{ opacity: flicker ? 1 : 0.6, transition: 'opacity 0.2s', zIndex: 2 }}
      >
        {onContinue ? 'NEW GAME' : 'PRESS START'}
      </Button>

      {onContinue && (
        <Button variant="secondary" size="md" onClick={onContinue} style={{ zIndex: 2 }}>
          CONTINUE
        </Button>
      )}

      <Button variant="accent" size="sm" onClick={onDaily} style={{ zIndex: 2 }}>
        DAILY CHALLENGE
      </Button>

      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-sm)',
          color: '#64B5F6',
          position: 'absolute',
          bottom: 12,
          zIndex: 2,
        }}
      >
        © 2026 ADRIAN LUMLEY
      </div>
    </div>
  )
}
