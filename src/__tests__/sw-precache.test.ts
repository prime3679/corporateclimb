import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectPrecacheEntries, injectPrecache } from '../../scripts/sw-precache-plugin'

// vitest runs from the repo root; jsdom rewrites import.meta.url to an
// http URL, so resolve the template relative to cwd instead.
const SW_SOURCE = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')

describe('sw precache injection', () => {
  it('includes nested Office artwork without downloading demo video or music on install', () => {
    const dir = mkdtempSync(join(tmpdir(), 'corpclimb-precache-'))
    try {
      for (const file of [
        'office/tiles.png',
        'office/icons.png',
        'office/actors/lead_pm.png',
        'office/demo.mp4',
        'audio/music_office.mp3',
        'audio/sfx_office.mp3',
      ]) {
        mkdirSync(join(dir, file, '..'), { recursive: true })
        writeFileSync(join(dir, file), '')
      }
      const entries = collectPrecacheEntries(dir)
      expect(entries).toEqual(
        expect.arrayContaining([
          '/office/tiles.png',
          '/office/icons.png',
          '/office/actors/lead_pm.png',
          '/audio/sfx_office.mp3',
        ]),
      )
      expect(entries).not.toContain('/office/demo.mp4')
      expect(entries).not.toContain('/audio/music_office.mp3')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
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
