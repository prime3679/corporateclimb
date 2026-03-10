import { useState, useCallback } from 'react'
import { audioManager } from '../../game/systems/AudioManager'

interface SaveData {
  currentLevel: string
  stats: { energy: number; reputation: number; network: number; cash: number }
  pathChoice: string | null
  timestamp: number
}

const SAVE_KEY = 'corporate_climb_save'

export function getSaveData(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeSaveData(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

export function clearSaveData() {
  localStorage.removeItem(SAVE_KEY)
}

interface MainMenuProps {
  onNewGame: () => void
  onContinue: (save: SaveData) => void
}

export function MainMenu({ onNewGame, onContinue }: MainMenuProps) {
  const [showCredits, setShowCredits] = useState(false)
  const save = getSaveData()

  const handleNewGame = useCallback(() => {
    clearSaveData()
    audioManager.init()
    onNewGame()
  }, [onNewGame])

  const handleContinue = useCallback(() => {
    if (save) {
      audioManager.init()
      onContinue(save)
    }
  }, [save, onContinue])

  const buttonStyle: React.CSSProperties = {
    width: '240px',
    padding: '14px 24px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#F1F5F9',
    fontSize: '16px',
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
  }

  if (showCredits) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          pointerEvents: 'auto',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: '28px', fontWeight: 600, color: '#F1F5F9', marginBottom: '24px' }}>
          Corporate Climb
        </div>
        <div style={{ fontSize: '16px', color: '#94A3B8', lineHeight: '2', textAlign: 'center' }}>
          Created by Adrian Lumley<br />
          adrianlumley.co<br /><br />
          Built with Claude Code<br />
          Phaser 3 + React + TypeScript + Zustand<br /><br />
          A Satirical Side-Scrolling RPG
        </div>
        <button
          style={{ ...buttonStyle, marginTop: '24px' }}
          onClick={() => setShowCredits(false)}
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: '52px',
        fontWeight: 800,
        color: '#F1F5F9',
        letterSpacing: '3px',
        marginBottom: '8px',
        textTransform: 'uppercase',
      }}>
        Corporate Climb
      </div>
      <div style={{
        fontSize: '16px',
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: '48px',
      }}>
        A Satirical Side-Scrolling RPG
      </div>

      {/* Buttons */}
      <button
        style={{ ...buttonStyle, backgroundColor: '#4F46E5', borderColor: '#4F46E5', fontWeight: 600 }}
        onClick={handleNewGame}
      >
        New Game
      </button>

      {save && (
        <button style={buttonStyle} onClick={handleContinue}>
          Continue — {save.currentLevel.replace('level', 'Level ')}
        </button>
      )}

      <button style={buttonStyle} onClick={() => setShowCredits(true)}>
        Credits
      </button>
    </div>
  )
}
