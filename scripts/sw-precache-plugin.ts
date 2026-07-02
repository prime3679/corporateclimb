// ─── SW PRECACHE INJECTION ───────────────────────────────────
// After the production bundle lands in dist/, rewrite sw.js: the
// placeholder precache list becomes the real asset manifest (shell,
// fingerprinted code/fonts/sprites, icons, SFX — music beds stay
// on-demand, see the WARM_MUSIC message) and VERSION becomes a hash
// of the precached contents so every deploy invalidates cleanly.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/** Pure string rewrite, unit-tested separately from the fs walk. */
export function injectPrecache(swSource: string, entries: string[], version: string): string {
  return swSource
    .replace(/const VERSION = '[^']*'/, `const VERSION = '${version}'`)
    .replace(/self\.__PRECACHE = \[[^\]]*\]/, `self.__PRECACHE = ${JSON.stringify(entries)}`)
}

export function collectPrecacheEntries(outDir: string): string[] {
  const entries = ['/', '/index.html', '/manifest.webmanifest']
  for (const f of readdirSync(outDir)) {
    if (/^(icon-|apple-touch-icon)/.test(f)) entries.push(`/${f}`)
  }
  const assetsDir = join(outDir, 'assets')
  if (existsSync(assetsDir)) {
    for (const f of readdirSync(assetsDir)) entries.push(`/assets/${f}`)
  }
  const audioDir = join(outDir, 'audio')
  if (existsSync(audioDir)) {
    for (const f of readdirSync(audioDir)) {
      // Short effects/stings precache; multi-hundred-KB music beds don't.
      if (/^(sfx_|sting_)/.test(f)) entries.push(`/audio/${f}`)
    }
  }
  return entries.sort()
}

export function swPrecachePlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'sw-precache',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const swPath = join(outDir, 'sw.js')
      if (!existsSync(swPath)) return
      const entries = collectPrecacheEntries(outDir)
      const hash = createHash('sha256')
      hash.update(JSON.stringify(entries))
      for (const e of entries) {
        if (e === '/') continue
        const p = join(outDir, e)
        if (existsSync(p)) hash.update(readFileSync(p))
      }
      const version = hash.digest('hex').slice(0, 12)
      writeFileSync(swPath, injectPrecache(readFileSync(swPath, 'utf8'), entries, version))
      console.log(`[sw-precache] ${entries.length} entries precached, version ${version}`)
    },
  }
}
