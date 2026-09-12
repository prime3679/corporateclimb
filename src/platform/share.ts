// ─── SHARE ───────────────────────────────────────────────────
// Native share sheet with clipboard fallback, extracted from the
// run-complete and daily-result screens so every share button behaves
// the same way.

import { Share } from '@capacitor/share'
import { isNative } from './native'
import { track } from '../analytics'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export function isShareCancelled(error: unknown): boolean {
  const err = error as { name?: string; message?: string } | null
  return err?.name === 'AbortError' || /abort|cancel/i.test(err?.message ?? '')
}

export async function share(text: string): Promise<ShareResult> {
  const result = await shareInner(text)
  track('share', { result })
  return result
}

async function shareInner(text: string): Promise<ShareResult> {
  if (isNative()) {
    try {
      await Share.share({ text })
      return 'shared'
    } catch (error) {
      // Cancelled sheet or share failure — don't surprise-copy instead.
      return isShareCancelled(error) ? 'cancelled' : 'failed'
    }
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (error) {
      // Cancelled sheet or share failure — don't surprise-copy instead.
      return isShareCancelled(error) ? 'cancelled' : 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
