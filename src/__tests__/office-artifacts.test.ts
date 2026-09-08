// @vitest-environment node
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs')>()),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

const preferred = '/opt/cursor/artifacts/e2e-full-climb'
const fallback = path.join('test-results', 'e2e-full-climb')
const denied = Object.assign(new Error('Permission denied'), { code: 'EACCES' })

beforeEach(() => {
  vi.resetModules()
  vi.mocked(mkdirSync).mockReset()
  vi.mocked(writeFileSync).mockReset()
  vi.stubEnv('PLAYTEST_ARTIFACT_DIR', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Office artifact directory selection', () => {
  it('uses a writable environment override first', async () => {
    vi.stubEnv('PLAYTEST_ARTIFACT_DIR', 'custom-artifacts')
    const { ARTIFACT_DIR } = await import('../../e2e/office-helpers')

    expect(ARTIFACT_DIR).toBe('custom-artifacts')
    expect(mkdirSync).toHaveBeenCalledTimes(1)
    expect(writeFileSync).toHaveBeenCalledWith(path.join(ARTIFACT_DIR, '.writable'), 'ok')
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('tries the preferred directory when the environment directory cannot be created', async () => {
    vi.stubEnv('PLAYTEST_ARTIFACT_DIR', 'custom-artifacts')
    vi.mocked(mkdirSync).mockImplementationOnce(() => {
      throw denied
    })
    const { ARTIFACT_DIR } = await import('../../e2e/office-helpers')

    expect(ARTIFACT_DIR).toBe(preferred)
    expect(mkdirSync).toHaveBeenNthCalledWith(2, preferred, { recursive: true })
    expect(console.warn).toHaveBeenCalledWith(
      '[climb] Artifact directory unavailable: custom-artifacts',
      denied,
    )
  })

  it('probes the local fallback when the override and preferred directory reject writes', async () => {
    vi.stubEnv('PLAYTEST_ARTIFACT_DIR', 'custom-artifacts')
    vi.mocked(writeFileSync).mockImplementation((file) => {
      if (file !== path.join(fallback, '.writable')) throw denied
    })
    const { ARTIFACT_DIR } = await import('../../e2e/office-helpers')

    expect(ARTIFACT_DIR).toBe(fallback)
    expect(mkdirSync).toHaveBeenCalledTimes(3)
    expect(writeFileSync).toHaveBeenNthCalledWith(3, path.join(fallback, '.writable'), 'ok')
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('tries preferred then fallback without an override', async () => {
    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw denied
    })
    const { ARTIFACT_DIR } = await import('../../e2e/office-helpers')

    expect(ARTIFACT_DIR).toBe(fallback)
    expect(mkdirSync).toHaveBeenNthCalledWith(1, preferred, { recursive: true })
    expect(mkdirSync).toHaveBeenNthCalledWith(2, fallback, { recursive: true })
  })

  it('warns for every failed candidate and keeps logging nonfatal if none are writable', async () => {
    vi.stubEnv('PLAYTEST_ARTIFACT_DIR', 'custom-artifacts')
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw denied
    })
    const { ARTIFACT_DIR, writeClimbLog } = await import('../../e2e/office-helpers')

    expect(ARTIFACT_DIR).toBe(fallback)
    expect(console.warn).toHaveBeenCalledTimes(3)
    expect(() => writeClimbLog()).not.toThrow()
    expect(console.warn).toHaveBeenLastCalledWith(
      `[climb] Could not write climb log: ${path.join(fallback, 'beats.log')}`,
      denied,
    )
  })
})
