import { useGameProgress, PathChoice } from '../../ui/stores/gameProgress'
import { LevelConfig } from '../config/levels/types'
import { level1 } from '../config/levels/level1'
import { level2 } from '../config/levels/level2'
import { level3 } from '../config/levels/level3'
import { level4 } from '../config/levels/level4'
import { level5 } from '../config/levels/level5'
import { level6a } from '../config/levels/level6a'
import { level6b } from '../config/levels/level6b'
import { level6c } from '../config/levels/level6c'

const LEVEL_MAP: Record<string, LevelConfig> = {
  level1,
  level2,
  level3,
  level4,
  level5,
  level6a,
  level6b,
  level6c,
}

const LEVEL_ORDER = ['level1', 'level2', 'level3', 'level4', 'level5']

export function getLevelConfig(levelId: string): LevelConfig {
  return LEVEL_MAP[levelId] ?? level1
}

export function getNextLevel(currentLevelId: string): string | null {
  const idx = LEVEL_ORDER.indexOf(currentLevelId)

  if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[idx + 1]
  }

  // After Level 5, route based on path choice
  if (currentLevelId === 'level5') {
    return getLevel6Variant()
  }

  // Level 6 variants are the end
  if (currentLevelId.startsWith('level6')) {
    return null
  }

  return null
}

function getLevel6Variant(): string {
  const choice = useGameProgress.getState().pathChoice
  const variantMap: Record<NonNullable<PathChoice>, string> = {
    corporate: 'level6a',
    pivot: 'level6b',
    hybrid: 'level6c',
  }
  return choice ? variantMap[choice] : 'level6a'
}
