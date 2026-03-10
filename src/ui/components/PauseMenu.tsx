import { useState, useCallback } from 'react'
import { useGameState } from '../stores/gameState'
import { audioManager } from '../../game/systems/AudioManager'

interface PauseMenuProps {
  onResume: () => void
  onRestart: () => void
  onQuit: () => void
}

export function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(audioManager.getSettings())

  const handleVolumeChange = useCallback((key: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: number) => {
    switch (key) {
      case 'masterVolume': audioManager.setMasterVolume(value); break
      case 'musicVolume': audioManager.setMusicVolume(value); break
      case 'sfxVolume': audioManager.setSfxVolume(value); break
    }
    setSettings(audioManager.getSettings())
  }, [])

  const handleMute = useCallback(() => {
    audioManager.toggleMute()
    setSettings(audioManager.getSettings())
  }, [])

  const buttonStyle: React.CSSProperties = {
    width: '80%',
    maxWidth: '220px',
    padding: '12px 24px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#F1F5F9',
    fontSize: '16px',
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: '10px',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        pointerEvents: 'auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#F1F5F9', marginBottom: '30px' }}>
        PAUSED
      </div>

      {!showSettings ? (
        <>
          <button style={buttonStyle} onClick={onResume}>Resume</button>
          <button style={buttonStyle} onClick={onRestart}>Restart Level</button>
          <button style={buttonStyle} onClick={() => setShowSettings(true)}>Settings</button>
          <button style={{ ...buttonStyle, borderColor: '#EF4444', color: '#EF4444' }} onClick={onQuit}>
            Quit to Menu
          </button>
        </>
      ) : (
        <div style={{ width: '80%', maxWidth: '280px' }}>
          <div style={{ marginBottom: '20px' }}>
            {(['masterVolume', 'musicVolume', 'sfxVolume'] as const).map((key) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '13px' }}>
                    {key === 'masterVolume' ? 'Master' : key === 'musicVolume' ? 'Music' : 'SFX'}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '12px' }}>
                    {Math.round(settings[key] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings[key]}
                  onChange={(e) => handleVolumeChange(key, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#4F46E5' }}
                />
              </div>
            ))}
          </div>

          <button
            style={{ ...buttonStyle, width: '100%' }}
            onClick={handleMute}
          >
            {settings.muted ? 'Unmute' : 'Mute All'}
          </button>
          <button
            style={{ ...buttonStyle, width: '100%' }}
            onClick={() => setShowSettings(false)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}
