import { SFX } from '@/sfx'
import { Haptics } from '@/platform'
import type { Settings, TextSpeed } from '@/settings'
import Button from '@/ui/Button'
import styles from './SettingsPanel.module.css'

const SPEEDS: TextSpeed[] = ['slow', 'normal', 'fast', 'instant']

export default function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings
  onChange: (next: Settings) => void
  onClose: () => void
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.title}>SETTINGS</div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="settings-music">
            <span>MUSIC</span>
            <span>{Math.round(settings.musicVolume * 100)}%</span>
          </label>
          <input
            id="settings-music"
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.musicVolume * 100)}
            onChange={(e) => onChange({ ...settings, musicVolume: Number(e.target.value) / 100 })}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="settings-sfx">
            <span>SOUND FX</span>
            <span>{Math.round(settings.sfxVolume * 100)}%</span>
          </label>
          <input
            id="settings-sfx"
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.sfxVolume * 100)}
            onChange={(e) => onChange({ ...settings, sfxVolume: Number(e.target.value) / 100 })}
            // A test blip so the new level is audible immediately.
            onMouseUp={() => SFX.menuSelect()}
            onTouchEnd={() => SFX.menuSelect()}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.label}>TEXT SPEED</span>
          <div className={styles.speedRow} role="group" aria-label="Text speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={`${styles.speedBtn} ${settings.textSpeed === s ? styles.speedBtnActive : ''}`}
                aria-pressed={settings.textSpeed === s}
                onClick={() => onChange({ ...settings, textSpeed: s })}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onChange({ ...settings, reduceMotion: e.target.checked })}
          />
          Reduce motion (skip shakes &amp; flourishes)
        </label>

        {Haptics.supported && (
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={settings.haptics}
              onChange={(e) => {
                onChange({ ...settings, haptics: e.target.checked })
                // Apply eagerly (the settings effect re-applies) so the
                // demo buzz below isn't gated by the stale state.
                Haptics.setEnabled(e.target.checked)
                if (e.target.checked) Haptics.impact('medium')
              }}
            />
            Vibration (combat hits &amp; taps)
          </label>
        )}

        <Button variant="primary" size="md" onClick={onClose}>
          DONE
        </Button>
      </div>
    </div>
  )
}
