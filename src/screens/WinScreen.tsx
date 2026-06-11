import { useState, useEffect } from 'react'
import type { PlayerClass, AchievementId, AchievementDef } from '../types'
import { getSpriteUrls } from '../components/PixelSprite'
import { SFX } from '../sfx'
import { Button } from '../ui'

interface WinScreenProps {
  player: PlayerClass
  onRestart: () => void
  onNgPlus: () => void
  ngLevel: number
  bestNgLevel: number
  totalTurns: number
  totalDamageDealt: number
  floorsCleared: number
  newAchievements: AchievementId[]
  allAchievements: AchievementDef[]
  unlockedAchievements: Set<AchievementId>
}

export default function WinScreen({
  player,
  onRestart,
  onNgPlus,
  ngLevel,
  bestNgLevel,
  totalTurns,
  totalDamageDealt,
  floorsCleared,
  newAchievements,
  allAchievements,
  unlockedAchievements,
}: WinScreenProps) {
  const sprites = getSpriteUrls()
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (newAchievements.length > 0) {
      setTimeout(() => SFX.achievementUnlock(), 800)
    }
  }, [newAchievements])

  const shareText = `I climbed Corporate Climb as ${player.name} in ${totalTurns} turns, dealing ${totalDamageDealt.toLocaleString()} total damage. Floor ${floorsCleared} cleared.${ngLevel > 0 ? ` NG+${ngLevel}!` : ''} Can you beat that? corporateclimb.vercel.app`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        setShared(true)
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 14,
        padding: 20,
        background: 'linear-gradient(180deg, #FF6F00 0%, #FFA000 30%, #FFC107 60%, #FFD54F 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 31) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: 8,
            height: 8,
            background: ['#E53935', '#1E88E5', '#43A047', '#8E24AA', '#FDD835'][i % 5],
            borderRadius: i % 2 === 0 ? '50%' : '2px',
            animation: `confetti ${2 + (i % 3)}s infinite`,
            animationDelay: `${i * 0.15}s`,
            opacity: 0.8,
          }}
        />
      ))}

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--ink)',
          letterSpacing: 4,
        }}
      >
        &#x2726; CONGRATULATIONS &#x2726;
      </div>
      <div className="sprite-idle" style={{ width: 80, height: 92 }}>
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
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-md)',
          color: 'var(--ink)',
          textAlign: 'center',
          lineHeight: 1.8,
          textShadow: '2px 2px 0 rgba(255,255,255,0.5)',
        }}
      >
        YOU CLIMBED THE
        <br />
        CORPORATE LADDER!
      </div>
      {player.winTitle && (
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-xs)',
            color: '#E65100',
            textAlign: 'center',
            textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {player.winTitle}
        </div>
      )}
      {player.winText && (
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-md)',
            color: '#4E342E',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 300,
            fontStyle: 'italic',
          }}
        >
          {player.winText}
        </div>
      )}

      {/* Share Card */}
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          maxWidth: 320,
          width: '100%',
          border: '3px solid var(--gold)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--gold)',
            textAlign: 'center',
            letterSpacing: 2,
          }}
        >
          Corporate Ladder Climbed
        </div>
        <div
          className="t-body"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            fontSize: 'var(--body-md)',
            lineHeight: 1.2,
          }}
        >
          <div style={{ color: 'var(--muted-light)' }}>CLASS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
            {player.emoji} {player.name}
          </div>
          <div style={{ color: 'var(--muted-light)' }}>FLOORS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
            {floorsCleared}/{floorsCleared}
          </div>
          <div style={{ color: 'var(--muted-light)' }}>TURNS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{totalTurns}</div>
          <div style={{ color: 'var(--muted-light)' }}>DAMAGE</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
            {totalDamageDealt.toLocaleString()}
          </div>
          {ngLevel > 0 && (
            <>
              <div style={{ color: 'var(--muted-light)' }}>NG+</div>
              <div style={{ color: '#E65100', textAlign: 'right', fontWeight: 'bold' }}>
                {ngLevel}
              </div>
            </>
          )}
        </div>
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-sm)',
            color: 'var(--muted)',
            textAlign: 'center',
            lineHeight: 1.2,
            marginTop: 4,
          }}
        >
          Think you can do better?
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleShare}
          style={shared ? { background: 'var(--green)', color: '#FFF' } : undefined}
        >
          {shared ? 'COPIED!' : 'SHARE RESULT'}
        </Button>
      </div>

      {/* Newly unlocked achievements */}
      {newAchievements.length > 0 && (
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            maxWidth: 320,
            width: '100%',
            border: '2px solid var(--gold-bright)',
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--gold-bright)',
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: 2,
            }}
          >
            NEW ACHIEVEMENTS!
          </div>
          {newAchievements.map((id) => {
            const ach = allAchievements.find((a) => a.id === id)
            if (!ach) return null
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <span style={{ fontSize: 14 }}>{ach.icon}</span>
                <div className="t-body" style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 'var(--body-md)', color: 'var(--paper)' }}>
                    {ach.name}
                  </div>
                  <div style={{ fontSize: 'var(--body-md)', color: 'var(--muted-light)' }}>
                    {ach.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Achievement progress */}
      <div
        style={{
          opacity: 0.8,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {allAchievements.map((ach) => (
          <span
            key={ach.id}
            title={`${ach.name}: ${ach.desc}`}
            style={{
              opacity: unlockedAchievements.has(ach.id) ? 1 : 0.3,
              fontSize: 14,
            }}
          >
            {ach.icon}
          </span>
        ))}
      </div>

      {ngLevel > 0 && (
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: '#E65100',
            background: 'rgba(0,0,0,0.15)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          NG+{ngLevel} CLEARED!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <Button variant="accent" size="lg" onClick={onNgPlus}>
          NEW GAME+ {ngLevel + 1}
        </Button>
        <Button variant="ghost" size="md" onClick={onRestart}>
          RESTART
        </Button>
        {bestNgLevel > 0 && (
          <div
            className="t-body"
            style={{
              fontSize: 'var(--body-sm)',
              color: '#4E342E',
              lineHeight: 1.2,
              opacity: 0.7,
            }}
          >
            BEST: NG+{bestNgLevel}
          </div>
        )}
      </div>
    </div>
  )
}
