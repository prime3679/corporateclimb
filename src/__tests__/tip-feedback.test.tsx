import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPanel from '@/components/SettingsPanel'
import {
  COFFEE_THANKS_TOAST,
  COFFEE_TIP_LABEL,
  FEEDBACK_HELPER,
  FEEDBACK_ISSUES_URL,
  FEEDBACK_LABEL,
  coffeePaymentUrl,
  hasCoffeeThanksQuery,
} from '@/config/tip'
import TitleScreen from '@/screens/TitleScreen'
import { DEFAULT_SETTINGS } from '@/settings'

const tipState = vi.hoisted(() => ({ url: '' }))

vi.mock('@/config/tip', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/tip')>()
  return {
    ...actual,
    coffeePaymentUrl: (env?: { VITE_COFFEE_PAYMENT_URL?: string }) =>
      env ? actual.coffeePaymentUrl(env) : tipState.url,
    get COFFEE_PAYMENT_URL() {
      return tipState.url
    },
  }
})

const repoText = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts)).toString('utf8')

let container: HTMLDivElement | null = null
let root: Root | null = null

async function mount(node: ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(node)
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

function titleProps() {
  return {
    onStart: () => {},
    onDaily: () => {},
    onCodex: () => {},
    onOffice: () => {},
  }
}

beforeEach(() => {
  tipState.url = ''
  window.history.replaceState(null, '', '/')
})

afterEach(async () => {
  await unmount()
})

describe('coffeePaymentUrl', () => {
  it('is empty when VITE_COFFEE_PAYMENT_URL is unset or blank', () => {
    expect(coffeePaymentUrl({})).toBe('')
    expect(coffeePaymentUrl({ VITE_COFFEE_PAYMENT_URL: '' })).toBe('')
    expect(coffeePaymentUrl({ VITE_COFFEE_PAYMENT_URL: '   ' })).toBe('')
  })

  it('trims VITE_COFFEE_PAYMENT_URL when set in test', () => {
    expect(coffeePaymentUrl({ VITE_COFFEE_PAYMENT_URL: ' https://pay.example/coffee ' })).toBe(
      'https://pay.example/coffee',
    )
  })

  it('recognizes the same-origin coffee thanks query', () => {
    expect(hasCoffeeThanksQuery('?coffee=thanks')).toBe(true)
    expect(hasCoffeeThanksQuery('coffee=thanks')).toBe(true)
    expect(hasCoffeeThanksQuery('?coffee=nope')).toBe(false)
    expect(hasCoffeeThanksQuery('')).toBe(false)
  })
})

describe('Title coffee tip', () => {
  it('hides the tip CTA when the payment URL is unset', async () => {
    tipState.url = ''
    await mount(<TitleScreen {...titleProps()} />)
    expect(container!.textContent).not.toContain(COFFEE_TIP_LABEL)
  })

  it('shows the exact tip copy when VITE_COFFEE_PAYMENT_URL is set', async () => {
    tipState.url = 'https://pay.example/coffee'
    await mount(<TitleScreen {...titleProps()} />)
    const tip = [...container!.querySelectorAll('button')].find(
      (el) => el.textContent === COFFEE_TIP_LABEL,
    )
    expect(tip).toBeDefined()
    expect(tip!.textContent).toBe('Buy the intern a coffee — $5')
  })

  it('opens the payment URL in a new tab', async () => {
    tipState.url = 'https://pay.example/coffee'
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await mount(<TitleScreen {...titleProps()} />)
    const tip = [...container!.querySelectorAll('button')].find(
      (el) => el.textContent === COFFEE_TIP_LABEL,
    )
    await act(async () => {
      tip!.click()
    })
    expect(open).toHaveBeenCalledWith('https://pay.example/coffee', '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })

  it('toasts the thanks line on ?coffee=thanks', async () => {
    window.history.replaceState(null, '', '/?coffee=thanks')
    await mount(<TitleScreen {...titleProps()} />)
    expect(container!.textContent).toContain(COFFEE_THANKS_TOAST)
    expect(container!.textContent).toContain('Thanks — the intern’s fueled. Keep climbing.')
  })

  it('has no season-pass UI', async () => {
    tipState.url = 'https://pay.example/coffee'
    await mount(<TitleScreen {...titleProps()} />)
    expect(container!.textContent).not.toMatch(/season\s*pass/i)
    expect(repoText('src/screens/TitleScreen.tsx')).not.toMatch(/season\s*pass/i)
    expect(repoText('src/components/SettingsPanel.tsx')).not.toMatch(/season\s*pass/i)
  })
})

describe('Settings feedback drop', () => {
  it('renders Send feedback with the captain helper and chooser href', async () => {
    await mount(
      <SettingsPanel settings={DEFAULT_SETTINGS} onChange={() => {}} onClose={() => {}} />,
    )
    const link = container!.querySelector(`a[href="${FEEDBACK_ISSUES_URL}"]`)
    expect(link).not.toBeNull()
    expect(link!.textContent).toBe(FEEDBACK_LABEL)
    expect(link!.textContent).toBe('Send feedback')
    expect(link!.getAttribute('target')).toBe('_blank')
    expect(link!.getAttribute('rel')).toMatch(/noopener/)
    expect(container!.textContent).toContain(FEEDBACK_HELPER)
    expect(container!.textContent).toContain(
      'Bugs, ideas, or a quick note — it goes straight to the captain.',
    )
  })
})

describe('GitHub issue forms', () => {
  const forbidden = /Phase A|thermometer|side-scroller|contact us|report an issue/i

  it('ships the three chooser forms and keeps blank issues on', () => {
    const config = repoText('.github/ISSUE_TEMPLATE/config.yml')
    const bug = repoText('.github/ISSUE_TEMPLATE/bug.yml')
    const idea = repoText('.github/ISSUE_TEMPLATE/idea.yml')
    const feedback = repoText('.github/ISSUE_TEMPLATE/feedback.yml')
    expect(config).toMatch(/blank_issues_enabled:\s*true/)
    expect(bug).toContain('name: Bug report')
    expect(idea).toContain('name: Idea / feature')
    expect(feedback).toContain('name: General feedback')
    for (const text of [config, bug, idea, feedback]) {
      expect(text).not.toMatch(forbidden)
    }
  })
})
