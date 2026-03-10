import { useState, useEffect } from 'react'
import { usePlayerStats } from '../stores/playerStats'
import { useChoiceHistory } from '../stores/choiceHistory'

interface EndingData {
  type: string
  path: string
  wallsBroken?: number
  cashAtEnd?: number
}

const ENDING_TITLES: Record<string, { title: string; subtitle: string }> = {
  // Level 6a endings
  visionary: { title: 'THE VISIONARY', subtitle: 'You reshaped the company. The view is great. The air is thin.' },
  successful: { title: 'THE SUCCESSFUL', subtitle: 'You made it, at a cost. The corner office suits you.' },
  trapped: { title: 'THE TRAPPED', subtitle: 'You escaped but barely. The walls still echo.' },
  crushed: { title: 'THE CRUSHED', subtitle: 'The golden cage held. But you know the way out now.' },
  // Level 6b endings
  unicorn: { title: 'THE UNICORN', subtitle: 'Product-market fit. The algorithm bends to you now.' },
  indie: { title: 'THE INDIE', subtitle: 'Modest success. The coffee shop wifi is your corner office.' },
  survivor: { title: 'THE SURVIVOR', subtitle: 'You barely made it. But the product launched.' },
  almost: { title: 'THE ALMOST', subtitle: 'So close. The launch meter froze. But you learned.' },
  // Level 6c ending
  hybrid: { title: 'THE HYBRID', subtitle: "You didn't choose between the ladder and the leap. You built the ladder while leaping." },
}

interface EndingScreenProps {
  onPlayAgain: () => void
}

export function EndingScreen({ onPlayAgain }: EndingScreenProps) {
  const [phase, setPhase] = useState<'title' | 'stats' | 'credits'>('title')
  const stats = usePlayerStats()
  const history = useChoiceHistory()

  const endingData: EndingData = (window as any).__corporateClimbEnding ?? { type: 'successful', path: 'corporate' }
  const ending = ENDING_TITLES[endingData.type] ?? ENDING_TITLES.successful

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('stats'), 4000)
    return () => clearTimeout(t1)
  }, [])

  const statBars = [
    { label: 'Energy', value: stats.energy, color: '#10B981' },
    { label: 'Reputation', value: stats.reputation, color: '#EF4444' },
    { label: 'Network', value: stats.network, color: '#3B82F6' },
    { label: 'Cash', value: stats.cash, color: '#FBBF24' },
  ]

  const keyTags = history.choices
    .flatMap((c) => c.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topTags = Object.entries(keyTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        zIndex: 200,
        pointerEvents: 'auto',
        fontFamily: 'system-ui, sans-serif',
        color: '#F1F5F9',
        animation: 'fadeIn 1s ease',
      }}
    >
      {phase === 'title' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 1.5s ease' }}>
          <div style={{ fontSize: '14px', color: '#64748B', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
            ENDING
          </div>
          <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', letterSpacing: '2px' }}>
            {ending.title}
          </div>
          <div style={{ fontSize: '18px', color: '#94A3B8', fontStyle: 'italic', maxWidth: '90%', padding: '0 16px' }}>
            {ending.subtitle}
          </div>
        </div>
      )}

      {phase === 'stats' && (
        <div style={{ textAlign: 'center', width: '90%', maxWidth: '400px', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '30px' }}>
            Final Stats
          </div>

          {statBars.map((stat) => (
            <div key={stat.label} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>{stat.label}</span>
                <span style={{ fontSize: '14px', color: stat.color }}>{stat.value}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${stat.value}%`,
                    height: '100%',
                    backgroundColor: stat.color,
                    borderRadius: '4px',
                    transition: 'width 1.5s ease',
                  }}
                />
              </div>
            </div>
          ))}

          {topTags.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>Your playstyle:</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {topTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#818CF8',
                    }}
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => setPhase('credits')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F1F5F9',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Credits
            </button>
            <button
              onClick={onPlayAgain}
              style={{
                padding: '10px 24px',
                backgroundColor: '#4F46E5',
                border: 'none',
                borderRadius: '8px',
                color: '#F1F5F9',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Play Again?
            </button>
          </div>
        </div>
      )}

      {phase === 'credits' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>
            Corporate Climb
          </div>
          <div style={{ fontSize: '16px', color: '#94A3B8', lineHeight: '2' }}>
            Created by Adrian Lumley<br />
            adrianlumley.co<br /><br />
            Built with Claude Code<br />
            Phaser 3 + React + TypeScript + Zustand<br /><br />
            <span style={{ fontStyle: 'italic', color: '#64748B' }}>
              "The corporate ladder is a game. Now you know the rules."
            </span>
          </div>
          <button
            onClick={onPlayAgain}
            style={{
              marginTop: '32px',
              padding: '10px 24px',
              backgroundColor: '#4F46E5',
              border: 'none',
              borderRadius: '8px',
              color: '#F1F5F9',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Play Again?
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
