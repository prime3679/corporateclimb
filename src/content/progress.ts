import type { AchievementDef, AchievementId, PerkId, SaveData } from '../types'
import { PLAYER_CLASSES } from './classes'
import { ENEMY_POOLS } from './enemies'
import { groupPerks, PERKS } from './perks'

// ─── NEW GAME+ ───────────────────────────────────────────────
const NG_PLUS_KEY = 'corporate-climb-ng-best'

export function getBestNgPlus(): number {
  try {
    return parseInt(localStorage.getItem(NG_PLUS_KEY) || '0', 10) || 0
  } catch {
    return 0
  }
}

export function saveBestNgPlus(level: number) {
  try {
    const current = getBestNgPlus()
    if (level > current) localStorage.setItem(NG_PLUS_KEY, String(level))
  } catch {
    /* storage unavailable */
  }
}

// ─── ACHIEVEMENTS ────────────────────────────────────────────
const ACHIEVEMENT_KEY = 'corporate-climb-achievements'

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_climb',
    name: 'First Day',
    desc: 'Beat the game for the first time',
    icon: '\u{1F3C6}',
  },
  {
    id: 'triple_threat',
    name: 'Triple Threat',
    desc: 'Beat the game with all 3 classes',
    icon: '\u{1F451}',
  },
  { id: 'speed_runner', name: 'Speed Runner', desc: 'Win in under 50 turns', icon: '\u26A1' },
  { id: 'iron_will', name: 'Iron Will', desc: 'Win without using any items', icon: '\u{1F9CA}' },
  { id: 'glass_cannon', name: 'Glass Cannon', desc: 'Win with less than 15 HP', icon: '\u{1F4A2}' },
  { id: 'ng_plus_1', name: 'Promoted', desc: 'Beat NG+1', icon: '\u{1F4C8}' },
  { id: 'ng_plus_3', name: 'C-Suite Material', desc: 'Beat NG+3 or higher', icon: '\u{1F48E}' },
  {
    id: 'damage_dealer',
    name: 'Damage Dealer',
    desc: 'Deal 3000+ total damage in a run',
    icon: '\u{1F525}',
  },
  {
    id: 'hyperfocused',
    name: 'Hyperfocused',
    desc: 'Win with 3+ copies of the same perk',
    icon: '🎯',
  },
  {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    desc: 'Win with 250+ unspent Stock Options',
    icon: '🏦',
  },
  {
    id: 'full_stack',
    name: 'Full Stack Climber',
    desc: 'Win with a stat, a passive, and an economy perk',
    icon: '🧰',
  },
]

export function getUnlockedAchievements(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY)
    return raw ? new Set(JSON.parse(raw) as AchievementId[]) : new Set()
  } catch {
    return new Set()
  }
}

export function unlockAchievement(id: AchievementId): boolean {
  const current = getUnlockedAchievements()
  if (current.has(id)) return false
  current.add(id)
  try {
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify([...current]))
  } catch {
    /* storage unavailable */
  }
  return true // newly unlocked
}

export function getClassWins(): Set<string> {
  try {
    const raw = localStorage.getItem('corporate-climb-class-wins')
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function recordClassWin(classId: string) {
  const wins = getClassWins()
  wins.add(classId)
  try {
    localStorage.setItem('corporate-climb-class-wins', JSON.stringify([...wins]))
  } catch {
    /* storage unavailable */
  }
}

/** Check and unlock all applicable achievements after a win */
export function checkAchievements(stats: {
  classId: string
  totalTurns: number
  totalDamageDealt: number
  ngLevel: number
  itemsUsed: number
  finalHp: number
  perks?: PerkId[]
  stockOptions?: number
}): AchievementId[] {
  const newlyUnlocked: AchievementId[] = []
  const perks = stats.perks ?? []

  if (unlockAchievement('first_climb')) newlyUnlocked.push('first_climb')

  recordClassWin(stats.classId)
  if (getClassWins().size >= 3) {
    if (unlockAchievement('triple_threat')) newlyUnlocked.push('triple_threat')
  }

  if (stats.totalTurns <= 50) {
    if (unlockAchievement('speed_runner')) newlyUnlocked.push('speed_runner')
  }

  if (stats.itemsUsed === 0) {
    if (unlockAchievement('iron_will')) newlyUnlocked.push('iron_will')
  }

  if (stats.finalHp < 15) {
    if (unlockAchievement('glass_cannon')) newlyUnlocked.push('glass_cannon')
  }

  if (stats.ngLevel >= 1) {
    if (unlockAchievement('ng_plus_1')) newlyUnlocked.push('ng_plus_1')
  }

  if (stats.ngLevel >= 3) {
    if (unlockAchievement('ng_plus_3')) newlyUnlocked.push('ng_plus_3')
  }

  if (stats.totalDamageDealt >= 3000) {
    if (unlockAchievement('damage_dealer')) newlyUnlocked.push('damage_dealer')
  }

  if (groupPerks(perks).some((g) => g.count >= 3)) {
    if (unlockAchievement('hyperfocused')) newlyUnlocked.push('hyperfocused')
  }

  if ((stats.stockOptions ?? 0) >= 250) {
    if (unlockAchievement('diamond_hands')) newlyUnlocked.push('diamond_hands')
  }

  const kinds = new Set(perks.map((id) => PERKS[id]?.kind).filter(Boolean))
  if (kinds.size >= 3) {
    if (unlockAchievement('full_stack')) newlyUnlocked.push('full_stack')
  }

  return newlyUnlocked
}
