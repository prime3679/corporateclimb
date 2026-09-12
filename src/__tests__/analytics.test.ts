import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyticsEnabled, setAnalyticsEnabled, track, trackScreenChange } from '@/analytics'

/**
 * Analytics is best-effort and off by default. These guards keep it that
 * way: no key → no network; an enabled adapter sends one well-formed
 * PostHog capture per event with an anonymous id; the screen-transition
 * mapper only emits the funnel events the launch dashboard reads.
 */
describe('analytics', () => {
  const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}')))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy)
    fetchSpy.mockClear()
    try {
      localStorage.clear()
    } catch {
      /* jsdom */
    }
  })

  afterEach(() => {
    setAnalyticsEnabled(null)
    vi.unstubAllGlobals()
  })

  it('is a no-op without a key', () => {
    expect(analyticsEnabled()).toBe(false)
    track('title_view')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends one capture with an anonymous id when enabled', () => {
    setAnalyticsEnabled(true)
    track('share', { result: 'copied' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/i\/v0\/e\/$/)
    const body = JSON.parse(String(init.body)) as {
      event: string
      distinct_id: string
      properties: Record<string, unknown>
    }
    expect(body.event).toBe('share')
    expect(body.distinct_id).toBeTruthy()
    expect(body.properties.result).toBe('copied')
    expect(init.keepalive).toBe(true)
    // Same id on the next event — the anonymous id is stable per browser.
    track('title_view')
    const second = JSON.parse(
      String((fetchSpy.mock.calls[1] as unknown as [string, RequestInit])[1].body),
    ) as {
      distinct_id: string
    }
    expect(second.distinct_id).toBe(body.distinct_id)
  })

  it('never throws when fetch is missing', () => {
    setAnalyticsEnabled(true)
    vi.stubGlobal('fetch', undefined)
    expect(() => track('title_view')).not.toThrow()
  })

  it('maps screen transitions to funnel events', () => {
    setAnalyticsEnabled(true)
    const events = () =>
      fetchSpy.mock.calls.map(
        (c: unknown) =>
          (JSON.parse(String((c as unknown as [string, RequestInit])[1].body)) as { event: string })
            .event,
      )
    trackScreenChange('title', 'officeClassSelect')
    expect(events()).toEqual(['screen_view', 'mode_start'])
    fetchSpy.mockClear()
    trackScreenChange('battle', 'gameOver')
    expect(events()).toEqual(['screen_view', 'run_end'])
    fetchSpy.mockClear()
    trackScreenChange('title', 'title')
    expect(events()).toEqual([])
  })
})
