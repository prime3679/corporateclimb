import { useState, useEffect } from 'react'
import type { PerkId, PlayerClass, AchievementId, AchievementDef } from '@/types'
import { CURRENCY_ICON, groupPerks } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import { SFX } from '@/sfx'
import { Button, IconChip, Panel, getIconGlyph } from '@/ui'
import styles from './InterludeScreen.module.css'

interface RunCompleteScreenProps {
  player: PlayerClass
  onRestart: () => void
  onNgPlus: () => void
  ngLevel: number
  bestNgLevel: number
  totalTurns: number
  totalDamageDealt: number
  floorsCleared: number
  perks?: PerkId[]
  stockOptions?: number
  newAchievements: AchievementId[]
  allAchievements: AchievementDef[]
  unlockedAchievements: Set<AchievementId>
}

export default function RunCompleteScreen({
  player,
  onRestart,
  onNgPlus,
  ngLevel,
  bestNgLevel,
  totalTurns,
  totalDamageDealt,
  floorsCleared,
  perks = [],
  stockOptions = 0,
  newAchievements,
  allAchievements,
  unlockedAchievements,
}: RunCompleteScreenProps) {
  const sprites = getSpriteUrls()
  const [shared, setShared] = useState(false)
  const build = groupPerks(perks)

  useEffect(() => {
    if (newAchievements.length > 0) {
      setTimeout(() => SFX.achievementUnlock(), 800)
    }
  }, [newAchievements])

  const buildText =
    build.length > 0
      ? ` Build: ${build.map((g) => (g.count > 1 ? `${g.perk.name} ×${g.count}` : g.perk.name)).join(', ')}.`
      : ''
  const shareText = `I climbed Corporate Climb as ${player.name} in ${totalTurns} turns, dealing ${totalDamageDealt.toLocaleString()} total damage. Floor ${floorsCleared} cleared.${ngLevel > 0 ? ` NG+${ngLevel}!` : ''}${buildText} Can you beat that? corporateclimb.vercel.app`

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
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{
        gap: 14,
        padding: 20,
      }}
    >
      <div className={styles.board} />
      <div className={`${styles.glow} ${styles.glowTop}`} />
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
        className={`t-display ${styles.eyebrow}`}
        style={{
          fontSize: 'var(--display-xs)',
          letterSpacing: 4,
        }}
      >
        CONGRATULATIONS
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
        className={`t-display ${styles.header}`}
        style={{
          fontSize: 'var(--display-md)',
          lineHeight: 1.8,
        }}
      >
        YOU CLIMBED THE
        <br />
        CORPORATE LADDER!
      </div>
      {player.winTitle && (
        <div
          className={`t-display ${styles.eyebrow}`}
          style={{
            fontSize: 'var(--display-xs)',
            color: '#ffc190',
            textAlign: 'center',
          }}
        >
          {player.winTitle}
        </div>
      )}
      {player.winText && (
        <div
          className={`t-body ${styles.caption}`}
          style={{
            fontSize: 'var(--body-md)',
            lineHeight: 1.2,
            maxWidth: 300,
            fontStyle: 'italic',
          }}
        >
          {player.winText}
        </div>
      )}

      {/* Share Card */}
      <Panel
        variant="dark"
        style={{
          maxWidth: 320,
          width: '100%',
          borderColor: 'rgba(255,211,77,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background:
            'linear-gradient(180deg, rgba(255,255,255,.06), transparent 24%), linear-gradient(180deg, rgba(39,27,18,.94), rgba(13,19,32,.96))',
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
          <div style={{ color: 'var(--muted-light)' }}>OPTIONS</div>
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
            <span>{stockOptions}</span>
            <IconChip glyph={getIconGlyph(CURRENCY_ICON, 'OPT')} tone="gold" size="sm" />
          </div>
          {ngLevel > 0 && (
            <>
              <div style={{ color: 'var(--muted-light)' }}>NG+</div>
              <div style={{ color: 'var(--gold-bright)', textAlign: 'right', fontWeight: 'bold' }}>
                {ngLevel}
              </div>
            </>
          )}
        </div>
        {build.length > 0 && (
          <div
            className="t-body"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'center',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              paddingTop: 8,
            }}
          >
            <span style={{ color: 'var(--muted-light)', fontSize: 'var(--body-sm)' }}>BUILD</span>
            {build.map(({ perk, count }) => (
              <span
                key={perk.id}
                title={`${perk.name}: ${perk.desc}`}
                style={{
                  color: 'var(--paper)',
                  fontSize: 'var(--body-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconChip glyph={getIconGlyph(perk.icon, perk.name)} tone="ember" size="sm" />
                {count > 1 ? `×${count}` : ''}
              </span>
            ))}
          </div>
        )}
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
      </Panel>

      {/* Newly unlocked achievements */}
      {newAchievements.length > 0 && (
        <Panel
          variant="dark"
          style={{
            maxWidth: 320,
            width: '100%',
            borderColor: 'rgba(255,211,77,0.22)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,.05), transparent 24%), linear-gradient(180deg, rgba(39,27,18,.9), rgba(13,19,32,.95))',
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
                <IconChip glyph={getIconGlyph(ach.icon, ach.name)} tone="gold" size="sm" />
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
        </Panel>
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
              display: 'inline-flex',
            }}
          >
            <IconChip
              glyph={getIconGlyph(ach.icon, ach.name)}
              tone={unlockedAchievements.has(ach.id) ? 'gold' : 'muted'}
              size="sm"
            />
          </span>
        ))}
      </div>

      {ngLevel > 0 && (
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--gold-bright)',
            background: 'rgba(0,0,0,0.36)',
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
              color: '#c9a480',
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
