import { useState } from 'react'
import type { PlayerClass } from '@/types'
import { PLAYER_CLASSES } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import { getDailySeed, getDailyModifier, hasPlayedToday, getDailyResult } from '@/daily'
import { Button } from '@/ui'

export default function DailyPreScreen({
  onStart,
  onBack,
}: {
  onStart: (cls: PlayerClass) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState(0)
  const sprites = getSpriteUrls()
  const seed = getDailySeed()
  const modifier = getDailyModifier(seed)
  const alreadyPlayed = hasPlayedToday()
  const pastResult = getDailyResult(seed)

  const isReorg = modifier.id === 'reorg'

  // Days since launch
  const launchDate = new Date('2026-03-17')
  const today = new Date()
  const dayNum = Math.max(1, Math.floor((today.getTime() - launchDate.getTime()) / 86400000) + 1)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        padding: 20,
        background: 'linear-gradient(180deg, #1A237E 0%, #283593 50%, #3949AB 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          letterSpacing: 3,
          textShadow: '2px 2px 0 #E65100',
        }}
      >
        DAILY CHALLENGE #{dayNum}
      </div>

      {/* Modifier card */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          border: 'var(--border-w) solid var(--amber-deep)',
          maxWidth: 300,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28 }}>{modifier.icon}</div>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-xs)',
            color: 'var(--amber-deep)',
            marginTop: 8,
          }}
        >
          {modifier.name.toUpperCase()}
        </div>
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-md)',
            color: 'var(--muted-light)',
            marginTop: 8,
            lineHeight: 1.2,
          }}
        >
          {modifier.desc}
        </div>
      </div>

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: '#EF5350',
          background: 'rgba(229,57,53,0.15)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        NG+1 DIFFICULTY &bull; 15 FLOORS &bull; NO SAVES
      </div>

      {/* Class selection (unless reorg) */}
      {!isReorg && !alreadyPlayed && (
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_CLASSES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              style={{
                width: 80,
                padding: '8px 6px',
                background: selected === i ? '#FFF8E1' : 'var(--ink-soft)',
                border: `var(--border-w) solid ${selected === i ? 'var(--gold)' : '#546E7A'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                boxShadow: selected === i ? 'var(--shadow-md)' : '2px 2px 0 var(--ink)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div className="sprite-idle" style={{ width: 40, height: 46 }}>
                <img
                  src={sprites[c.spriteId]}
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
              <span
                className="t-display"
                style={{
                  fontSize: 'var(--display-2xs)',
                  color: selected === i ? 'var(--ink)' : 'var(--muted-light)',
                }}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {alreadyPlayed && pastResult ? (
        <div
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            border: '2px solid var(--gold-bright)',
            maxWidth: 300,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--gold-bright)',
              marginBottom: 8,
            }}
          >
            TODAY'S RESULT
          </div>
          <div
            className="t-body"
            style={{ fontSize: 'var(--body-md)', color: '#FFF', lineHeight: 1.2 }}
          >
            {pastResult.won ? 'CLEARED' : 'FELL'} &bull; Floor {pastResult.floorsCleared}/15
          </div>
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-md)',
              color: 'var(--gold-bright)',
              margin: '8px 0',
            }}
          >
            {pastResult.score.toLocaleString()}
          </div>
          <div
            className="t-body"
            style={{ fontSize: 'var(--body-sm)', color: 'var(--muted)', lineHeight: 1.2 }}
          >
            Come back tomorrow for a new challenge
          </div>
        </div>
      ) : (
        <Button variant="accent" size="lg" onClick={() => onStart(PLAYER_CLASSES[selected])}>
          BEGIN CHALLENGE
        </Button>
      )}

      <Button variant="ghost" size="sm" onClick={onBack}>
        BACK
      </Button>
    </div>
  )
}
