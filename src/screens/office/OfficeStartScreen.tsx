import { useState } from 'react'
import { CURRENCY_ICON } from '@/data'
import { loadOfficeSave, memberName, type OfficeSave } from '@/engine/office'
import { Button } from '@/ui'
import { SFX } from '@/sfx'
import Headshot from './Headshot'
import { campaignSummary, formatFloorTime, memberRing, memberSprite } from './cast'
import styles from './OfficeStartScreen.module.css'

/**
 * `screen_office_start`: the campaign summary card with Continue / New
 * campaign. Erasing an existing campaign asks first; a missing or corrupt
 * save says so and offers only New campaign.
 */
export default function OfficeStartScreen({
  onContinue,
  onNew,
  onBack,
  hasSave,
}: {
  onContinue: () => void
  onNew: () => void
  onBack: () => void
  hasSave: boolean
}) {
  const [save] = useState<OfficeSave | null>(() => (hasSave ? loadOfficeSave() : null))
  const [confirmErase, setConfirmErase] = useState(false)
  const corrupt = hasSave && !save

  return (
    <div className={`premium-screen ${styles.screen}`}>
      <button type="button" className={styles.back} onClick={onBack} aria-label="Back to title">
        ‹ Title
      </button>

      <div className={styles.eyebrow}>Campaign · Floors 1–5</div>
      <h1 className={styles.title}>THE OFFICE</h1>
      <p className={styles.blurb}>
        Five floors. Reception through Exec. Print the badge they keep reprinting, file what nobody
        wants to file, and sit the review that does not end early.
      </p>

      {save && (
        <div className={styles.card} aria-label="Campaign summary">
          <div className={styles.cardHead}>
            <div className={styles.headshots}>
              {save.party.map((m) => (
                <Headshot key={m.slot} spriteId={memberSprite(m)} size={44} ring={memberRing(m)} />
              ))}
              {Array.from({ length: Math.max(0, 3 - save.party.length) }, (_, i) => (
                <span key={`open-${i}`} className={styles.openSeat} aria-label="Open seat">
                  +
                </span>
              ))}
            </div>
            <div>
              <div className={styles.cardTitle}>{memberName(save.party[0])}</div>
              <div className={styles.cardSub}>{campaignSummary(save)}</div>
            </div>
          </div>
          <div className={styles.stats}>
            <span>
              Wallet{' '}
              <b>
                {CURRENCY_ICON} {save.run.stockOptions}
              </b>
            </span>
            <span>
              Team <b>{save.party.length} / 3</b>
            </span>
            <span>
              On floor <b>{formatFloorTime(save.stats.msOnFloor)}</b>
            </span>
            <span>
              Battles won <b>{save.stats.battlesWon}</b>
            </span>
          </div>
        </div>
      )}

      {corrupt && (
        <div className={`${styles.card} ${styles.cardWarn}`} role="alert">
          <div className={styles.cardTitle}>Couldn't read this campaign.</div>
          <div className={styles.cardSub}>
            Start a new one — the Classic climb save is untouched.
          </div>
        </div>
      )}

      {confirmErase ? (
        <div className={styles.card} role="dialog" aria-label="Erase campaign?">
          <div className={styles.cardTitle}>Erase this campaign?</div>
          <div className={styles.cardSub}>The team goes back to being coworkers.</div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.danger}
              onClick={() => {
                SFX.menuConfirm()
                onNew()
              }}
            >
              Erase
            </button>
            <Button
              variant="ghost"
              autoFocus
              onClick={() => {
                SFX.menuBack()
                setConfirmErase(false)
              }}
            >
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {save && (
            <Button variant="primary" size="lg" onClick={onContinue} autoFocus>
              CONTINUE
            </Button>
          )}
          <Button
            variant={save ? 'secondary' : 'primary'}
            size={save ? 'md' : 'lg'}
            onClick={() => {
              if (save) {
                SFX.menuSelect()
                setConfirmErase(true)
              } else onNew()
            }}
          >
            NEW CAMPAIGN
          </Button>
        </div>
      )}
    </div>
  )
}
