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
import { TouchControls } from './ui/components/TouchControls'
import { PauseMenu } from './ui/components/PauseMenu'
import { MainMenu } from './ui/components/MainMenu'
import { useGameState } from './ui/stores/gameState'
import { usePlayerStats } from './ui/stores/playerStats'
import { useChoiceHistory } from './ui/stores/choiceHistory'

type AppPhase = 'menu' | 'character' | 'playing'

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<AppPhase>('menu')
  const [paused, setPaused] = useState(false)
  const { setPlaying, currentScene, whisperActive, montageActive, bossMirrorRef } = useGameState()

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

  // Pause on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'playing') {
        setPaused((p) => {
          const next = !p
          const game = gameRef.current
          if (game) {
            const scene = game.scene.getScene('Game')
            if (scene) {
              next ? scene.scene.pause() : scene.scene.resume()
            }
          }
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase])

  const handleNewGame = useCallback(() => {
    setPhase('character')
  }, [])

  const handleContinue = useCallback((_save: any) => {
    // Load save data into stores, then start game
    setPhase('character')
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
    useGameState.getState().setCurrentScene('Game')
    setPhase('menu')
    setPlaying(false)
    const game = gameRef.current
    if (game) {
      game.scene.stop('Game')
    }
  }, [setPlaying])

  const handleResume = useCallback(() => {
    setPaused(false)
    const game = gameRef.current
    if (game) {
      const scene = game.scene.getScene('Game')
      if (scene) scene.scene.resume()
    }
  }, [])

  const handleRestart = useCallback(() => {
    setPaused(false)
    const game = gameRef.current
    if (game) {
      game.scene.stop('Game')
      game.scene.start('Game')
    }
  }, [])

  const handleQuit = useCallback(() => {
    setPaused(false)
    setPlaying(false)
    setPhase('menu')
    const game = gameRef.current
    if (game) {
      game.scene.stop('Game')
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
        {phase === 'menu' && <MainMenu onNewGame={handleNewGame} onContinue={handleContinue} />}
        {phase === 'character' && <CharacterCreator onStart={handleStartGame} />}
        {phase === 'playing' && !showLevelComplete && !showEnding && !paused && <HUD />}
        {phase === 'playing' && !showLevelComplete && !showEnding && !paused && <TutorialPrompts />}
        {phase === 'playing' && !paused && <TouchControls />}
        {showLevelComplete && (
          <LevelComplete levelName="Freshman Year" onContinue={handleLevelContinue} />
        )}
        {phase === 'playing' && <WhisperOverlay active={whisperActive} />}
        <MontageOverlay
          active={montageActive}
          onComplete={() => bossMirrorRef?.onMontageComplete()}
        />
        {showEnding && <EndingScreen onPlayAgain={handlePlayAgain} />}
        {paused && phase === 'playing' && (
          <PauseMenu onResume={handleResume} onRestart={handleRestart} onQuit={handleQuit} />
        )}
        <DialogueBox />
      </div>
    </div>
  )
}
