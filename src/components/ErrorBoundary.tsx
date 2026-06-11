import { Component, type ReactNode } from 'react'
import Button from '@/ui/Button'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defense: a render crash anywhere in the tree shows a
 * styled "out of office" screen instead of a blank page. Reloading is
 * safe — the run is persisted to localStorage after every floor.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled render error:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className={styles.fallback} role="alert">
        <div className={styles.title}>OUT OF OFFICE</div>
        <div className={styles.message}>
          Something crashed on the way up the ladder. Your run is saved — reload to pick up where
          you left off.
        </div>
        <div className={styles.detail}>{this.state.error.message}</div>
        <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
          RELOAD
        </Button>
      </div>
    )
  }
}
