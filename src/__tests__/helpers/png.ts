import { inflateSync } from 'node:zlib'
import { expect } from 'vitest'

/**
 * Minimal decoder for 8-bit RGB / RGBA non-interlaced PNGs (what Chromium
 * writes), so asset guards can sample pixels without a native image lib.
 */

export type Rgb = readonly [number, number, number]

export function decodePng(buf: Buffer): {
  w: number
  h: number
  at: (x: number, y: number) => Rgb
} {
  expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  expect(buf[24], 'bit depth').toBe(8)
  const colorType = buf[25]
  expect([2, 6], 'RGB or RGBA').toContain(colorType)
  expect(buf[28], 'non-interlaced').toBe(0)
  const bpp = colorType === 6 ? 4 : 3
  const idat: Buffer[] = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('latin1', off + 4, off + 8)
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * bpp
  const px = Buffer.alloc(stride * h)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const out = px.subarray(y * stride, (y + 1) * stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      let v = line[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[i] = v & 0xff
    }
    prev = out
  }
  return {
    w,
    h,
    at: (x, y) => {
      const i = y * stride + x * bpp
      return [px[i], px[i + 1], px[i + 2]]
    },
  }
}

export const hexToRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

export const near = (a: Rgb, b: Rgb, tol = 2) => a.every((v, i) => Math.abs(v - b[i]) <= tol)
