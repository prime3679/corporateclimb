import { create } from 'zustand'

interface GameState {
  currentScene: string
  isPlaying: boolean
  isPaused: boolean
  whisperActive: boolean
  setCurrentScene: (scene: string) => void
  setPlaying: (playing: boolean) => void
  setPaused: (paused: boolean) => void
  setWhisperActive: (active: boolean) => void
}

export const useGameState = create<GameState>((set) => ({
  currentScene: 'Boot',
  isPlaying: false,
  isPaused: false,
  whisperActive: false,
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setWhisperActive: (active) => set({ whisperActive: active }),
}))
