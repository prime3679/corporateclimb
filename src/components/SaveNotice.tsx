import Button from '@/ui/Button'
import styles from './SaveNotice.module.css'

export default function SaveNotice({
  onRetry,
  onClose,
}: {
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <aside className={styles.notice} role="alert" aria-label="Progress could not be saved">
      <strong>YOUR SAVE NEEDS ATTENTION</strong>
      <p>This browser couldn't store your progress. Keep this tab open until saving works again.</p>
      <div className={styles.actions}>
        <Button size="sm" variant="primary" onClick={onRetry}>
          RETRY SAVE
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          GOT IT
        </Button>
      </div>
    </aside>
  )
}
