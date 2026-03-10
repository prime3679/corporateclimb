import { create } from 'zustand'

interface PlayerState {
  x: number
  y: number
  velocityX: number
  velocityY: number
  animState: string
  facingRight: boolean
  isOnGround: boolean
  syncFromPhaser: (state: Partial<PlayerState>) => void
}

export const usePlayerState = create<PlayerState>((set) => ({
  x: 0,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  animState: 'idle',
  facingRight: true,
  isOnGround: false,
  syncFromPhaser: (state) => set(state),
}))
