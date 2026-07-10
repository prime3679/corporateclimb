import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { injectPrecache } from '../../scripts/sw-precache-plugin'

// vitest runs from the repo root; jsdom rewrites import.meta.url to an
// http URL, so resolve the template relative to cwd instead.
const SW_SOURCE = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')

describe('sw precache injection', () => {
  it('the template carries the placeholders the plugin rewrites', () => {
    expect(SW_SOURCE).toContain("const VERSION = 'dev'")
    expect(SW_SOURCE).toContain("self.__PRECACHE = ['/']")
  })

  it('injects the manifest list and build version', () => {
    const entries = ['/', '/index.html', '/assets/index-abc123.js', '/audio/sfx_email_ding.mp3']
    const out = injectPrecache(SW_SOURCE, entries, 'deadbeef1234')
    expect(out).toContain("const VERSION = 'deadbeef1234'")
    expect(out).toContain(`self.__PRECACHE = ${JSON.stringify(entries)}`)
    expect(out).not.toContain("self.__PRECACHE = ['/']")
  })

  it('is idempotent-safe: injected output no longer matches the placeholder', () => {
    const once = injectPrecache(SW_SOURCE, ['/', '/index.html'], 'v-one')
    // A second pass (should never happen) must not corrupt the file.
    const twice = injectPrecache(once, ['/', '/index.html'], 'v-one')
    expect(twice).toBe(once)
  })
})
