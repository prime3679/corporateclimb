import { useEffect } from 'react'
import type { ItemId } from '@/types'
import { ITEMS, TREASURE_CONSOLATION_OPTIONS } from '@/data'
import { IconChip } from '@/ui'
import styles from './InterludeScreen.module.css'

/**
 * The cache from a Supply Closet raid: pick one of the rolled items,
 * or leave it for petty cash. With full pockets (inventory capped)
 * only the consolation is takeable. Keys 1–3 pick, 4 leaves.
 */
export default function SupplyClosetScreen({
  loot,
  inventoryFull,
  onPick,
}: {
  loot: ItemId[]
  inventoryFull: boolean
  onPick: (item: ItemId | null) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < loot.length && !inventoryFull) onPick(loot[idx])
      if (e.key === String(loot.length + 1)) onPick(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loot, inventoryFull, onPick])

  return (
    <div
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{ padding: '24px 20px 30px' }}
    >
      <div className={styles.board} />
      <div className={`${styles.glow} ${styles.glowTop}`} />
      <div className={styles.stage} style={{ gap: 18 }}>
        <div className={styles.headlineStack}>
          <div
            className={`t-display ${styles.header}`}
            style={{ fontSize: 'var(--display-xs)', letterSpacing: 2 }}
          >
            THE SUPPLY CLOSET
          </div>
          <div className={`t-body ${styles.caption}`} style={{ fontSize: 'var(--body-md)' }}>
            {inventoryFull
              ? 'Your pockets are full. Grab the petty cash and go.'
              : 'Take one thing. Anything more shows up on the expense report.'}
          </div>
        </div>

        <div
          className={styles.choiceGrid}
          style={{ flexDirection: 'column', gap: 10, maxWidth: 390 }}
        >
          {loot.map((id, i) => {
            const item = ITEMS[id]
            return (
              <button
                key={id}
                onClick={() => onPick(id)}
                disabled={inventoryFull}
                className={styles.card}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  cursor: inventoryFull ? 'not-allowed' : 'pointer',
                  opacity: inventoryFull ? 0.45 : 1,
                  textAlign: 'left',
                }}
              >
                <IconChip glyph={item.emoji} tone="gold" size="lg" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    className="t-display"
                    style={{
                      fontSize: 'var(--display-2xs)',
                      color: 'var(--gold-bright)',
                      lineHeight: 1.7,
                      textShadow: '0 1px 0 rgba(5,7,13,.42)',
                    }}
                  >
                    [{i + 1}] {item.name.toUpperCase()}
                  </span>
                  <span
                    className="t-body"
                    style={{
                      fontSize: 'var(--body-sm)',
                      color: 'color-mix(in srgb, var(--muted-light) 88%, var(--paper) 12%)',
                      lineHeight: 1.22,
                      textShadow: '0 1px 0 rgba(5,7,13,.3)',
                    }}
                  >
                    {item.desc}
                  </span>
                </span>
              </button>
            )
          })}

          <button
            onClick={() => onPick(null)}
            className={styles.card}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px',
              border: '1px dashed rgba(214,224,236,0.5)',
              cursor: 'pointer',
            }}
          >
            <span
              className="t-display"
              style={{
                fontSize: 'var(--display-2xs)',
                color: 'color-mix(in srgb, var(--paper) 78%, var(--muted-light) 22%)',
                lineHeight: 1.7,
                textShadow: '0 1px 0 rgba(5,7,13,.42)',
              }}
            >
              [{loot.length + 1}] LEAVE IT · +{TREASURE_CONSOLATION_OPTIONS} 📈
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
