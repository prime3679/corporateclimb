import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyticsEnabled, setAnalyticsEnabled, track, trackScreenChange } from '@/analytics'
import { PLAYER_CLASSES } from '@/data'
import { newOfficeCampaign, type OfficeState } from '@/engine/office'
import { trackOfficeTransition } from '@/screens/office/analytics'

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

  it('the Settings toggle off is a hard no-op, even when a key would enable it', () => {
    setAnalyticsEnabled(false)
    expect(analyticsEnabled()).toBe(false)
    track('title_view')
    trackScreenChange('title', 'officeClassSelect')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  const events = () =>
    fetchSpy.mock.calls.map(
      (c: unknown) =>
        (JSON.parse(String((c as unknown as [string, RequestInit])[1].body)) as { event: string })
          .event,
    )
  const bodies = () =>
    fetchSpy.mock.calls.map(
      (c: unknown) =>
        JSON.parse(String((c as unknown as [string, RequestInit])[1].body)) as {
          event: string
          properties: Record<string, unknown>
        },
    )

  it('maps screen transitions to funnel events', () => {
    setAnalyticsEnabled(true)
    trackScreenChange('title', 'officeClassSelect')
    expect(events()).toEqual(['screen_view', 'mode_start'])
    fetchSpy.mockClear()
    trackScreenChange('battle', 'gameOver')
    expect(events()).toEqual(['screen_view', 'run_end'])
    fetchSpy.mockClear()
    trackScreenChange('title', 'title')
    expect(events()).toEqual([])
  })

  describe('Office transitions', () => {
    // Fixture: fresh campaign → in a fight → fight won → floor celebration.
    // The mapper is a pure function of (prev, next), so the states are
    // shaped by hand rather than driven through the reducer.
    const fresh = newOfficeCampaign(PLAYER_CLASSES[0])
    const battle: OfficeState = {
      ...fresh,
      screen: 'battle',
      encounter: { encounterId: 'enc_desk_challenger' } as unknown as OfficeState['encounter'],
    }
    const won: OfficeState = {
      ...battle,
      screen: 'overworld',
      encounter: null,
      stats: { ...battle.stats, battlesWon: battle.stats.battlesWon + 1 },
    }
    const cleared: OfficeState = {
      ...won,
      overlay: { kind: 'celebration', screen: 'screen_floor2_complete' },
    }

    it('emits exactly fight_start, fight_won, floor_cleared for a floor clear', () => {
      setAnalyticsEnabled(true)
      trackOfficeTransition(fresh, battle)
      trackOfficeTransition(battle, won)
      trackOfficeTransition(won, cleared)
      expect(events()).toEqual(['office_fight_start', 'office_fight_won', 'office_floor_cleared'])
      const [start, win, clear] = bodies()
      expect(start.properties).toMatchObject({
        floor: 'floor_01',
        encounter: 'enc_desk_challenger',
      })
      expect(win.properties).toMatchObject({ floor: 'floor_01', encounter: 'enc_desk_challenger' })
      expect(clear.properties).toMatchObject({
        floor: 'floor_01',
        screen: 'screen_floor2_complete',
      })
    })

    it('adds run_end (mode office) only on the Exec celebration', () => {
      setAnalyticsEnabled(true)
      const exec: OfficeState = {
        ...won,
        floorId: 'floor_05',
        overlay: { kind: 'celebration', screen: 'screen_floor5_complete' },
      }
      trackOfficeTransition(won, exec)
      expect(events()).toEqual(['office_floor_cleared', 'run_end'])
      expect(bodies()[1].properties).toMatchObject({
        mode: 'office',
        screen: 'screen_floor5_complete',
      })
    })

    it('stays quiet for identical states, lost fights count once, and no key means nothing', () => {
      setAnalyticsEnabled(true)
      trackOfficeTransition(battle, battle)
      trackOfficeTransition(cleared, { ...cleared, player: { ...cleared.player, x: 1 } })
      expect(events()).toEqual([])
      const lost: OfficeState = {
        ...battle,
        screen: 'overworld',
        stats: { ...battle.stats, losses: battle.stats.losses + 1 },
      }
      trackOfficeTransition(battle, lost)
      expect(events()).toEqual(['office_fight_lost'])
      fetchSpy.mockClear()
      setAnalyticsEnabled(null)
      trackOfficeTransition(fresh, battle)
      trackOfficeTransition(battle, won)
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})
