import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShareResult } from '@/platform'
import { useShareFeedback } from '@/screens/useShareFeedback'

const shareMock = vi.hoisted(() => vi.fn<(text: string) => Promise<ShareResult>>())

vi.mock('@/platform', () => ({
  share: (text: string) => shareMock(text),
}))

type Snapshot = {
  shared: boolean
  shareLabel: string
  handleShare: () => Promise<void>
}

function Probe({
  text,
  defaultLabel,
  onSnap,
}: {
  text: string
  defaultLabel: string
  onSnap: (snap: Snapshot) => void
}) {
  const state = useShareFeedback(text, defaultLabel)
  onSnap(state)
  return <span>{state.shareLabel}</span>
}

let container: HTMLDivElement | null = null
let root: Root | null = null
let snap: Snapshot

async function mount(defaultLabel = 'SHARE RESULT') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(
      <Probe
        text="share-text"
        defaultLabel={defaultLabel}
        onSnap={(next) => {
          snap = next
        }}
      />,
    )
  })
}

async function unmount() {
  if (root) {
    await act(async () => {
      root!.unmount()
    })
    root = null
  }
  container?.remove()
  container = null
}

async function clickShare() {
  await act(async () => {
    await snap.handleShare()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  shareMock.mockReset()
})

afterEach(async () => {
  await unmount()
  vi.useRealTimers()
})

describe('useShareFeedback', () => {
  it('shows NEXT TIME on cancel and restores the default label after 2s', async () => {
    shareMock.mockResolvedValue('cancelled')
    await mount()
    expect(snap.shareLabel).toBe('SHARE RESULT')
    expect(snap.shared).toBe(false)

    await clickShare()
    expect(snap.shareLabel).toBe('NEXT TIME')
    expect(snap.shared).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1999)
    })
    expect(snap.shareLabel).toBe('NEXT TIME')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(snap.shareLabel).toBe('SHARE RESULT')
    expect(snap.shared).toBe(false)
  })

  it('flashes COPIED! on copied and restores after 2s', async () => {
    shareMock.mockResolvedValue('copied')
    await mount()

    await clickShare()
    expect(snap.shareLabel).toBe('COPIED!')
    expect(snap.shared).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(snap.shareLabel).toBe('SHARE RESULT')
    expect(snap.shared).toBe(false)
  })

  it('clears the green shared state when a later cancel arrives', async () => {
    shareMock.mockResolvedValueOnce('copied')
    await mount()

    await clickShare()
    expect(snap.shared).toBe(true)
    expect(snap.shareLabel).toBe('COPIED!')

    shareMock.mockResolvedValueOnce('cancelled')
    await clickShare()
    expect(snap.shared).toBe(false)
    expect(snap.shareLabel).toBe('NEXT TIME')
  })

  it('shows no flash when share fails', async () => {
    shareMock.mockResolvedValue('failed')
    await mount()

    await clickShare()
    expect(snap.shareLabel).toBe('SHARE RESULT')
    expect(snap.shared).toBe(false)
  })

  it('refreshes the cancel timer on a repeated cancel', async () => {
    shareMock.mockResolvedValue('cancelled')
    await mount()

    await clickShare()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(snap.shareLabel).toBe('NEXT TIME')

    await clickShare()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(snap.shareLabel).toBe('NEXT TIME')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(snap.shareLabel).toBe('SHARE RESULT')
    expect(snap.shared).toBe(false)
  })

  it('does not let a cancel timer clear a later shared result', async () => {
    shareMock.mockResolvedValueOnce('cancelled')
    await mount()

    await clickShare()
    expect(snap.shareLabel).toBe('NEXT TIME')

    shareMock.mockResolvedValueOnce('shared')
    await clickShare()
    expect(snap.shareLabel).toBe('COPIED!')
    expect(snap.shared).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(snap.shareLabel).toBe('COPIED!')
    expect(snap.shared).toBe(true)
  })

  it('cleans up the pending timer on unmount', async () => {
    shareMock.mockResolvedValue('cancelled')
    await mount()
    await clickShare()
    expect(snap.shareLabel).toBe('NEXT TIME')

    await unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
  })
})
