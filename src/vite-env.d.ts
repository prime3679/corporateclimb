/// <reference types="vite/client" />

interface Window {
  /** Selected music bed — Playwright reads this. Not a gameplay API. */
  readonly __CC_MUSIC_TRACK?: string | null
  /** Office combat duck flag — Playwright reads this. Not a gameplay API. */
  readonly __CC_MUSIC_DUCKED?: boolean
}
