import type { ItemId } from '@/types'
import { CURRENCY_ICON, ITEMS } from '@/data'
import { WELLNESS_DAY, shopPrice } from '@/engine'
import type { RunState } from '@/engine'
import { Button, Panel } from '@/ui'

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
}: {
  run: RunState
  maxHp: number
  inventoryFull: boolean
  onBuyItem: (stockIdx: number) => void
  onBuyWellness: () => void
  onLeave: () => void
}) {
  const stock = run.shopStock ?? []
  const wellnessPrice = shopPrice(WELLNESS_DAY.price, run.perks, run.floor)
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: 'var(--ink)',
        border: 'var(--border-w) solid var(--ink-soft)',
        borderRadius: 'var(--radius-md)',
        opacity: opts.disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 24 }}>{opts.emoji}</span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          className="t-display"
          style={{ fontSize: 'var(--display-2xs)', color: 'var(--paper)', lineHeight: 1.4 }}
        >
          {opts.name}
        </span>
        <span
          className="t-body"
          style={{ fontSize: 'var(--body-sm)', color: 'var(--muted-light)', lineHeight: 1.2 }}
        >
          {opts.disabledReason ?? opts.desc}
        </span>
      </span>
      <Button
        variant="primary"
        size="sm"
        disabled={opts.disabled}
        onClick={opts.onBuy}
        aria-label={`Buy ${opts.name} for ${opts.price} stock options`}
      >
        {opts.price} {CURRENCY_ICON}
      </Button>
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        padding: 20,
        background: 'linear-gradient(180deg, #102027 0%, #1B3A2F 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          textShadow: '2px 2px 0 #E65100',
          letterSpacing: 2,
        }}
      >
        🛒 THE COMPANY STORE
      </div>
      <div
        className="t-body"
        style={{ fontSize: 'var(--body-md)', color: 'var(--muted)', textAlign: 'center' }}
      >
        Vesting today only. No refunds.
      </div>

      <Panel variant="glass" style={{ padding: '6px 14px' }}>
        <span
          className="t-display"
          style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold)' }}
        >
          BALANCE: {run.stockOptions} {CURRENCY_ICON}
        </span>
      </Panel>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 350 }}
      >
        {stock.map((id: ItemId, i: number) => {
          const item = ITEMS[id]
          const price = shopPrice(item.price, run.perks, run.floor)
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
        {row({
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

      <div className="t-body" style={{ fontSize: 'var(--body-sm)', color: 'var(--muted)' }}>
        HP {Math.max(0, run.hp)}/{maxHp} &bull; Items {run.inventory.length}/4
      </div>

      <Button variant="ghost" size="md" onClick={onLeave}>
        BACK TO WORK &rarr;
      </Button>
    </div>
  )
}
