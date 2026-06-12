// ─── DAILY LEADERBOARD API ──────────────────────────────────
// Vercel serverless function backed by Upstash Redis (Vercel KV).
// Deliberately dependency-free: talks to the Upstash REST API with
// fetch. Returns 503 until the store is provisioned (set
// KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/TOKEN),
// and the game client hides the leaderboard on any failure.
//
// Anti-cheat posture: tamper-DETERRENT, not tamper-proof. Scores are
// client-computed, so the server enforces plausibility only: the seed
// must be today-ish (UTC ±1 day), values are bounded and sanitized,
// and submissions are IP rate-limited. Good enough for a friendly
// daily board; not for prize money.

const MAX_SCORE = 8000
const MAX_FLOORS = 15
const MAX_NAME = 12
const TOP_N = 50
const KEEP_N = 100
const SUBMITS_PER_IP_PER_DAY = 20
const KEY_TTL_SECONDS = 8 * 24 * 60 * 60
const SEP = '\u0001'

function store() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return {
    async cmd(...parts) {
      const res = await fetch(`${url}/${parts.map(encodeURIComponent).join('/')}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`kv ${res.status}`)
      return (await res.json()).result
    },
  }
}

function utcSeed(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
}

/** The seed is player-local YYYYMMDD; accept the UTC day ±1. */
function seedIsCurrent(seed) {
  return [utcSeed(-1), utcSeed(0), utcSeed(1)].includes(seed)
}

function sanitizeName(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .slice(0, MAX_NAME)
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  return (Array.isArray(fwd) ? fwd[0] : fwd || 'unknown').split(',')[0].trim()
}

export default async function handler(req, res) {
  const kv = store()
  if (!kv) {
    res.status(503).json({ error: 'leaderboard not configured' })
    return
  }

  try {
    if (req.method === 'GET') {
      const seed = Number(req.query.seed)
      if (!Number.isInteger(seed) || seed < 20200101) {
        res.status(400).json({ error: 'bad seed' })
        return
      }
      // [member, score, member, score, ...] descending.
      const flat = await kv.cmd(
        'ZRANGE',
        `daily:${seed}`,
        '0',
        String(TOP_N - 1),
        'REV',
        'WITHSCORES',
      )
      const entries = []
      for (let i = 0; i + 1 < flat.length; i += 2) {
        const [name, classId, floors, won] = String(flat[i]).split(SEP)
        entries.push({
          name: sanitizeName(name),
          classId: ['pm', 'eng', 'design'].includes(classId) ? classId : 'pm',
          floorsCleared: Math.min(MAX_FLOORS, Math.max(0, Number(floors) || 0)),
          won: won === '1',
          score: Math.max(0, Math.floor(Number(flat[i + 1]) || 0)),
        })
      }
      res.setHeader('cache-control', 's-maxage=30, stale-while-revalidate=60')
      res.status(200).json({ entries })
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
      const seed = Number(body.seed)
      const name = sanitizeName(body.name)
      const score = Number(body.score)
      const floors = Number(body.floorsCleared)
      const classId = String(body.classId)

      const valid =
        seedIsCurrent(seed) &&
        name.length > 0 &&
        ['pm', 'eng', 'design'].includes(classId) &&
        Number.isInteger(floors) &&
        floors >= 0 &&
        floors <= MAX_FLOORS &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= MAX_SCORE
      if (!valid) {
        res.status(400).json({ error: 'implausible submission' })
        return
      }

      const rateKey = `rate:${seed}:${clientIp(req)}`
      const count = await kv.cmd('INCR', rateKey)
      if (count === 1) await kv.cmd('EXPIRE', rateKey, String(KEY_TTL_SECONDS))
      if (count > SUBMITS_PER_IP_PER_DAY) {
        res.status(429).json({ error: 'rate limited' })
        return
      }

      const key = `daily:${seed}`
      const member = [name, classId, floors, body.won ? '1' : '0', Date.now() % 100000].join(SEP)
      await kv.cmd('ZADD', key, String(score), member)
      await kv.cmd('EXPIRE', key, String(KEY_TTL_SECONDS))
      // Keep the set bounded: drop everything below the top KEEP_N.
      await kv.cmd('ZREMRANGEBYRANK', key, '0', String(-KEEP_N - 1))
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  } catch {
    res.status(502).json({ error: 'storage unavailable' })
  }
}
