// ─── SERIALIZABLE RNG ────────────────────────────────────────
// One RNG abstraction for the whole engine. Normal runs draw from
// Math.random; daily runs use mulberry32 whose state lives in the
// RunState so it can be serialized and resumed — the old design kept
// the seeded rng in a React ref that had to be manually kept in sync
// with a dailyMode flag.

export type Rng = () => number

/**
 * One mulberry32 step. Same algorithm as daily.ts's createSeededRandom,
 * but expressed over explicit state so it can round-trip through JSON.
 * Returns [value in [0,1), next state].
 */
export function mulberry32Step(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s]
}

/**
 * Stateful rng handle. `state === null` means unseeded (Math.random).
 * Use `.next` as the Rng function; call `.serialize()` afterwards to
 * write the advanced state back into the run.
 */
export class GameRng {
  private state: number | null

  constructor(state: number | null) {
    this.state = state === null ? null : state | 0
  }

  next: Rng = () => {
    if (this.state === null) return Math.random()
    const [value, nextState] = mulberry32Step(this.state)
    this.state = nextState
    return value
  }

  serialize(): number | null {
    return this.state
  }
}
