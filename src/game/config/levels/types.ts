export interface PlatformConfig {
  x: number
  y: number
  width: number
  height: number
  type: 'solid' | 'one-way' | 'moving'
  // Moving platform properties
  moveX?: number // distance to move horizontally
  moveY?: number // distance to move vertically
  moveSpeed?: number // pixels per second
  color?: number
}

export interface BackgroundLayer {
  color: number
  scrollFactor: number
  rects: { x: number; y: number; width: number; height: number; color?: number }[]
}

export interface LevelConfig {
  id: string
  name: string
  width: number
  height: number
  spawn: { x: number; y: number }
  platforms: PlatformConfig[]
  backgrounds: BackgroundLayer[]
  bounds: { left: number; right: number; top: number; bottom: number }
}
