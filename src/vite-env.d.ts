/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Checkout URL for the Title coffee tip. Empty / unset hides the CTA. */
  readonly VITE_COFFEE_PAYMENT_URL?: string
}

interface Window {
  /** Selected music bed — Playwright reads this. Not a gameplay API. */
  readonly __CC_MUSIC_TRACK?: string | null
  /** Office combat duck flag — Playwright reads this. Not a gameplay API. */
  readonly __CC_MUSIC_DUCKED?: boolean
}
