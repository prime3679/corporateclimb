import { useCharacterStore, SKIN_TONES, ACCENT_COLORS, Presentation, Hairstyle, Accessory } from '../stores/characterStore'

const PRESENTATIONS: { value: Presentation; label: string }[] = [
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'androgynous', label: 'Androgynous' },
]

const HAIRSTYLES: Hairstyle[] = ['locs', 'braids', 'afro', 'buzz', 'long', 'curly', 'straight', 'bald', 'mohawk', 'bob']

const ACCESSORIES: { value: Accessory; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'headphones', label: 'Headphones' },
  { value: 'cap', label: 'Cap' },
]

export function CharacterCreator({ onStart }: { onStart: () => void }) {
  const store = useCharacterStore()

  const sectionStyle: React.CSSProperties = { marginBottom: 24 }
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
  }

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: selected ? '2px solid #4F46E5' : '1px solid rgba(255,255,255,0.15)',
    background: selected ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
    color: selected ? '#C7D2FE' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
    transition: 'all 0.15s',
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1B2A4A',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        pointerEvents: 'auto',
        zIndex: 100,
      }}
    >
      <div style={{ maxWidth: 600, width: '100%', padding: '24px 16px', margin: '0 auto', boxSizing: 'border-box' as const }}>
        <h1
          style={{
            fontSize: 32,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 800,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Create Your Character
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            marginBottom: 36,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Who are you bringing to the climb?
        </p>

        {/* Presentation */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Presentation</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRESENTATIONS.map((p) => (
              <button key={p.value} onClick={() => store.setPresentation(p.value)} style={chipStyle(store.presentation === p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skin Tone */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Skin Tone</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SKIN_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => store.setSkinTone(tone)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: tone,
                  border: store.skinTone === tone ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Hairstyle */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Hairstyle</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {HAIRSTYLES.map((h) => (
              <button key={h} onClick={() => store.setHairstyle(h)} style={chipStyle(store.hairstyle === h)}>
                {h.charAt(0).toUpperCase() + h.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Accent Color</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => store.setAccentColor(color)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: color,
                  border: store.accentColor === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Accessory */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Accessory</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ACCESSORIES.map((a) => (
              <button key={a.value} onClick={() => store.setAccessory(a.value)} style={chipStyle(store.accessory === a.value)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 80,
              height: 110,
              borderRadius: 12,
              background: `linear-gradient(180deg, ${store.accentColor} 0%, ${store.skinTone} 40%)`,
              border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: 8,
            }}
          >
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
              {store.hairstyle}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
              {store.accessory !== 'none' ? store.accessory : ''}
            </span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => {
            store.finishCreation()
            onStart()
          }}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 10,
            background: '#4F46E5',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4338CA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4F46E5')}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}
