// ─── SHARE ───────────────────────────────────────────────────
// Native share sheet with clipboard fallback, extracted from the
// run-complete and daily-result screens so every share button behaves
// the same way.

import { Share } from '@capacitor/share'
import { isNative } from './native'

export type ShareResult = 'shared' | 'copied' | 'failed'

export async function share(text: string): Promise<ShareResult> {
  if (isNative()) {
    try {
      await Share.share({ text })
      return 'shared'
    } catch {
      // Cancelled sheet or share failure — don't surprise-copy instead.
      return 'failed'
    }
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      // Cancelled sheet or share failure — don't surprise-copy instead.
      return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
