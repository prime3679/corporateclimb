declare module 'node:child_process' {
  export interface SpawnSyncOptions {
    cwd?: string
    encoding?: string
    env?: Record<string, string | undefined>
  }

  export interface SpawnSyncReturns<T> {
    status: number | null
    stdout: T
    stderr: T
    error?: Error
  }

  export function spawnSync(
    command: string,
    args?: string[],
    options?: SpawnSyncOptions,
  ): SpawnSyncReturns<string>
}

declare module 'node:crypto' {
  export interface Hash {
    update(data: unknown): Hash
    digest(encoding: string): string
  }

  export function createHash(algorithm: string): Hash
}

declare module 'node:fs' {
  export function existsSync(path: string): boolean
  export function mkdtempSync(prefix: string): string
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void
  export function readFileSync(path: string): unknown
  export function readFileSync(path: string, encoding: string): string
  export function readdirSync(path: string): string[]
  export function rmSync(path: string, options?: { force?: boolean; recursive?: boolean }): void
  export function writeFileSync(path: string, data: string): void
}

declare module 'node:os' {
  export function tmpdir(): string
}

declare module 'node:path' {
  export function join(...parts: string[]): string
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined
  }
}

declare const process: {
  cwd(): string
  env: NodeJS.ProcessEnv
}
