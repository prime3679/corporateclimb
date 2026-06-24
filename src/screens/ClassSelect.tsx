import { useState } from 'react'
import type { PlayerClass } from '@/types'
import { PLAYER_CLASSES } from '@/data'
import { getSpriteUrls } from '@/components/PixelSprite'
import TypeBadge from '@/components/TypeBadge'
import { Button, IconChip, Panel, getIconGlyph } from '@/ui'

export default function ClassSelect({ onSelect }: { onSelect: (cls: PlayerClass) => void }) {
  const [selected, setSelected] = useState(0)
  const sprites = getSpriteUrls()
  const cls = PLAYER_CLASSES[selected]

  return (
    <div
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'transparent',
        padding: '22px 20px 20px',
        gap: 12,
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-sm)',
          color: 'var(--gold-bright)',
          textAlign: 'center',
          padding: '0 88px 0 12px',
          textShadow: '2px 2px 0 #E65100',
        }}
      >
        SELECT CAREER ARCHETYPE
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {PLAYER_CLASSES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            aria-pressed={selected === i}
            style={{
              width: 104,
              padding: '13px 8px 11px',
              background:
                selected === i
                  ? 'linear-gradient(180deg, rgba(255,216,161,.18), rgba(22,28,42,.98) 24%, rgba(9,12,20,.98))'
                  : 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(22,28,42,.94) 20%, rgba(8,10,18,.98))',
              border: `var(--border-w) solid ${selected === i ? 'rgba(255,211,77,.72)' : 'rgba(132,153,189,.42)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              boxShadow:
                selected === i
                  ? '0 16px 28px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,240,214,.16), inset 0 0 18px rgba(255,193,7,.12)'
                  : '0 10px 18px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div className="sprite-idle" style={{ width: 58, height: 66 }}>
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
                color: selected === i ? 'var(--gold-bright)' : 'var(--muted-light)',
                textAlign: 'center',
                lineHeight: 1.5,
                textShadow: selected === i ? '0 1px 0 rgba(5,7,13,.42)' : 'none',
              }}
            >
              {c.name}
            </span>
          </button>
        ))}
      </div>

      <Panel
        variant="dark"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
          overflow: 'auto',
          background:
            'linear-gradient(180deg, rgba(255,255,255,.06), transparent 18%), linear-gradient(180deg, rgba(28,34,48,.94), rgba(9,12,20,.98))',
          border: '1px solid rgba(255,240,214,.18)',
          boxShadow:
            '0 24px 44px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.08), inset 0 0 0 1px rgba(255,211,77,.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '104px 1fr',
            alignItems: 'center',
            gap: 14,
            marginBottom: 2,
            padding: '10px 10px 12px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,211,77,.18)',
            background:
              'radial-gradient(circle at 24% 48%, rgba(255,211,77,.13), transparent 38%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0))',
          }}
        >
          <div style={{ position: 'relative', width: 104, height: 118 }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 8,
                width: 82,
                height: 18,
                transform: 'translateX(-50%)',
                borderRadius: 999,
                background: 'radial-gradient(ellipse, rgba(0,0,0,.52), rgba(0,0,0,0) 72%)',
                filter: 'blur(2px)',
              }}
            />
            <div
              className="sprite-idle"
              style={{ position: 'relative', width: '100%', height: '100%' }}
            >
              <img
                src={sprites[cls.spriteId]}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  imageRendering: 'auto',
                  padding: '4% 1% 10%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.38))',
                }}
                draggable={false}
              />
            </div>
          </div>
          <div>
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-sm)', color: 'var(--paper)', lineHeight: 1.1 }}
            >
              {cls.name}
            </div>
            <div
              className="t-body"
              style={{
                fontSize: 'var(--body-md)',
                lineHeight: 1.28,
                color: 'var(--muted-light)',
                marginTop: 6,
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
            <div
              key={label}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr 24px',
                alignItems: 'center',
                gap: 6,
                padding: '6px 7px',
                borderRadius: 9,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.075)',
              }}
            >
              <span
                className="t-display"
                style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)' }}
              >
                {label}
              </span>
              <div
                style={{
                  height: 8,
                  background: 'rgba(178, 192, 211, 0.12)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(val / 20) * 100}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 999,
                    maxWidth: '100%',
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              </div>
              <span
                className="t-display"
                style={{
                  fontSize: 'var(--display-2xs)',
                  color: 'var(--muted-light)',
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
            gap: 10,
            marginTop: 2,
            padding: '8px 10px',
            background:
              'linear-gradient(180deg, rgba(255,216,161,.14), rgba(255,216,161,.03) 34%), linear-gradient(180deg, rgba(39,29,20,.92), rgba(11,14,23,.96))',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,211,77,.46)',
            boxShadow: 'inset 0 1px 0 rgba(255,240,214,.12)',
          }}
        >
          <IconChip glyph={getIconGlyph(cls.perk.icon, cls.perk.name)} tone="gold" size="sm" />
          <div>
            <div
              className="t-display"
              style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold-bright)' }}
            >
              {cls.perk.name}
            </div>
            <div
              className="t-body"
              style={{
                fontSize: 'var(--body-sm)',
                lineHeight: 1.2,
                color: 'color-mix(in srgb, var(--paper) 78%, var(--gold-bright) 22%)',
                marginTop: 2,
              }}
            >
              {cls.perk.desc}
            </div>
          </div>
        </div>

        <div
          className="t-display"
          style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)', marginTop: 2 }}
        >
          MOVES:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {cls.moves.map((m) => (
            <div
              key={m.name}
              style={{
                padding: '7px 8px',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,.06), rgba(17,23,34,.82) 28%, rgba(12,15,25,.92))',
                borderRadius: 8,
                border: '1px solid rgba(132,153,189,.26)',
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
                  style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)' }}
                >
                  {m.name}
                </span>
                <TypeBadge type={m.type} />
              </div>
              <span
                className="t-body"
                style={{
                  fontSize: 'var(--body-sm)',
                  lineHeight: 1.2,
                  color: 'color-mix(in srgb, var(--muted-light) 88%, var(--paper) 12%)',
                }}
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
        style={{ alignSelf: 'center', minWidth: 220 }}
      >
        ACCEPT OFFER
      </Button>
    </div>
  )
}
