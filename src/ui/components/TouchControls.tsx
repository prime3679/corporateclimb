import { useCallback, useEffect, useState } from 'react'
import { inputManager } from '../../game/systems/InputManager'
import { useDialogueState } from '../stores/dialogueState'

/**
 * Mobile game controls — D-pad (left/right) + action buttons.
 * Designed for platformers: big, clear, always reachable with thumbs.
 * Shows only on touch-capable devices.
 */

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function TouchControls() {
  const [visible, setVisible] = useState(false)
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set())
  const { isOpen: dialogueOpen } = useDialogueState()

  useEffect(() => {
    // Show on touch devices OR narrow screens (likely mobile)
    setVisible(isTouchDevice() || window.innerWidth < 768)
  }, [])

  const press = useCallback((id: string) => {
    setActiveButtons(prev => new Set(prev).add(id))
    if (id === 'left') inputManager.setJoystick(-1, 0)
    else if (id === 'right') inputManager.setJoystick(1, 0)
    else if (id === 'jump') inputManager.setTouchButton('jump', true)
    else if (id === 'dodge') inputManager.setTouchButton('dodge', true)
    else if (id === 'interact') inputManager.setTouchButton('interact', true)
  }, [])

  const release = useCallback((id: string) => {
    setActiveButtons(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (id === 'left' || id === 'right') inputManager.setJoystick(0, 0)
    else if (id === 'jump') inputManager.setTouchButton('jump', false)
    else if (id === 'dodge') inputManager.setTouchButton('dodge', false)
    else if (id === 'interact') inputManager.setTouchButton('interact', false)
  }, [])

  if (!visible || dialogueOpen) return null

  const isActive = (id: string) => activeButtons.has(id)

  // Shared button base
  const btn = (
    id: string,
    style: React.CSSProperties,
    children: React.ReactNode,
  ) => (
    <div
      style={{
        ...style,
        opacity: isActive(id) ? 1 : 0.7,
        transform: isActive(id) ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.05s, opacity 0.05s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onTouchStart={(e) => { e.preventDefault(); press(id) }}
      onTouchEnd={(e) => { e.preventDefault(); release(id) }}
      onTouchCancel={() => release(id)}
    >
      {children}
    </div>
  )

  const DPAD_BTN = 64   // D-pad button size
  const ACTION_BTN = 72  // Action button size
  const SMALL_BTN = 52   // Smaller action button

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* ── D-Pad: left side ── */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '16px',
        display: 'flex',
        gap: '8px',
      }}>
        {btn('left', {
          width: `${DPAD_BTN}px`,
          height: `${DPAD_BTN}px`,
          borderRadius: '14px',
          backgroundColor: 'rgba(30, 30, 50, 0.75)',
          border: '2px solid rgba(255,255,255,0.35)',
          fontSize: '28px',
          color: '#fff',
        }, '\u25C0')}

        {btn('right', {
          width: `${DPAD_BTN}px`,
          height: `${DPAD_BTN}px`,
          borderRadius: '14px',
          backgroundColor: 'rgba(30, 30, 50, 0.75)',
          border: '2px solid rgba(255,255,255,0.35)',
          fontSize: '28px',
          color: '#fff',
        }, '\u25B6')}
      </div>

      {/* ── Action buttons: right side ── */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Top row: dodge + interact */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {btn('dodge', {
            width: `${SMALL_BTN}px`,
            height: `${SMALL_BTN}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(234, 179, 8, 0.8)',
            border: '2px solid rgba(255,255,255,0.4)',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'system-ui',
            color: '#fff',
            letterSpacing: '0.5px',
          }, 'ROLL')}

          {btn('interact', {
            width: `${SMALL_BTN}px`,
            height: `${SMALL_BTN}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            border: '2px solid rgba(255,255,255,0.4)',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'system-ui',
            color: '#fff',
            letterSpacing: '0.5px',
          }, 'TALK')}
        </div>

        {/* Bottom: big jump button */}
        {btn('jump', {
          width: `${ACTION_BTN}px`,
          height: `${ACTION_BTN}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(79, 70, 229, 0.85)',
          border: '3px solid rgba(255,255,255,0.5)',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          color: '#fff',
          letterSpacing: '1px',
        }, 'JUMP')}
      </div>
    </div>
  )
}
