// ─── ONBOARDING MOMENTS ─────────────────────────────────────
// First-run coach-mark state and the install-nudge frequency cap.
// Storage access is try/catch throughout; when storage is unavailable
// we err on the side of showing nothing (no nag loops).

import { getRunHistory } from './history'
import { canInstall, isIOS, isStandalone } from './platform'

const HINT_KEY = 'corporate-climb-seen-hint'
const NUDGE_KEY = 'corporate-climb-install-nudge'

export const INSTALL_NUDGE_MAX = 2
export const INSTALL_NUDGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

/** Show the type-matchup coach-mark only to a genuinely fresh player. */
export function shouldShowBattleHint(): boolean {
  try {
    if (localStorage.getItem(HINT_KEY)) return false
  } catch {
    return false
  }
  return getRunHistory().length === 0
}

export function markBattleHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    /* storage unavailable */
  }
}

interface NudgeState {
  count: number
  last: number
}

function readNudgeState(): NudgeState {
  try {
    const raw = localStorage.getItem(NUDGE_KEY)
    if (!raw) return { count: 0, last: 0 }
    const parsed = JSON.parse(raw) as Partial<NudgeState>
    return { count: Number(parsed.count) || 0, last: Number(parsed.last) || 0 }
  } catch {
    return { count: INSTALL_NUDGE_MAX, last: 0 } // storage broken → never nudge
  }
}

/** Pure cap check, exported for tests. */
export function nudgeAllowed(state: NudgeState, now: number): boolean {
  return state.count < INSTALL_NUDGE_MAX && now - state.last > INSTALL_NUDGE_COOLDOWN_MS
}

/**
 * Whether a run-end screen should offer installation right now:
 * not already installed, installable on this platform (captured
 * prompt or iOS manual flow), at most INSTALL_NUDGE_MAX times ever,
 * with a cooldown between showings.
 */
export function shouldShowInstallNudge(now = Date.now()): boolean {
  if (isStandalone()) return false
  if (!canInstall() && !isIOS()) return false
  return nudgeAllowed(readNudgeState(), now)
}

export function markInstallNudgeShown(now = Date.now()) {
  const state = readNudgeState()
  try {
    localStorage.setItem(NUDGE_KEY, JSON.stringify({ count: state.count + 1, last: now }))
  } catch {
    /* storage unavailable */
  }
}
