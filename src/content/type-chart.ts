import type { MoveType } from '../types'

// ─── TYPE SYSTEM ─────────────────────────────────────────────
export const TYPE_COLORS: Record<MoveType, string> = {
  strategy: '#E53935',
  influence: '#7B1FA2',
  execution: '#FF6F00',
  analytics: '#1565C0',
  technical: '#2E7D32',
  normal: '#616161',
}

export const TYPE_LABELS: Record<MoveType, string> = {
  strategy: 'STRAT',
  influence: 'INFL',
  execution: 'EXEC',
  analytics: 'DATA',
  technical: 'TECH',
  normal: 'NORM',
}

// Type effectiveness: attacker type → set of types it's super effective against
export const TYPE_STRONG: Partial<Record<MoveType, Set<MoveType>>> = {
  strategy: new Set(['execution', 'influence']),
  execution: new Set(['technical', 'analytics']),
  technical: new Set(['strategy', 'influence']),
  analytics: new Set(['strategy', 'execution']),
  influence: new Set(['execution', 'analytics']),
}

export function getTypeMultiplier(
  atkType: MoveType,
  defTypes: MoveType[],
): { mult: number; label: string | null } {
  const strong = TYPE_STRONG[atkType]
  if (atkType === 'normal' || !strong) return { mult: 1, label: null }
  const superEffective = defTypes.some((t) => strong.has(t))
  const notEffective = defTypes.some((t) => TYPE_STRONG[t]?.has(atkType))
  if (superEffective && !notEffective) return { mult: 1.5, label: 'Super effective!' }
  if (notEffective && !superEffective) return { mult: 0.67, label: 'Not very effective...' }
  return { mult: 1, label: null }
}
