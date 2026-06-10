import { useState } from 'react'
import type { PlayerClass } from '../types'
import { DAILY_MODIFIERS, getDailyModifier } from '../daily'
import { Button } from '../ui'

export default function DailyResultScreen({
  player,
  score,
  floorsCleared,
  totalTurns,
  totalDamageDealt,
  hpRemaining,
  won,
  seed,
  modifierId,
  onBack,
}: {
  player: PlayerClass
  score: number
  floorsCleared: number
  totalTurns: number
  totalDamageDealt: number
  hpRemaining: number
  won: boolean
  seed: number
  modifierId: string
  onBack: () => void
}) {
  const [shared, setShared] = useState(false)
  const modifier = DAILY_MODIFIERS.find((m) => m.id === modifierId) ?? getDailyModifier(seed)
  const launchDate = new Date('2026-03-17')
  const seedDate =
    seed > 0
      ? new Date(Math.floor(seed / 10000), (Math.floor(seed / 100) % 100) - 1, seed % 100)
      : new Date()
  const dayNum = Math.max(1, Math.floor((seedDate.getTime() - launchDate.getTime()) / 86400000) + 1)

  const stars = won
    ? '\u2B50\u2B50\u2B50'
    : floorsCleared >= 10
      ? '\u2B50\u2B50'
      : floorsCleared >= 5
        ? '\u2B50'
        : ''

  const shareText = [
    `Corporate Climb Daily #${dayNum} ${stars}`,
    `${modifier.icon} ${modifier.name}`,
    `${player.emoji} ${player.name} | Floor ${floorsCleared}/15`,
    `\u26A1 ${totalTurns} turns | \uD83D\uDCA5 ${totalDamageDealt.toLocaleString()} dmg`,
    `\uD83C\uDFC6 Score: ${score.toLocaleString()}`,
    `corporateclimb.vercel.app`,
  ].join('\n')

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        setShared(true)
      } catch {
        /* share cancelled or unavailable */
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
        background: won
          ? 'linear-gradient(180deg, #FF6F00 0%, #FFA000 30%, #FFC107 60%, #FFD54F 100%)'
          : 'linear-gradient(180deg, #263238 0%, #37474F 50%, #455A64 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: won ? 'var(--ink)' : 'var(--gold-bright)',
          letterSpacing: 3,
        }}
      >
        DAILY #{dayNum} {won ? 'CLEARED' : 'FAILED'}
      </div>

      <div style={{ fontSize: 28 }}>{modifier.icon}</div>
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: won ? '#E65100' : 'var(--amber-deep)',
        }}
      >
        {modifier.name.toUpperCase()}
      </div>

      {/* Score card */}
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          maxWidth: 300,
          width: '100%',
          border: 'var(--border-w) solid var(--amber-deep)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-lg)',
            color: 'var(--gold-bright)',
            textAlign: 'center',
          }}
        >
          {score.toLocaleString()}
        </div>
        <div
          className="t-display"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            fontSize: 'var(--display-2xs)',
          }}
        >
          <div style={{ color: 'var(--muted)' }}>CLASS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
            {player.emoji} {player.name}
          </div>
          <div style={{ color: 'var(--muted)' }}>FLOORS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{floorsCleared}/15</div>
          <div style={{ color: 'var(--muted)' }}>TURNS</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{totalTurns}</div>
          <div style={{ color: 'var(--muted)' }}>DAMAGE</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
            {totalDamageDealt.toLocaleString()}
          </div>
          <div style={{ color: 'var(--muted)' }}>HP LEFT</div>
          <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{hpRemaining}</div>
        </div>
      </div>

      <Button
        variant="accent"
        size="md"
        onClick={handleShare}
        style={shared ? { background: 'var(--green)' } : undefined}
      >
        {shared ? 'COPIED!' : 'SHARE RESULT'}
      </Button>

      <Button variant="ghost" size="md" onClick={onBack}>
        BACK TO TITLE
      </Button>
    </div>
  )
}
