import { useState, useEffect } from 'react'
import type { DamagePopup } from '../types'

export default function DamageNumber({ popup }: { popup: DamagePopup }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div
      className="t-display"
      style={{
        position: 'absolute',
        left: popup.x,
        top: popup.y,
        fontSize: popup.isCrit ? 16 : 12,
        color: popup.isHeal ? 'var(--green)' : popup.isCrit ? 'var(--gold-bright)' : '#F44336',
        textShadow: '2px 2px 0 #263238, -1px -1px 0 #263238',
        pointerEvents: 'none',
        zIndex: 20,
        animation: 'dmg-float 1s ease-out forwards',
      }}
    >
      {popup.isHeal ? '+' : '-'}
      {popup.value}
      {popup.isCrit && (
        <span
          style={{ fontSize: 'var(--display-2xs)', display: 'block', color: 'var(--amber-deep)' }}
        >
          CRIT!
        </span>
      )}
      {popup.label && (
        <span
          style={{
            fontSize: 'var(--display-2xs)',
            display: 'block',
            color: popup.labelColor || 'var(--gold-bright)',
            whiteSpace: 'nowrap',
          }}
        >
          {popup.label}
        </span>
      )}
    </div>
  )
}
