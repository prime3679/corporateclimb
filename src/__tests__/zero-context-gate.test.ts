import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()
const gatePath = join(repoRoot, '.agent', 'zero_context_gate.py')
const tempRoots: string[] = []

function makeTempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'cc-zero-context-'))
  tempRoots.push(root)
  mkdirSync(join(root, '.agent'), { recursive: true })
  mkdirSync(join(root, 'docs'), { recursive: true })
  writeFileSync(join(root, 'AGENTS.md'), '# Agent Guide\n')
  writeFileSync(join(root, 'REVIEW.md'), '# Review Rules\n')
  writeFileSync(join(root, 'CLAUDE.md'), '# Claude\n')
  writeFileSync(join(root, 'README.md'), '# Readme\n')
  writeFileSync(join(root, 'docs', 'ZERO-CONTEXT-CONTRIBUTION.md'), '# Zero Context\n')
  writeFileSync(join(root, '.agent', 'zero_context_gate.py'), '# vendored elsewhere\n')
  return root
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2))
}

function baseContract(commands: Array<Record<string, unknown>>) {
  return {
    version: 1,
    repo: 'fixture',
    canonical_doctrine: 'docs/ZERO-CONTEXT-CONTRIBUTION.md',
    source_of_truth: [
      'docs/ZERO-CONTEXT-CONTRIBUTION.md',
      '.agent/contribution-contract.json',
      'CLAUDE.md',
      'AGENTS.md',
      'REVIEW.md',
      'README.md',
    ],
    required_files: [
      'AGENTS.md',
      'REVIEW.md',
      'CLAUDE.md',
      'docs/ZERO-CONTEXT-CONTRIBUTION.md',
      '.agent/contribution-contract.json',
      '.agent/zero_context_gate.py',
    ],
    boundaries: {
      portable_paths: ['.agent/', 'docs/', 'AGENTS.md', 'REVIEW.md', 'README.md', 'CLAUDE.md'],
      protected_paths: ['dist/', 'node_modules/'],
      forbidden_actions: [
        'Do not use shell-inline or inline-code verification commands.',
        'Do not execute install or deploy commands through the contract.',
      ],
    },
    review: {
      rules: ['Report findings first.'],
      classification: {
        one_off_judgment: 'Keep one-off judgment in the review itself.',
        repeatable_defect: 'Promote repeatable defects into tests, lint rules, or CI.',
        missing_domain_knowledge:
          'Promote missing domain knowledge into canonical docs or a reusable skill.',
        agent_behavior_failure: 'Promote agent behavior failures into operating evals.',
      },
    },
    escalate_if: ['Verification requires installs or secrets.'],
    verification: {
      commands,
    },
  }
}

function runGate(args: string[], repoRootOverride = repoRoot, env?: NodeJS.ProcessEnv) {
  const result = spawnSync('python3', [gatePath, ...args, '--repo-root', repoRootOverride], {
    cwd: repoRoot,
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  })
  if (result.error) throw result.error
  return result
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { force: true, recursive: true })
})

describe('zero context gate', () => {
  it('audits the real repo contract successfully', () => {
    const result = runGate(['audit', '--json'])
    expect(result.status).toBe(0)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(true)
    expect(payload.audit.canonical_doctrine).toBe('docs/ZERO-CONTEXT-CONTRIBUTION.md')
    expect(payload.audit.commands.map((command: { id: string }) => command.id)).toEqual([
      'lint',
      'format-check',
      'build',
      'unit-tests',
      'playwright-smoke',
    ])
  })

  it('verifies a safe argv-only fixture and emits JSON results', () => {
    const tempRepo = makeTempRepo()
    mkdirSync(join(tempRepo, 'tools'))
    writeFileSync(
      join(tempRepo, 'tools', 'check_env.py'),
      ['import os', "assert os.environ.get('SHOULD_NOT_LEAK') is None", "print('fixture-ok')"].join(
        '\n',
      ),
    )
    writeJson(
      join(tempRepo, '.agent', 'contribution-contract.json'),
      baseContract([
        {
          id: 'fixture-pass',
          cwd: '.',
          argv: ['python3', 'tools/check_env.py'],
          timeout_seconds: 5,
          output_limit_bytes: 4096,
        },
      ]),
    )

    const result = runGate(['verify', '--json'], tempRepo, { SHOULD_NOT_LEAK: '1' })
    expect(result.status).toBe(0)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(true)
    expect(payload.commands).toHaveLength(1)
    expect(payload.commands[0]).toMatchObject({
      id: 'fixture-pass',
      ok: true,
      stdout: 'fixture-ok\n',
      timed_out: false,
    })
  })

  it('fails closed on malformed contract JSON', () => {
    const tempRepo = makeTempRepo()
    writeFileSync(join(tempRepo, '.agent', 'contribution-contract.json'), '{not-json')

    const result = runGate(['audit', '--json'], tempRepo)
    expect(result.status).toBe(1)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(false)
    expect(payload.errors[0]).toMatch(/malformed/i)
  })

  it('rejects shell-inline verification commands during audit', () => {
    const tempRepo = makeTempRepo()
    writeJson(
      join(tempRepo, '.agent', 'contribution-contract.json'),
      baseContract([
        {
          id: 'unsafe',
          cwd: '.',
          argv: ['bash', '-c', 'echo nope'],
        },
      ]),
    )

    const result = runGate(['audit', '--json'], tempRepo)
    expect(result.status).toBe(1)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(false)
    expect(payload.errors.join('\n')).toMatch(/shell-inline execution/)
  })

  it('fails closed when a verify command exits non-zero', () => {
    const tempRepo = makeTempRepo()
    mkdirSync(join(tempRepo, 'tools'))
    writeFileSync(join(tempRepo, 'tools', 'fail.py'), 'raise SystemExit(7)\n')
    writeJson(
      join(tempRepo, '.agent', 'contribution-contract.json'),
      baseContract([
        {
          id: 'fixture-fail',
          cwd: '.',
          argv: ['python3', 'tools/fail.py'],
          timeout_seconds: 5,
        },
      ]),
    )

    const result = runGate(['verify', '--json'], tempRepo)
    expect(result.status).toBe(1)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(false)
    expect(payload.errors.join('\n')).toMatch(/exit code 7/)
    expect(payload.commands[0]).toMatchObject({
      id: 'fixture-fail',
      ok: false,
      returncode: 7,
    })
  })
})
