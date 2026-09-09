import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * One name everywhere a player sees it.
 *
 * The game is "Corporate Climb" — browser tab, link previews, PWA install
 * dialog, native app name, install nudge, share text. The only sanctioned
 * short form is the home-screen label (`short_name` and
 * `apple-mobile-web-app-title`), because launchers truncate labels past
 * roughly twelve characters and "Corporate Climb" is fifteen. That label is
 * "Corp Climb" — a spaced, readable clipping of the real name, never a mashed
 * "CorpClimb". This file is what keeps the mirrors honest.
 */

const APP_NAME = 'Corporate Climb'
const HOME_SCREEN_NAME = 'Corp Climb'
const HOME_SCREEN_MAX = 12

const repoText = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts)).toString('utf8')

const attr = (html: string, tag: RegExp) => html.match(tag)?.[1]

describe('player-facing app name', () => {
  const html = repoText('index.html')
  const manifest = JSON.parse(repoText('public/manifest.webmanifest')) as {
    name: string
    short_name: string
  }

  it('index.html titles the page and its link previews with the full name', () => {
    expect(attr(html, /<title>([^<]*)<\/title>/)).toMatch(new RegExp(`^${APP_NAME}( — .+)?$`))
    expect(attr(html, /<meta property="og:title" content="([^"]*)"/)).toBe(APP_NAME)
    expect(attr(html, /<meta name="twitter:title" content="([^"]*)"/)).toBe(APP_NAME)
    expect(html).toContain(`<div class="boot-wordmark">${APP_NAME.toUpperCase()}</div>`)
  })

  it('the PWA manifest and the native shell agree on the full name', () => {
    expect(manifest.name).toBe(APP_NAME)
    expect(repoText('capacitor.config.ts')).toContain(`appName: '${APP_NAME}'`)
  })

  it('the home-screen label is the one deliberate short form, mirrored in both places', () => {
    expect(manifest.short_name).toBe(HOME_SCREEN_NAME)
    expect(attr(html, /<meta name="apple-mobile-web-app-title" content="([^"]*)"/)).toBe(
      HOME_SCREEN_NAME,
    )
    expect(HOME_SCREEN_NAME.length).toBeLessThanOrEqual(HOME_SCREEN_MAX)
  })

  it('no mashed short form leaks into anything a player reads', () => {
    for (const file of [
      'index.html',
      'public/manifest.webmanifest',
      'capacitor.config.ts',
      'src/components/InstallNudge.tsx',
      'src/screens/GameOverScreen.tsx',
      'src/screens/RunCompleteScreen.tsx',
      'src/screens/DailyResultScreen.tsx',
    ]) {
      expect(repoText(file), file).not.toMatch(/CorpClimb/i)
    }
  })
})
