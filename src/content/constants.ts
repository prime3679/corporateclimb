// ─── CONSTANTS ──────────────────────────────────────────────
export const TOTAL_FLOORS = 30

export function getAct(floor: number): 1 | 2 | 3 {
  if (floor < 10) return 1
  if (floor < 20) return 2
  return 3
}
