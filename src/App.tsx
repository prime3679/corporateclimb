import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { gameConfig } from './game/config/gameConfig'
import { DialogueBox } from './ui/components/DialogueBox'
import { HUD } from './ui/components/HUD'
import { CharacterCreator } from './ui/components/CharacterCreator'
import { TutorialPrompts } from './ui/components/TutorialPrompts'
import { LevelComplete } from './ui/components/LevelComplete'
import { WhisperOverlay } from './ui/components/WhisperOverlay'
import { MontageOverlay } from './ui/components/MontageOverlay'
import { EndingScreen } from './ui/components/EndingScreen'
import { useGameState } from './ui/stores/gameState'
import { usePlayerStats } from './ui/stores/playerStats'
import { useChoiceHistory } from './ui/stores/choiceHistory'

type AppPhase = 'boot' | 'character' | 'playing'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<AppPhase>('boot')
  const { setPlaying, currentScene, whisperActive, montageActive, bossMirrorRef } = useGameState()

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

  const handleLevelContinue = useCallback(() => {
    // For now, return to boot. Future: advance to next level
    useGameState.getState().setCurrentScene('Game')
    setPhase('boot')
    setPlaying(false)
    const game = gameRef.current
    if (game) {
      game.scene.stop('Game')
      game.scene.start('Boot')
    }
  }, [setPlaying])

  const showLevelComplete = phase === 'playing' && currentScene === 'level_complete'
  const showEnding = phase === 'playing' && currentScene === 'ending'

  const handlePlayAgain = useCallback(() => {
    usePlayerStats.getState().resetStats()
    useChoiceHistory.getState().clearHistory()
    useGameState.getState().setCurrentScene('Boot')
    delete (window as any).__corporateClimbEnding
    setPhase('character')
    setPlaying(false)
    const game = gameRef.current
    if (game) {
      game.scene.stop('Game')
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
        {phase === 'playing' && !showLevelComplete && <HUD />}
        {phase === 'playing' && !showLevelComplete && <TutorialPrompts />}
        {showLevelComplete && (
          <LevelComplete levelName="Freshman Year" onContinue={handleLevelContinue} />
        )}
        {phase === 'playing' && <WhisperOverlay active={whisperActive} />}
        <MontageOverlay
          active={montageActive}
          onComplete={() => bossMirrorRef?.onMontageComplete()}
        />
        {showEnding && <EndingScreen onPlayAgain={handlePlayAgain} />}
        <DialogueBox />
      </div>
    </div>
  )
}
