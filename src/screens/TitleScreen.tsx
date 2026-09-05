import { useEffect, useRef, useState } from 'react'
import { getSpriteUrls } from '@/components/PixelSprite'
import { getBestAscension } from '@/data'
import { getDailyStreak, hasPlayedToday } from '@/daily'
import { getLifetimeStats } from '@/history'
import {
  KONAMI_SEQUENCE,
  SIGN_TAPS_REQUIRED,
  advanceKonami,
  hasGoldenBadge,
  markGoldenBadgeFound,
} from '@/konami'
import { SFX } from '@/sfx'
import { Button } from '@/ui'

const CONFETTI_GLYPHS = ['💰', '🪪', '📈', '☕', '📎', '💼']

export default function TitleScreen({
  onStart,
  onContinue,
  onDaily,
  onCodex,
  onOffice,
  officeStatus,
}: {
  onStart: () => void
  onContinue?: () => void
  onDaily: () => void
  onCodex: () => void
  onOffice?: () => void
  /** One-line campaign summary under THE OFFICE when a save exists. */
  officeStatus?: string
}) {
  const [confirmNew, setConfirmNew] = useState(false)
  const [goldenBadge, setGoldenBadge] = useState(hasGoldenBadge)
  const [celebrating, setCelebrating] = useState(false)
  const konamiProgress = useRef(0)
  const signTaps = useRef(0)
  const sprites = getSpriteUrls()
  const streak = getDailyStreak()
  const playedToday = hasPlayedToday()
  const lifetime = getLifetimeStats()
  const bestReorg = getBestAscension()

  const unlockGoldenBadge = () => {
    markGoldenBadgeFound()
    setGoldenBadge(true)
    setCelebrating(true)
    SFX.fanfare()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      konamiProgress.current = advanceKonami(konamiProgress.current, e.key)
      if (konamiProgress.current >= KONAMI_SEQUENCE.length) {
        konamiProgress.current = 0
        unlockGoldenBadge()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(() => setCelebrating(false), 4200)
    return () => window.clearTimeout(timer)
  }, [celebrating])

  // Touch players can't type the code — tapping the floor sign works too.
  const handleSignTap = () => {
    signTaps.current += 1
    if (signTaps.current >= SIGN_TAPS_REQUIRED) {
      signTaps.current = 0
      unlockGoldenBadge()
    } else if (signTaps.current >= 3) {
      SFX.menuSelect() // a little "keep going" wink
    }
  }

  // Starting over with a save in place erases it — make that explicit.
  const handleStart = () => {
    if (onContinue && !confirmNew) {
      setConfirmNew(true)
      return
    }
    onStart()
  }

  const skyline = [64, 104, 78, 118, 86, 96, 70, 112, 82]
  const cast = ['product_manager', 'eng', 'design']

  return (
    <div
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 18,
        padding: '34px 26px 24px',
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
            'linear-gradient(90deg, transparent 0 49%, rgba(255,211,77,.16) 49% 51%, transparent 51%), repeating-linear-gradient(180deg, transparent 0 76px, rgba(255,255,255,.04) 76px 77px)',
          opacity: 0.72,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 88,
          bottom: 152,
          left: '50%',
          width: 82,
          transform: 'translateX(-50%)',
          borderLeft: '2px solid rgba(255,211,77,.28)',
          borderRight: '2px solid rgba(255,211,77,.28)',
          opacity: 0.78,
        }}
      />
      <div
        aria-hidden="true"
        onPointerDown={handleSignTap}
        style={{
          position: 'absolute',
          top: 42,
          width: 120,
          height: 30,
          border: goldenBadge ? '1px solid rgba(255,211,77,.8)' : '1px solid rgba(255,211,77,.42)',
          borderRadius: 8,
          background: 'rgba(5,7,13,.72)',
          boxShadow: goldenBadge ? '0 0 34px rgba(255,211,77,.4)' : '0 0 28px rgba(255,211,77,.18)',
          color: 'var(--gold-bright)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--display-2xs)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 1,
          letterSpacing: 2,
          userSelect: 'none',
        }}
      >
        {goldenBadge ? '▲ FLOOR 31' : '▲ FLOOR 30'}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 102 + i * 72,
            left: 'calc(50% - 41px)',
            width: 82,
            height: 2,
            background: 'rgba(255,211,77,.22)',
          }}
        />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-xs)',
            color: 'var(--gold)',
            letterSpacing: 3,
            marginBottom: 10,
          }}
        >
          Q4 LADDER SIMULATION
        </div>
        <h1
          className="t-display"
          style={{
            fontSize: 'var(--display-xl)',
            color: 'var(--paper)',
            margin: 0,
            lineHeight: 1.06,
            letterSpacing: 1,
          }}
        >
          CORPORATE
          <br />
          CLIMB
        </h1>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--sky-soft)',
            marginTop: 14,
            letterSpacing: 2,
            lineHeight: 1.45,
          }}
        >
          THREE ACTS. THIRTY FLOORS. ONE BADGE SWIPE FROM GLORY.
        </div>
        <div
          className="t-body"
          style={{
            maxWidth: 340,
            margin: '9px auto 0',
            fontSize: 'var(--body-md)',
            color: 'var(--text-main)',
            lineHeight: 1.25,
          }}
        >
          Pick a role, exploit type matchups, and expense your way past managers before burnout
          catches you.
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
          margin: '4px 0 10px',
          padding: '0 18px 12px',
        }}
      >
        {cast.map((id, i) => (
          <div
            key={id}
            style={{
              position: 'relative',
              width: i === 1 ? 78 : 70,
              height: i === 1 ? 94 : 86,
              zIndex: i === 1 ? 2 : 1,
            }}
          >
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
            width: 220,
            height: 16,
            transform: 'translateX(-50%)',
            borderTop: '1px solid rgba(255,211,77,.32)',
            background: 'rgba(10,13,19,.72)',
            clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 124,
          background:
            'linear-gradient(0deg, rgba(2,6,23,.98) 0%, rgba(13,19,32,.78) 64%, transparent 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 4,
          padding: '0 20px',
        }}
      >
        {skyline.map((h, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: h,
              background: '#0f1724',
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
            background: 'var(--cc-surface-2)',
            border: '1px solid var(--gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-lg)',
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

      {onOffice && (
        <div
          style={{
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            id="office-campaign-label"
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              letterSpacing: 'var(--cc-track-label)',
              color: 'var(--cc-text-dim)',
            }}
          >
            CAMPAIGN · FLOORS 1–5
          </span>
          <Button
            variant="accent"
            size="md"
            onClick={onOffice}
            style={{ minWidth: 210 }}
            aria-describedby="office-campaign-label"
          >
            THE OFFICE
          </Button>
          {officeStatus && (
            <span
              className="t-body"
              style={{ fontSize: 'var(--body-sm)', color: 'var(--cc-text-2)' }}
            >
              {officeStatus}
            </span>
          )}
        </div>
      )}

      <Button variant="accent" size="sm" onClick={onDaily} style={{ zIndex: 2 }}>
        DAILY CHALLENGE
      </Button>

      {(streak.current > 0 || lifetime.bestFloor > 0 || goldenBadge) && (
        <div
          className="t-body"
          style={{
            zIndex: 2,
            display: 'flex',
            gap: 12,
            fontSize: 'var(--body-sm)',
            color: 'var(--muted-light)',
            padding: '3px 12px',
            borderRadius: 999,
            background: 'rgba(5,7,13,.72)',
            border: '1px solid var(--cc-line-faint)',
          }}
        >
          {streak.current > 0 && (
            <span>
              🔥 {streak.current}-day streak{playedToday ? ' ✓' : ''}
            </span>
          )}
          {lifetime.bestFloor > 0 && <span>Best: Floor {lifetime.bestFloor}</span>}
          {bestReorg > 0 && <span>🌀 Re-Org {bestReorg}</span>}
          {goldenBadge && <span style={{ color: 'var(--gold-bright)' }}>🪪 Golden Badge</span>}
        </div>
      )}

      {celebrating && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${(i * 37) % 96}%`,
                top: -28,
                fontSize: 14 + ((i * 7) % 12),
                animation: `confetti ${2.2 + (i % 4) * 0.4}s ease-in ${i * 0.06}s forwards`,
                opacity: 0,
              }}
            >
              {CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length]}
            </span>
          ))}
        </div>
      )}

      {celebrating && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '30%',
            zIndex: 6,
            textAlign: 'center',
            padding: '14px 22px',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--gold-bright)',
            background: 'rgba(5,7,13,.92)',
            boxShadow: '0 0 44px rgba(255,211,77,.45)',
            animation: 'bonus-pop 0.5s ease-out',
          }}
        >
          <div
            className="t-display"
            style={{ fontSize: 'var(--display-sm)', color: 'var(--gold-bright)', letterSpacing: 2 }}
          >
            🪪 GOLDEN BADGE ACQUIRED
          </div>
          <div
            className="t-body"
            style={{ fontSize: 'var(--body-md)', color: 'var(--text-main)', marginTop: 6 }}
          >
            Executive elevator access granted. The board will remember this.
          </div>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onCodex} style={{ zIndex: 2 }}>
        CODEX
      </Button>

      <div
        className="t-body"
        style={{
          maxWidth: 332,
          fontSize: 'var(--body-sm)',
          color: '#64B5F6',
          position: 'absolute',
          bottom: 58,
          zIndex: 2,
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(5,7,13,.82)',
          border: '1px solid rgba(255,255,255,.08)',
          textAlign: 'center',
          lineHeight: 1.15,
        }}
      >
        Type matchups, expense reports, promotion pressure.
      </div>
    </div>
  )
}
