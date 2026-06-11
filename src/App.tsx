import CorporateClimb from './CorporateClimb'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <CorporateClimb />
    </ErrorBoundary>
  )
}
