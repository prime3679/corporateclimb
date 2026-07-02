import { useEffect, useState } from 'react'
import { canInstall, isIOS, promptInstall } from '@/platform'
import { markInstallNudgeShown, shouldShowInstallNudge } from '@/onboarding'
import { Button } from '@/ui'

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
    <div
      className="t-body"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 320,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255,211,77,.3)',
        background: 'rgba(255,193,7,.08)',
        fontSize: 'var(--body-sm)',
        color: 'var(--paper)',
        lineHeight: 1.25,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 20 }}>
        📲
      </span>
      {mode === 'prompt' && (
        <>
          <span style={{ flex: 1 }}>Keep climbing offline — install Corporate Climb.</span>
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
        <span style={{ flex: 1 }}>
          Add it to your home screen: <b>Share</b> → <b>Add to Home Screen</b>.
        </span>
      )}
      {mode === 'done' && <span style={{ flex: 1 }}>Installed — see you on the home screen.</span>}
    </div>
  )
}
