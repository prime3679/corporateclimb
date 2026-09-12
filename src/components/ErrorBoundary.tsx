import { Component, type ReactNode } from 'react'
import Button from '@/ui/Button'
import styles from './ErrorBoundary.module.css'
import { track } from '@/analytics'

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
    track('error', { where: 'render', message: String(error.message ?? error).slice(0, 300) })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className={styles.fallback} role="alert">
        <div className={styles.title}>OUT OF OFFICE</div>
        <div className={styles.message}>
          Something interrupted your climb. Return to the title to continue from your last saved
          checkpoint.
        </div>
        <Button variant="primary" size="lg" onClick={() => this.setState({ error: null })}>
          RETURN TO TITLE
        </Button>
        <Button variant="ghost" size="lg" onClick={() => window.location.reload()}>
          RELOAD
        </Button>
      </div>
    )
  }
}
