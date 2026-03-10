import { LevelConfig } from './types'

const GROUND_Y = 680
const GROUND_H = 40

// Placeholder — fully built in Session 10
export const level6a: LevelConfig = {
  id: 'level6a',
  name: 'Corner Office',
  width: 8000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 8000, top: 0, bottom: 720 },
  backgrounds: [
    { color: 0x0F172A, scrollFactor: 0.1, rects: [] },
  ],
  platforms: [
    { x: 4000, y: GROUND_Y, width: 8000, height: GROUND_H, type: 'solid', color: 0x1E293B },
  ],
}
