// ─── SHOP (The Company Store) ────────────────────────────────
// Mid-act spend stops for Stock Options. Stock is rolled through the
// injected rng (so daily shops are identical for everyone) and lives
// in RunState, which makes a half-finished shop visit resumable from
// a save. All purchase functions are pure validators: an invalid buy
// returns the run unchanged.

import type { ItemId, PerkId, RelicId } from '@/types'
import { ALL_ITEM_IDS, ITEMS, getAct } from '@/data'
import { collectMods } from './modifiers'
import type { Rng } from './rng'
import { MAX_INVENTORY, type RunState } from './state'

export const SHOP_STOCK_SIZE = 3

/** Floors (0-indexed) whose victory leads to a shop: mid-act stops. */
export const SHOP_FLOORS: Record<'normal' | 'daily', number[]> = {
  normal: [5, 15, 25],
  daily: [5, 10],
}

/** The flat-price HP top-up every shop offers. */
export const WELLNESS_DAY = {
  name: 'Wellness Day',
  emoji: '🌱',
  desc: 'Mandatory fun. Restores 50% of max HP.',
  price: 30,
  healFraction: 0.5,
}

export function isShopFloor(floor: number, mode: 'normal' | 'daily'): boolean {
  return SHOP_FLOORS[mode].includes(floor)
}

/**
 * Inflation up the tower: payouts grow with the floor, so prices grow
 * with the act — otherwise money stops mattering after act 1.
 */
export const ACT_PRICE_MULT: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 3 }

/** Price at the given floor, after act inflation, perks, and relics. */
export function shopPrice(
  basePrice: number,
  perks: PerkId[],
  floor = 0,
  relics: RelicId[] = [],
): number {
  const { priceMult } = collectMods(perks, relics)
  return Math.max(1, Math.round(basePrice * ACT_PRICE_MULT[getAct(floor)] * priceMult))
}

/** Roll the stop's stock: SHOP_STOCK_SIZE distinct items. */
export function rollShopStock(rng: Rng): ItemId[] {
  const pool = [...ALL_ITEM_IDS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, SHOP_STOCK_SIZE)
}

/** Buy the stocked item at `stockIdx`; no-op if it can't be afforded or carried. */
export function buyShopItem(run: RunState, stockIdx: number): RunState {
  const itemId = run.shopStock?.[stockIdx]
  if (!itemId) return run
  const price = shopPrice(ITEMS[itemId].price, run.perks, run.floor, run.relics)
  if (run.stockOptions < price || run.inventory.length >= MAX_INVENTORY) return run
  return {
    ...run,
    stockOptions: run.stockOptions - price,
    inventory: [...run.inventory, itemId],
    shopStock: run.shopStock!.filter((_, i) => i !== stockIdx),
  }
}

/** Buy a Wellness Day heal; no-op if unaffordable or already at full HP. */
export function buyWellnessDay(run: RunState, effectiveMaxHp: number): RunState {
  const price = shopPrice(WELLNESS_DAY.price, run.perks, run.floor, run.relics)
  if (run.stockOptions < price || run.hp >= effectiveMaxHp) return run
  const heal = Math.round(effectiveMaxHp * WELLNESS_DAY.healFraction)
  return {
    ...run,
    stockOptions: run.stockOptions - price,
    hp: Math.min(effectiveMaxHp, run.hp + heal),
  }
}

/** Close the shop (stock does not carry to the next stop). */
export function leaveShop(run: RunState): RunState {
  return run.shopStock === null ? run : { ...run, shopStock: null }
}
