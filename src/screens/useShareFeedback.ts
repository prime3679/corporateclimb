import { useEffect, useState } from 'react'
import { share, type ShareResult } from '@/platform'

export function useShareFeedback(text: string, defaultLabel: string) {
  const [feedback, setFeedback] = useState<{ result: ShareResult } | null>(null)

  useEffect(() => {
    if (feedback?.result !== 'copied' && feedback?.result !== 'cancelled') return
    const timer = setTimeout(() => setFeedback(null), 2000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleShare = async () => {
    setFeedback({ result: await share(text) })
  }
  const shared = feedback?.result === 'shared' || feedback?.result === 'copied'
  const shareLabel =
    feedback?.result === 'cancelled' ? 'MAYBE LATER' : shared ? 'COPIED!' : defaultLabel

  return { handleShare, shared, shareLabel }
}
