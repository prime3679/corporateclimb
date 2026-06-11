import { useState } from 'react'
import type { PlayerClass } from '@/types'
import { PLAYER_CLASSES } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import TypeBadge from '@/components/TypeBadge'
import { Button, Panel } from '@/ui'

export default function ClassSelect({ onSelect }: { onSelect: (cls: PlayerClass) => void }) {
  const [selected, setSelected] = useState(0)
  const sprites = getSpriteUrls()
  const cls = PLAYER_CLASSES[selected]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #263238 0%, #37474F 100%)',
        padding: 20,
        gap: 14,
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-sm)',
          color: 'var(--gold-bright)',
          textAlign: 'center',
          textShadow: '2px 2px 0 #E65100',
        }}
      >
        CHOOSE YOUR CLASS
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {PLAYER_CLASSES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            aria-pressed={selected === i}
            style={{
              width: 100,
              padding: '12px 8px',
              background: selected === i ? '#FFF8E1' : 'var(--ink-soft)',
              border: `var(--border-w) solid ${selected === i ? 'var(--gold)' : '#546E7A'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              boxShadow:
                selected === i
                  ? 'var(--shadow-md), inset 0 0 12px rgba(255,193,7,0.15)'
                  : '2px 2px 0 var(--ink)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div className="sprite-idle" style={{ width: 52, height: 60 }}>
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
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {c.name}
            </span>
          </button>
        ))}
      </div>

      <Panel
        variant="paper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div style={{ width: 40, height: 46 }}>
            <img
              src={sprites[cls.spriteId]}
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
          <div>
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-xs)', color: 'var(--ink)' }}
            >
              {cls.name}
            </div>
            <div
              className="t-body"
              style={{
                fontSize: 'var(--body-sm)',
                lineHeight: 1.2,
                color: 'var(--muted)',
                marginTop: 4,
              }}
            >
              {cls.desc}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(
            [
              ['HP', cls.maxHp, 'var(--green)'],
              ['ATK', cls.atk, 'var(--red)'],
              ['DEF', cls.def, 'var(--sky)'],
              ['SPD', cls.spd, 'var(--orange)'],
            ] as const
          ).map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="t-display"
                style={{ fontSize: 'var(--display-2xs)', color: 'var(--ink)', width: 30 }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 7,
                  background: 'var(--paper-dim)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(val / 20) * 100}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 3,
                    maxWidth: '100%',
                  }}
                />
              </div>
              <span
                className="t-display"
                style={{
                  fontSize: 'var(--display-2xs)',
                  color: 'var(--ink-soft)',
                  width: 24,
                  textAlign: 'right',
                }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 2,
            padding: '6px 8px',
            background: '#FFF8E1',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--gold-bright)',
          }}
        >
          <span style={{ fontSize: 16 }}>{cls.perk.icon}</span>
          <div>
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--amber-deep)' }}
            >
              {cls.perk.name}
            </div>
            <div
              className="t-body"
              style={{
                fontSize: 'var(--body-sm)',
                lineHeight: 1.2,
                color: 'var(--muted)',
                marginTop: 2,
              }}
            >
              {cls.perk.desc}
            </div>
          </div>
        </div>

        <div
          className="t-display"
          style={{ fontSize: 'var(--display-2xs)', color: 'var(--ink)', marginTop: 2 }}
        >
          MOVES:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {cls.moves.map((m) => (
            <div
              key={m.name}
              style={{
                padding: '5px 6px',
                background: 'var(--paper-dim)',
                borderRadius: 4,
                border: '1px solid var(--muted-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  className="t-display"
                  style={{ fontSize: 'var(--display-2xs)', color: 'var(--ink)' }}
                >
                  {m.name}
                </span>
                <TypeBadge type={m.type} />
              </div>
              <span
                className="t-body"
                style={{ fontSize: 'var(--body-sm)', lineHeight: 1.2, color: 'var(--muted)' }}
              >
                {m.desc}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Button
        variant="primary"
        size="lg"
        onClick={() => onSelect(PLAYER_CLASSES[selected])}
        style={{ alignSelf: 'center' }}
      >
        CONFIRM
      </Button>
    </div>
  )
}
