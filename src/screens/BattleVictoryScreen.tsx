import type { Enemy, RelicId } from '@/types'
import { CURRENCY_ICON, RELICS } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import { Button, Panel } from '@/ui'

export default function BattleVictoryScreen({
  enemy,
  xpGained,
  optionsGained,
  onContinue,
  leveledUp,
  newLevel,
  relicGained,
}: {
  enemy: Enemy
  xpGained: number
  optionsGained: number
  onContinue: () => void
  leveledUp: boolean
  newLevel: number
  relicGained?: RelicId | null
}) {
  const relic = relicGained ? RELICS[relicGained] : null
  const sprites = getSpriteUrls()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 20,
        padding: 30,
        background: 'linear-gradient(180deg, #1A237E 0%, #283593 50%, #3949AB 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          textShadow: '2px 2px 0 #E65100',
          animation: 'pulse 1.5s infinite',
        }}
      >
        &#x2726; VICTORY &#x2726;
      </div>
      <div style={{ width: 80, height: 92, opacity: 0.5 }}>
        <img
          src={sprites[enemy.spriteId]}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'auto',
            padding: '8% 2% 0 2%',
            objectFit: 'contain',
            filter: 'grayscale(1)',
          }}
          draggable={false}
        />
      </div>
      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-lg)',
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {enemy.name} was defeated!
      </div>

      <Panel variant="glass" style={{ textAlign: 'center', maxWidth: 280 }}>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--sky-soft)',
            marginBottom: 8,
          }}
        >
          +{xpGained} XP GAINED
        </div>
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--gold)',
            marginBottom: 8,
          }}
        >
          +{optionsGained} {CURRENCY_ICON} STOCK OPTIONS
        </div>
        {relic && (
          <div
            style={{
              border: '2px solid var(--gold-bright)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
              marginBottom: 8,
              background: 'rgba(255,193,7,0.12)',
            }}
          >
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold-bright)' }}
            >
              STATUS SYMBOL!
            </div>
            <div
              className="t-body"
              style={{ fontSize: 'var(--body-md)', color: 'var(--paper)', marginTop: 4 }}
            >
              {relic.icon} {relic.name}
            </div>
            <div
              className="t-body"
              style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', lineHeight: 1.2 }}
            >
              {relic.desc}
            </div>
          </div>
        )}
        {leveledUp && (
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-xs)',
              color: 'var(--gold-bright)',
              animation: 'pulse 1s infinite',
            }}
          >
            LEVEL UP! &rarr; Lv.{newLevel}
          </div>
        )}
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-md)',
            color: 'var(--muted-light)',
            marginTop: 10,
            lineHeight: 1.2,
            fontStyle: 'italic',
          }}
        >
          &ldquo;{enemy.defeat}&rdquo;
        </div>
      </Panel>

      <Button variant="primary" size="lg" onClick={onContinue}>
        CONTINUE &rarr;
      </Button>
    </div>
  )
}
