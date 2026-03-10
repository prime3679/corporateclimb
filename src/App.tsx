import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { gameConfig } from './game/config/gameConfig'
import { DialogueBox } from './ui/components/DialogueBox'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return

    gameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: containerRef.current,
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* React overlay layer */}
      <div
        id="ui-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <DialogueBox />
      </div>
    </div>
  )
}
