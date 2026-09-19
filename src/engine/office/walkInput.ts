import { MOVE_MS, type Facing } from '@/content/office'

/** WASD + arrows. Shared so keydown hold and keyup release stay in lockstep. */
const KEY_DIR: Record<string, Facing> = {
  ArrowUp: 'n',
  w: 'n',
  W: 'n',
  ArrowDown: 's',
  s: 's',
  S: 's',
  ArrowLeft: 'w',
  a: 'w',
  A: 'w',
  ArrowRight: 'e',
  d: 'e',
  D: 'e',
}

export function facingFromKey(key: string): Facing | null {
  return KEY_DIR[key] ?? null
}

/**
 * One tile per MOVE_MS. Used by keyboard, D-pad hold, and the rAF clock so
 * a new step never starts while the actor/camera tween is still running.
 */
export function canAcceptMove(
  now: number,
  lastAt: number | null,
  moveMs: number = MOVE_MS,
): boolean {
  if (lastAt === null) return true
  return now - lastAt >= moveMs
}
