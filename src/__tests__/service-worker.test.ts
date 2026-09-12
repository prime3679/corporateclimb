// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { injectPrecache } from '../../scripts/sw-precache-plugin'

const source = readFileSync('public/sw.js', 'utf8')
const origin = 'https://game.test'
type RequestLike = string | { url: string }

function worker() {
  const handlers: Record<string, (event: Record<string, unknown>) => void> = {}
  const entries = new Map<string, Response>()
  const address = (r: RequestLike) => new URL(typeof r === 'string' ? r : r.url, origin).href
  const cache = {
    match: async (r: RequestLike) => entries.get(address(r))?.clone(),
    put: async (r: RequestLike, response: Response) => {
      entries.set(address(r), response.clone())
    },
    addAll: vi.fn(async (urls: string[]) => {
      for (const url of urls)
        await cache.put(url, new Response(url === '/' ? 'installed shell' : 'asset'))
    }),
  }
  const caches = {
    open: vi.fn(async () => cache),
    keys: async () => ['corporate-climb-old', 'corporate-climb-test', 'another-app'],
    delete: vi.fn(async () => true),
  }
  const network = vi.fn(async (_request: RequestLike) => new Response('online'))
  runInNewContext(
    injectPrecache(
      source,
      ['/', '/index.html', '/office/tiles.png', '/office/actors/lead_pm.png', '/office/icons.png'],
      'test',
    ),
    {
      self: {
        location: { origin },
        addEventListener: (key: string, fn: (typeof handlers)[string]) => {
          handlers[key] = fn
        },
        skipWaiting: () => {},
        clients: { claim: async () => {} },
      },
      caches,
      fetch: network,
      URL,
      Response,
    },
  )
  async function dispatch(key: string, data: Record<string, unknown> = {}) {
    const pending: Promise<unknown>[] = []
    handlers[key]({ ...data, waitUntil: (p: Promise<unknown>) => pending.push(p) })
    await Promise.all(pending)
  }
  async function request(path: string, mode = 'cors') {
    let response: Promise<Response> | undefined
    const pending: Promise<unknown>[] = []
    const req = { url: new URL(path, origin).href, method: 'GET', mode }
    handlers.fetch({
      request: req,
      respondWith: (p: Promise<Response>) => {
        response = p
      },
      waitUntil: (p: Promise<unknown>) => pending.push(p),
    })
    const result = response ? await response : await network(req)
    await Promise.all(pending)
    return result
  }
  return { cache, caches, network, request, dispatch }
}

describe('production service worker', () => {
  it('installs all Office art before activation and only clears its own obsolete caches', async () => {
    const sw = worker()
    await sw.dispatch('install')
    expect(await (await sw.request('/office/tiles.png')).text()).toBe('asset')
    expect(await (await sw.request('/office/actors/lead_pm.png')).text()).toBe('asset')
    expect(sw.network).not.toHaveBeenCalled()
    await sw.dispatch('activate')
    expect(sw.caches.delete.mock.calls).toEqual([['corporate-climb-old']])
  })

  it('always reads live leaderboard responses, even if an old result is cached', async () => {
    const sw = worker()
    await sw.cache.put('/api/daily-leaderboard?seed=20260911', new Response('stale'))
    sw.network
      .mockResolvedValueOnce(new Response('first'))
      .mockResolvedValueOnce(new Response('second'))
    expect(await (await sw.request('/api/daily-leaderboard?seed=20260911')).text()).toBe('first')
    expect(await (await sw.request('/api/daily-leaderboard?seed=20260911')).text()).toBe('second')
    expect(sw.network).toHaveBeenCalledTimes(2)
  })

  it('keeps the complete installed shell through a successful, failed and offline navigation', async () => {
    const sw = worker()
    await sw.dispatch('install')
    sw.network.mockResolvedValueOnce(new Response('next deploy'))
    expect(await (await sw.request('/', 'navigate')).text()).toBe('next deploy')
    sw.network.mockResolvedValueOnce(new Response('temporary failure', { status: 503 }))
    expect(await (await sw.request('/', 'navigate')).text()).toBe('installed shell')
    sw.network.mockRejectedValueOnce(new Error('offline'))
    expect(await (await sw.request('/', 'navigate')).text()).toBe('installed shell')
  })

  it('does not save failed or partial asset responses', async () => {
    const sw = worker()
    sw.network.mockResolvedValueOnce(new Response('missing', { status: 404 }))
    await sw.request('/office/tiles.png')
    expect(await sw.cache.match('/office/tiles.png')).toBeUndefined()
    sw.network.mockResolvedValueOnce(new Response('part', { status: 206 }))
    await sw.request('/office/tiles.png')
    expect(await sw.cache.match('/office/tiles.png')).toBeUndefined()
  })
})
