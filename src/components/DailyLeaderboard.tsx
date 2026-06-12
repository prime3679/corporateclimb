import { useEffect, useState } from 'react'
import {
  MAX_HANDLE_LENGTH,
  fetchDailyLeaderboard,
  getHandle,
  hasSubmitted,
  sanitizeHandle,
  setHandle,
  submitDailyScore,
  type LeaderboardEntry,
} from '@/leaderboard'
import { PLAYER_CLASSES } from '@/data'
import { Button } from '@/ui'

/**
 * The daily Top Climbers board. Entering a handle is the opt-in for
 * submitting; without one the board is read-only, and when the API is
 * unavailable (local dev, unprovisioned store) the whole section
 * renders nothing.
 */
export default function DailyLeaderboard({
  seed,
  score,
  classId,
  floorsCleared,
  won,
}: {
  seed: number
  score: number
  classId: string
  floorsCleared: number
  won: boolean
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [available, setAvailable] = useState(true)
  const [handle, setHandleState] = useState(getHandle())
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(hasSubmitted(seed))

  // Submit once a handle exists, then (re)load the board.
  useEffect(() => {
    let cancelled = false
    const go = async () => {
      if (handle && !hasSubmitted(seed)) {
        const ok = await submitDailyScore({
          seed,
          score,
          classId,
          floorsCleared,
          won,
          name: handle,
        })
        if (!cancelled && ok) setSubmitted(true)
      }
      const top = await fetchDailyLeaderboard(seed)
      if (cancelled) return
      if (top === null) setAvailable(false)
      else setEntries(top)
    }
    void go()
    return () => {
      cancelled = true
    }
  }, [handle, seed, score, classId, floorsCleared, won, submitted])

  if (!available) return null

  const joinBoard = () => {
    const clean = sanitizeHandle(draft)
    if (!clean) return
    setHandle(clean)
    setHandleState(clean)
  }

  const classEmoji = (id: string) => PLAYER_CLASSES.find((c) => c.id === id)?.emoji ?? '👤'

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--sky)',
        padding: '10px 14px',
        width: '100%',
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--sky-soft)',
          textAlign: 'center',
          letterSpacing: 2,
        }}
      >
        🏅 TOP CLIMBERS
      </div>

      {!handle && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinBoard()}
            maxLength={MAX_HANDLE_LENGTH}
            placeholder="Your handle…"
            aria-label="Leaderboard handle"
            className="t-body"
            style={{
              flex: 1,
              fontSize: 'var(--body-md)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--muted)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              minWidth: 0,
            }}
          />
          <Button variant="primary" size="sm" onClick={joinBoard} disabled={!sanitizeHandle(draft)}>
            JOIN
          </Button>
        </div>
      )}
      {handle && (
        <div
          className="t-body"
          style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', textAlign: 'center' }}
        >
          {submitted ? `Submitted as ${handle}` : `Submitting as ${handle}…`}
        </div>
      )}

      {entries === null ? (
        <div className="t-body" style={{ fontSize: 'var(--body-sm)', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div
          className="t-body"
          style={{ fontSize: 'var(--body-sm)', color: 'var(--muted)', textAlign: 'center' }}
        >
          Nobody has clocked in yet. Be first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {entries.slice(0, 10).map((e, i) => {
            const mine = handle !== null && e.name === handle
            return (
              <div
                key={`${e.name}-${i}`}
                className="t-body"
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 'var(--body-md)',
                  lineHeight: 1.25,
                  color: mine ? 'var(--gold-bright)' : 'var(--paper)',
                }}
              >
                <span style={{ width: 22, color: 'var(--muted-light)' }}>{i + 1}.</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {classEmoji(e.classId)} {e.name}
                </span>
                <span style={{ color: 'var(--muted-light)' }}>
                  F{e.floorsCleared}
                  {e.won ? '🏆' : ''}
                </span>
                <span>{e.score.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
