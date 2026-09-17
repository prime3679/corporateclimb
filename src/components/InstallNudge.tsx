import { useEffect, useState } from 'react'
import { canInstall, isIOS, promptInstall } from '@/platform'
import { markInstallNudgeShown, shouldShowInstallNudge } from '@/onboarding'
import { Button } from '@/ui'
import styles from './InstallNudge.module.css'

/**
 * The install offer, surfaced at run-end moments (the natural "I want
 * to come back" beat). Chromium gets the captured one-tap prompt; iOS
 * gets the manual Share-sheet instruction. Frequency-capped in
 * onboarding.ts and hidden entirely once installed.
 */
export default function InstallNudge() {
  const [mode, setMode] = useState<'hidden' | 'prompt' | 'ios' | 'done'>(() =>
    shouldShowInstallNudge() ? (canInstall() ? 'prompt' : isIOS() ? 'ios' : 'hidden') : 'hidden',
  )

  useEffect(() => {
    if (mode === 'prompt' || mode === 'ios') markInstallNudgeShown()
    // Count the showing once per mount, not per re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (mode === 'hidden') return null

  return (
    <div className={`t-body ${styles.nudge}`}>
      <span aria-hidden="true" className={styles.glyph}>
        📲
      </span>
      {mode === 'prompt' && (
        <>
          <span className={styles.copy}>Keep climbing offline — install Corporate Climber.</span>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              const outcome = await promptInstall()
              setMode(outcome === 'accepted' ? 'done' : 'hidden')
            }}
          >
            INSTALL
          </Button>
        </>
      )}
      {mode === 'ios' && (
        <span className={styles.copy}>
          Add it to your home screen: <b>Share</b> → <b>Add to Home Screen</b>.
        </span>
      )}
      {mode === 'done' && (
        <span className={styles.copy}>Installed — see you on the home screen.</span>
      )}
    </div>
  )
}
