import { LevelConfig } from './types'

const GROUND_Y = 680
const GROUND_H = 40

// Placeholder — fully built in Session 10
export const level6b: LevelConfig = {
  id: 'level6b',
  name: 'The Pivot',
  width: 9000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 9000, top: 0, bottom: 720 },
  backgrounds: [
    { color: 0x1C1917, scrollFactor: 0.1, rects: [] },
  ],
  platforms: [
    { x: 4500, y: GROUND_Y, width: 9000, height: GROUND_H, type: 'solid', color: 0x44403C },
  ],
}
