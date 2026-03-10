import { useRef, useCallback, useEffect, useState } from 'react'
import { inputManager } from '../../game/systems/InputManager'

const JOYSTICK_SIZE = 120
const JOYSTICK_DEAD_ZONE = 15
const BUTTON_SIZE_LARGE = 80
const BUTTON_SIZE_MEDIUM = 60
const BUTTON_SIZE_SMALL = 50

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function TouchControls() {
  const [visible, setVisible] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const [joystickOrigin, setJoystickOrigin] = useState<{ x: number; y: number } | null>(null)
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setVisible(isTouchDevice())
  }, [])

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setJoystickOrigin({ x: touch.clientX, y: touch.clientY })
    setJoystickPos({ x: 0, y: 0 })
  }, [])

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (!joystickOrigin) return
    const touch = e.touches[0]
    const dx = touch.clientX - joystickOrigin.x
    const dy = touch.clientY - joystickOrigin.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = JOYSTICK_SIZE / 2

    const clampedDist = Math.min(dist, maxDist)
    const angle = Math.atan2(dy, dx)
    const cx = Math.cos(angle) * clampedDist
    const cy = Math.sin(angle) * clampedDist

    setJoystickPos({ x: cx, y: cy })

    // Normalize to -1..1, apply dead zone
    const nx = dist < JOYSTICK_DEAD_ZONE ? 0 : cx / maxDist
    const ny = dist < JOYSTICK_DEAD_ZONE ? 0 : cy / maxDist
    inputManager.setJoystick(nx, ny)
  }, [joystickOrigin])

  const handleJoystickEnd = useCallback(() => {
    setJoystickOrigin(null)
    setJoystickPos({ x: 0, y: 0 })
    inputManager.setJoystick(0, 0)
  }, [])

  const handleButtonDown = useCallback((button: 'jump' | 'dodge' | 'interact') => {
    inputManager.setTouchButton(button, true)
  }, [])

  const handleButtonUp = useCallback((button: 'jump' | 'dodge' | 'interact') => {
    inputManager.setTouchButton(button, false)
  }, [])

  if (!visible) return null

  const buttonStyle = (size: number, bottom: number, right: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: `${bottom}px`,
    right: `${right}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.25}px`,
    fontFamily: 'system-ui',
    color: 'rgba(255, 255, 255, 0.6)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    pointerEvents: 'auto',
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Virtual Joystick — left side */}
      <div
        ref={joystickRef}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '30px',
          width: `${JOYSTICK_SIZE}px`,
          height: `${JOYSTICK_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          touchAction: 'none',
          pointerEvents: 'auto',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Thumb indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${JOYSTICK_SIZE / 2 + joystickPos.x - 18}px`,
            top: `${JOYSTICK_SIZE / 2 + joystickPos.y - 18}px`,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            transition: joystickOrigin ? 'none' : 'all 0.15s ease',
          }}
        />
      </div>

      {/* Jump — large, bottom right */}
      <div
        style={buttonStyle(BUTTON_SIZE_LARGE, 40, 30)}
        onTouchStart={(e) => { e.preventDefault(); handleButtonDown('jump') }}
        onTouchEnd={() => handleButtonUp('jump')}
        onTouchCancel={() => handleButtonUp('jump')}
      >
        JUMP
      </div>

      {/* Dodge — above jump */}
      <div
        style={buttonStyle(BUTTON_SIZE_MEDIUM, 140, 40)}
        onTouchStart={(e) => { e.preventDefault(); handleButtonDown('dodge') }}
        onTouchEnd={() => handleButtonUp('dodge')}
        onTouchCancel={() => handleButtonUp('dodge')}
      >
        DODGE
      </div>

      {/* Interact — top right area */}
      <div
        style={buttonStyle(BUTTON_SIZE_SMALL, 220, 50)}
        onTouchStart={(e) => { e.preventDefault(); handleButtonDown('interact') }}
        onTouchEnd={() => handleButtonUp('interact')}
        onTouchCancel={() => handleButtonUp('interact')}
      >
        E
      </div>
    </div>
  )
}
