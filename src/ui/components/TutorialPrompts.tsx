import { useState, useEffect } from 'react'

interface Prompt {
  id: string
  desktop: string
  mobile: string
}

const isMobile = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768

const PROMPTS: Prompt[] = [
  { id: 'move', desktop: 'A/D or \u2190/\u2192 to move', mobile: 'Use \u25C0 \u25B6 to move' },
  { id: 'jump', desktop: 'SPACE to jump (hold for higher)', mobile: 'Tap JUMP to leap' },
  { id: 'dodge', desktop: 'SHIFT to dodge (invulnerable!)', mobile: 'Tap ROLL to dodge' },
  { id: 'interact', desktop: 'E to talk to NPCs', mobile: 'Tap TALK near NPCs' },
]

const DISPLAY_DURATION = 4000

export function TutorialPrompts() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    setMobile(isMobile())
  }, [])

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
        bottom: mobile ? 140 : 120,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: mobile ? '15px' : '18px',
          padding: '10px 20px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        {mobile ? prompt.mobile : prompt.desktop}
      </div>
    </div>
  )
}
