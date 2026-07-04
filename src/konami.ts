// ─── GOLDEN BADGE EASTER EGG ─────────────────────────────────
// The classic code, entered on the title screen (touch players can
// tap the floor sign instead), awards a permanent cosmetic Golden
// Badge. Purely presentational — it never touches run state, combat
// math, or seeded rolls, so no save migration and no balance impact.

export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

/** Taps on the FLOOR 30 sign that unlock the badge without a keyboard. */
export const SIGN_TAPS_REQUIRED = 7

const BADGE_KEY = 'corporate-climb-golden-badge'

// Letters match case-insensitively so caps lock can't spoil the moment;
// arrow keys pass through unchanged.
const normalize = (key: string) => (key.length === 1 ? key.toLowerCase() : key)

/**
 * Advance the sequence tracker by one keypress and return the new
 * progress (count of matched keys); the code is complete when progress
 * reaches KONAMI_SEQUENCE.length. On a mismatch, falls back to the
 * longest prefix of the sequence that still matches the recent keys —
 * so an over-eager ↑↑↑↓↓… run still completes, exactly like the
 * original implementation players' fingers remember.
 */
export function advanceKonami(progress: number, key: string): number {
  const k = normalize(key)
  if (progress >= KONAMI_SEQUENCE.length || progress < 0) progress = 0
  if (k === normalize(KONAMI_SEQUENCE[progress])) return progress + 1
  // The keys matched so far are, by construction, the sequence's own
  // first `progress` entries — so candidate restarts can be checked
  // against the sequence itself, longest first.
  for (let len = progress; len >= 1; len--) {
    if (normalize(KONAMI_SEQUENCE[len - 1]) !== k) continue
    let matches = true
    for (let i = 0; i < len - 1; i++) {
      if (KONAMI_SEQUENCE[i] !== KONAMI_SEQUENCE[progress - (len - 1) + i]) {
        matches = false
        break
      }
    }
    if (matches) return len
  }
  return 0
}

export function hasGoldenBadge(): boolean {
  try {
    return localStorage.getItem(BADGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markGoldenBadgeFound() {
  try {
    localStorage.setItem(BADGE_KEY, '1')
  } catch {
    /* storage unavailable — the celebration still plays this session */
  }
}
