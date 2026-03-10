import { useEffect, useState } from 'react'
import { usePlayerStats } from '../stores/playerStats'
import { useGameState } from '../stores/gameState'

const STAT_CONFIG = [
  { key: 'energy' as const, label: 'Energy', color: '#F59E0B', icon: '⚡' },
  { key: 'reputation' as const, label: 'Rep', color: '#3B82F6', icon: '★' },
  { key: 'network' as const, label: 'Net', color: '#10B981', icon: '🔗' },
  { key: 'cash' as const, label: 'Cash', color: '#8B5CF6', icon: '$' },
]

interface StatDelta {
  key: string
  value: number
  id: number
}

export function HUD() {
  const stats = usePlayerStats()
  const { isPlaying, setPaused } = useGameState()
  const [deltas, setDeltas] = useState<StatDelta[]>([])
  const [prevStats, setPrevStats] = useState({ energy: 50, reputation: 50, network: 50, cash: 50 })

  // Detect stat changes and show floating deltas
  useEffect(() => {
    for (const cfg of STAT_CONFIG) {
      const prev = prevStats[cfg.key]
      const curr = stats[cfg.key]
      if (curr !== prev) {
        const delta = curr - prev
        const id = Date.now() + Math.random()
        setDeltas((d) => [...d, { key: cfg.key, value: delta, id }])
        setTimeout(() => setDeltas((d) => d.filter((x) => x.id !== id)), 1200)
      }
    }
    setPrevStats({ energy: stats.energy, reputation: stats.reputation, network: stats.network, cash: stats.cash })
  }, [stats.energy, stats.reputation, stats.network, stats.cash])

  if (!isPlaying) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '12px 16px',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 180,
      }}
    >
      {STAT_CONFIG.map((cfg) => {
        const value = stats[cfg.key]
        const activeDelta = deltas.find((d) => d.key === cfg.key)
        const isGlowing = !!activeDelta

        return (
          <div key={cfg.key} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{cfg.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'system-ui, sans-serif',
                  flex: 1,
                }}
              >
                {cfg.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {value}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: isGlowing ? `0 0 8px ${cfg.color}40` : 'none',
                transition: 'box-shadow 0.3s',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${value}%`,
                  background: cfg.color,
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            {/* Floating delta */}
            {activeDelta && (
              <span
                style={{
                  position: 'absolute',
                  right: -40,
                  top: -2,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: activeDelta.value > 0 ? '#34D399' : '#F87171',
                  animation: 'floatUp 1.2s ease forwards',
                  pointerEvents: 'none',
                }}
              >
                {activeDelta.value > 0 ? '+' : ''}{activeDelta.value}
              </span>
            )}
          </div>
        )
      })}

      {/* Inline animation */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>

      {/* Pause button */}
      <button
        onClick={() => setPaused(true)}
        style={{
          marginTop: 4,
          background: 'none',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ❚❚ Pause
      </button>
    </div>
  )
}
