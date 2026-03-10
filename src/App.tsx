import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { gameConfig } from './game/config/gameConfig'
import { DialogueBox } from './ui/components/DialogueBox'
import { HUD } from './ui/components/HUD'
import { CharacterCreator } from './ui/components/CharacterCreator'
import { useGameState } from './ui/stores/gameState'

type AppPhase = 'boot' | 'character' | 'playing'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<AppPhase>('boot')
  const { setPlaying } = useGameState()

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return

    gameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: containerRef.current,
    })

    // Listen for boot scene to finish, then show character creation
    gameRef.current.events.on('ready', () => {
      const bootScene = gameRef.current!.scene.getScene('Boot')
      if (bootScene) {
        bootScene.events.on('shutdown', () => {
          // Intercept: don't go to GameScene yet, show character creator
          gameRef.current!.scene.stop('Game')
          setPhase('character')
        })
      }
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  const handleStartGame = useCallback(() => {
    setPhase('playing')
    setPlaying(true)

    const game = gameRef.current
    if (game) {
      game.scene.start('Game')
    }
  }, [setPlaying])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

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
        {phase === 'character' && <CharacterCreator onStart={handleStartGame} />}
        {phase === 'playing' && <HUD />}
        <DialogueBox />
      </div>
    </div>
  )
}
