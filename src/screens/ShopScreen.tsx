import type { ItemId } from '@/types'
import { CURRENCY_ICON, ITEMS } from '@/data'
import { WELLNESS_DAY, shopPrice, wellnessPrice as wellnessPriceFor } from '@/engine'
import type { RunState } from '@/engine'
import { Button, Panel } from '@/ui'
import styles from './ShopScreen.module.css'

/**
 * The Company Store — the mid-act spend stop. Stock and prices come
 * straight from the run (the engine rolled them on floor advance);
 * this screen only renders and forwards intents.
 */
export default function ShopScreen({
  run,
  maxHp,
  inventoryFull,
  onBuyItem,
  onBuyWellness,
  onLeave,
  hideWellness = false,
  title,
  subtitle,
}: {
  run: RunState
  maxHp: number
  inventoryFull: boolean
  onBuyItem: (stockIdx: number) => void
  onBuyWellness: () => void
  onLeave: () => void
  hideWellness?: boolean
  title?: string
  /** Office vending flavor. Classic Company Store keeps the payroll line. */
  subtitle?: string
}) {
  const stock = run.shopStock ?? []
  // The engine helper folds in the Re-Org surcharge (Budget Scrutiny).
  const wellnessPrice = wellnessPriceFor(run)
  const atFullHp = run.hp >= maxHp

  const row = (opts: {
    key: string
    emoji: string
    name: string
    desc: string
    price: number
    disabled: boolean
    disabledReason: string | null
    onBuy: () => void
  }) => (
    <div
      key={opts.key}
      className={`premium-screen ${styles.row} ${opts.disabled ? styles.rowOff : ''}`}
    >
      <span className={styles.emoji}>{opts.emoji}</span>
      <span className={styles.body}>
        <span className={`t-display ${styles.name}`}>{opts.name}</span>
        <span className={`t-body ${styles.desc}`}>{opts.disabledReason ?? opts.desc}</span>
      </span>
      <Button
        variant="primary"
        size="sm"
        disabled={opts.disabled}
        onClick={opts.onBuy}
        aria-label={`Buy ${opts.name} for ${opts.price} stock options`}
      >
        {opts.disabled ? 'LOCKED' : `${opts.price} ${CURRENCY_ICON}`}
      </Button>
    </div>
  )

  return (
    <div className={`premium-screen ${styles.screen}`}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={`t-display ${styles.title}`}>{title ?? 'THE COMPANY STORE'}</div>
          <div className={`t-body ${styles.sub}`}>
            {subtitle ??
              (title === 'VENDING'
                ? 'Accepts Stock Options. Nobody asked how.'
                : 'Payroll-approved supplies. Exit through the gift shop.')}
          </div>
        </div>

        <Panel variant="glass" className={styles.balance}>
          <span className={`t-display ${styles.balanceText}`}>
            BALANCE: {run.stockOptions} {CURRENCY_ICON}
          </span>
        </Panel>
      </div>

      <div className={styles.stock}>
        {stock.map((id: ItemId, i: number) => {
          const item = ITEMS[id]
          const price = shopPrice(item.price, run.perks, run.floor, run.relics)
          const tooPoor = run.stockOptions < price
          return row({
            key: `${id}-${i}`,
            emoji: item.emoji,
            name: item.name,
            desc: item.desc,
            price,
            disabled: tooPoor || inventoryFull,
            disabledReason: inventoryFull
              ? 'Inventory full.'
              : tooPoor
                ? 'Not enough options.'
                : null,
            onBuy: () => onBuyItem(i),
          })
        })}
        {!hideWellness &&
          row({
            key: 'wellness',
            emoji: WELLNESS_DAY.emoji,
            name: WELLNESS_DAY.name,
            desc: WELLNESS_DAY.desc,
            price: wellnessPrice,
            disabled: run.stockOptions < wellnessPrice || atFullHp,
            disabledReason: atFullHp
              ? 'Already at full HP.'
              : run.stockOptions < wellnessPrice
                ? 'Not enough options.'
                : null,
            onBuy: onBuyWellness,
          })}
      </div>

      <div className={`t-body ${styles.meta}`}>
        HP {Math.max(0, run.hp)}/{maxHp} &bull; Items {run.inventory.length}/4
      </div>

      <Button variant="ghost" size="md" onClick={onLeave}>
        BACK TO WORK &rarr;
      </Button>
    </div>
  )
}
