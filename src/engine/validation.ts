/** Save data crosses a trust boundary even when it only lives on this device. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function owns(table: object, key: unknown): boolean {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key)
}
