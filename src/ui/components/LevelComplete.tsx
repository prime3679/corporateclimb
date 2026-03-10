import { usePlayerStats } from '../stores/playerStats'
import { useChoiceHistory } from '../stores/choiceHistory'

interface LevelCompleteProps {
  levelName: string
  onContinue: () => void
}

const STAT_LABELS: Record<string, string> = {
  energy: 'Energy',
  reputation: 'Reputation',
  network: 'Network',
  cash: 'Cash',
}

const STAT_COLORS: Record<string, string> = {
  energy: '#F59E0B',
  reputation: '#3B82F6',
  network: '#10B981',
  cash: '#8B5CF6',
}

export function LevelComplete({ levelName, onContinue }: LevelCompleteProps) {
  const stats = usePlayerStats()
  const choices = useChoiceHistory((s) => s.choices)

  const statEntries = [
    { key: 'energy', value: stats.energy },
    { key: 'reputation', value: stats.reputation },
    { key: 'network', value: stats.network },
    { key: 'cash', value: stats.cash },
  ]

  // Collect unique tags from this session's choices
  const allTags = choices.flatMap((c) => c.tags)
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        pointerEvents: 'auto',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '2px solid #4F46E5',
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 480,
          width: '90%',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 28, color: '#F59E0B' }}>
          Level Complete!
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 16, color: '#94A3B8' }}>
          {levelName}
        </p>

        {/* Stat Summary */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
          {statEntries.map((s) => (
            <div key={s.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: STAT_COLORS[s.key] }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                {STAT_LABELS[s.key]}
              </div>
            </div>
          ))}
        </div>

        {/* Playstyle Tags */}
        {topTags.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Your playstyle</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {topTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: '#4F46E5',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 14,
                    textTransform: 'capitalize',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Choices Made */}
        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
          {choices.length} choice{choices.length !== 1 ? 's' : ''} made
        </div>

        <button
          onClick={onContinue}
          style={{
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#4338CA')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#4F46E5')}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
