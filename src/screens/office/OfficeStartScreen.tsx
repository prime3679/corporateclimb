import { Button } from '@/ui'

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
  return (
    <div
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        padding: 24,
      }}
    >
      <div
        className="t-display"
        style={{ fontSize: 22, color: 'var(--cc-gold)', letterSpacing: 2 }}
      >
        THE OFFICE
      </div>
      <div className="t-body" style={{ textAlign: 'center', maxWidth: 320 }}>
        Floor 1. Reception, desks, a printer, and a one-on-one that does not end early.
      </div>
      {hasSave && (
        <Button variant="primary" size="lg" onClick={onContinue}>
          CONTINUE
        </Button>
      )}
      <Button variant={hasSave ? 'secondary' : 'primary'} size="lg" onClick={onNew}>
        {hasSave ? 'NEW CAMPAIGN' : 'START'}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        BACK
      </Button>
    </div>
  )
}
