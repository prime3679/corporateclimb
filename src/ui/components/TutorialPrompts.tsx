import { useState, useEffect } from 'react'

interface Prompt {
  id: string
  text: string
  dismissAfter?: string // action name the player must perform
}

const PROMPTS: Prompt[] = [
  { id: 'move', text: 'A/D or ←/→ to move' },
  { id: 'jump', text: 'SPACE to jump (hold for higher)' },
  { id: 'dodge', text: 'SHIFT to dodge (invulnerable!)' },
  { id: 'interact', text: 'E to talk to NPCs' },
]

const DISPLAY_DURATION = 4000

export function TutorialPrompts() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (currentIndex >= PROMPTS.length) {
      setVisible(false)
      return
    }

    setOpacity(1)
    const fadeTimer = setTimeout(() => setOpacity(0), DISPLAY_DURATION - 500)
    const advanceTimer = setTimeout(() => {
      setCurrentIndex((i) => i + 1)
    }, DISPLAY_DURATION)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(advanceTimer)
    }
  }, [currentIndex])

  if (!visible || currentIndex >= PROMPTS.length) return null

  const prompt = PROMPTS[currentIndex]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          padding: '12px 24px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        {prompt.text}
      </div>
    </div>
  )
}
