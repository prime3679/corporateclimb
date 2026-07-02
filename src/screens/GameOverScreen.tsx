import { useState } from 'react'
import type { PlayerClass } from '@/types'
import { CURRENCY_ICON, getAscensionTier, groupPerks } from '@/data'
import type { LifetimeStats, RunRecord } from '@/history'
import { share } from '@/platform'
import { Button, IconChip, Panel, getIconGlyph } from '@/ui'
import styles from './InterludeScreen.module.css'

const DEFEAT_FLAVOR: [number, number, string][] = [
  [1, 5, 'HR sends a polite rejection email. Better luck next quarter.'],
  [6, 10, 'Your badge stops working on Monday. So close to management.'],
  [11, 15, 'Security escorts you out. You could see the corner office from here.'],
  [16, 20, 'The board sends a form letter. Your parking spot is already reassigned.'],
  [21, 30, 'Your resignation makes the front page. At least they spelled your name right.'],
]

function getDefeatText(floor: number): string {
  for (const [lo, hi, text] of DEFEAT_FLAVOR) {
    if (floor >= lo && floor <= hi) return text
  }
  return 'The corporate ladder claims another soul.'
}

export default function GameOverScreen({
  floor,
  onRestart,
  player,
  record,
  lifetime,
}: {
  floor: number
  onRestart: () => void
  player?: PlayerClass | null
  /** The just-recorded run, for the stat card and build recap. */
  record?: RunRecord | null
  lifetime?: LifetimeStats | null
}) {
  const [shared, setShared] = useState(false)
  const build = record ? groupPerks(record.perks) : []
  const reorgTier = record && record.ascension > 0 ? getAscensionTier(record.ascension) : null

  const shareText = record
    ? `Corporate Climb ended my run on Floor ${floor}${record.defeatedBy ? ` — taken down by ${record.defeatedBy}` : ''}. ${record.totalTurns} turns, ${record.totalDamageDealt.toLocaleString()} damage dealt.${record.ngPlus > 0 ? ` NG+${record.ngPlus}.` : ''} The climb continues. corporateclimb.vercel.app`
    : `Corporate Climb ended my run on Floor ${floor}. The climb continues. corporateclimb.vercel.app`

  const handleShare = async () => {
    const result = await share(shareText)
    if (result === 'shared') setShared(true)
    else if (result === 'copied') {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{
        gap: 14,
        padding: '24px 20px',
      }}
    >
      <div className={styles.board} />
      <div
        className={`t-display ${styles.header}`}
        style={{
          fontSize: 'var(--display-md)',
          color: 'var(--red)',
          textShadow: '2px 2px 0 #B71C1C',
        }}
      >
        GAME OVER
      </div>
      {reorgTier && record && (
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--red)',
            letterSpacing: 2,
            padding: '3px 10px',
            borderRadius: 999,
            border: '1px solid rgba(229,57,53,.5)',
            background: 'rgba(229,57,53,.12)',
          }}
        >
          {reorgTier.icon} RE-ORG {record.ascension} · {reorgTier.name.toUpperCase()}
        </div>
      )}
      <IconChip glyph="EXIT" tone="red" size="lg" />
      <div
        className={`t-body ${styles.caption}`}
        style={{
          fontSize: 'var(--body-lg)',
          lineHeight: 1.25,
          maxWidth: 300,
        }}
      >
        {record?.defeatedBy ? (
          <>
            Taken down by <b>{record.defeatedBy}</b> on Floor {floor}.
          </>
        ) : (
          <>You were eliminated on Floor {floor}.</>
        )}
      </div>
      <div
        className={`t-body ${styles.caption}`}
        style={{
          fontSize: 'var(--body-md)',
          lineHeight: 1.2,
          maxWidth: 280,
          fontStyle: 'italic',
        }}
      >
        {getDefeatText(floor)}
      </div>

      {record && (
        <Panel
          variant="dark"
          style={{
            maxWidth: 320,
            width: '100%',
            borderColor: 'rgba(255,90,90,0.22)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background:
              'linear-gradient(180deg, rgba(255,255,255,.06), transparent 24%), linear-gradient(180deg, rgba(39,18,18,.94), rgba(13,19,32,.96))',
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--red)',
              textAlign: 'center',
              letterSpacing: 2,
            }}
          >
            Exit Interview
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
            {player && (
              <>
                <div style={{ color: 'var(--muted-light)' }}>CLASS</div>
                <div
                  style={{
                    color: 'var(--paper)',
                    textAlign: 'right',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IconChip glyph={getIconGlyph(player.emoji, player.name)} tone="gold" size="sm" />
                  <span>{player.name}</span>
                </div>
              </>
            )}
            <div style={{ color: 'var(--muted-light)' }}>FLOOR</div>
            <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{floor}</div>
            <div style={{ color: 'var(--muted-light)' }}>TURNS</div>
            <div style={{ color: 'var(--paper)', textAlign: 'right' }}>{record.totalTurns}</div>
            <div style={{ color: 'var(--muted-light)' }}>DAMAGE</div>
            <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
              {record.totalDamageDealt.toLocaleString()}
            </div>
            <div style={{ color: 'var(--muted-light)' }}>OPTIONS</div>
            <div style={{ color: 'var(--paper)', textAlign: 'right' }}>
              {CURRENCY_ICON} {record.stockOptions}
            </div>
            {record.ngPlus > 0 && (
              <>
                <div style={{ color: 'var(--muted-light)' }}>MODE</div>
                <div style={{ color: 'var(--paper)', textAlign: 'right' }}>NG+{record.ngPlus}</div>
              </>
            )}
          </div>
          {build.length > 0 && (
            <div
              className="t-body"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
                fontSize: 'var(--body-sm)',
                color: 'var(--muted-light)',
              }}
            >
              {build.map((g) => (
                <span
                  key={g.perk.id}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid var(--cc-line)',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  {g.perk.name}
                  {g.count > 1 ? ` ×${g.count}` : ''}
                </span>
              ))}
            </div>
          )}
        </Panel>
      )}

      {lifetime && lifetime.runs > 0 && (
        <div
          className="t-body"
          style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', letterSpacing: 0.4 }}
        >
          Run #{lifetime.runs} · Best: Floor {lifetime.bestFloor} · Wins: {lifetime.wins}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Button variant="primary" size="lg" onClick={onRestart}>
          TRY AGAIN
        </Button>
        <Button variant="ghost" size="md" onClick={handleShare}>
          {shared ? 'COPIED!' : 'SHARE'}
        </Button>
      </div>
    </div>
  )
}
