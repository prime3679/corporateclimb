/** Title coffee tip + Settings feedback — env and copy in one place. */

export const FEEDBACK_ISSUES_URL = 'https://github.com/prime3679/corporateclimb/issues/new/choose'
export const FEEDBACK_LABEL = 'Send feedback'
export const FEEDBACK_HELPER = 'Bugs, ideas, or a quick note — it goes straight to the captain.'

export const COFFEE_TIP_LABEL = 'Buy the intern a coffee — $5'
export const COFFEE_THANKS_TOAST = 'Thanks — the intern’s fueled. Keep climbing.'
export const COFFEE_THANKS_PARAM = 'thanks'

/** Prefers `VITE_COFFEE_PAYMENT_URL`. Empty / unset hides the Title tip CTA. */
export function coffeePaymentUrl(
  env: { VITE_COFFEE_PAYMENT_URL?: string } = import.meta.env,
): string {
  const raw = env.VITE_COFFEE_PAYMENT_URL
  return typeof raw === 'string' ? raw.trim() : ''
}

export const COFFEE_PAYMENT_URL = coffeePaymentUrl()

export function hasCoffeeThanksQuery(search: string): boolean {
  const q = search.startsWith('?') ? search.slice(1) : search
  return new URLSearchParams(q).get('coffee') === COFFEE_THANKS_PARAM
}

/** Drop `?coffee=thanks` without a navigation (same-origin return). */
export function stripCoffeeThanksQuery(href = window.location.href): string {
  const url = new URL(href)
  if (url.searchParams.get('coffee') !== COFFEE_THANKS_PARAM) return href
  url.searchParams.delete('coffee')
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', next)
  return next
}
