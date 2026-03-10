import { create } from 'zustand'

interface GameState {
  currentScene: string
  isPlaying: boolean
  isPaused: boolean
  setCurrentScene: (scene: string) => void
  setPlaying: (playing: boolean) => void
  setPaused: (paused: boolean) => void
}

export const useGameState = create<GameState>((set) => ({
  currentScene: 'Boot',
  isPlaying: false,
  isPaused: false,
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
}))
