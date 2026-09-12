import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getSpriteUrls } from '@/components/PixelSprite'
import { PLAYER_CLASSES, TYPE_COLORS, getBestAscension } from '@/data'
import { getDailyStreak, hasPlayedToday } from '@/daily'
import { getLifetimeStats } from '@/history'
import {
  KONAMI_SEQUENCE,
  SIGN_TAPS_REQUIRED,
  advanceKonami,
  hasGoldenBadge,
  markGoldenBadgeFound,
} from '@/konami'
import {
  COFFEE_THANKS_TOAST,
  COFFEE_TIP_LABEL,
  coffeePaymentUrl,
  hasCoffeeThanksQuery,
  stripCoffeeThanksQuery,
} from '@/config/tip'
import { SFX } from '@/sfx'
import { Button } from '@/ui'
import type { ClassId } from '@/types'
import styles from './TitleScreen.module.css'

const CONFETTI_GLYPHS = ['💰', '🪪', '📈', '☕', '📎', '💼']

/** Backdrop skyline: the phone canvas shows the nine centre blocks; the
 *  desktop canvas (`@container stage (min-width: 700px)`) also reveals
 *  eight more either side so the city runs the full 840px width instead of
 *  stopping at a 212px huddle. Order is left → right.
 *
 *  The city is a footer silhouette under the deck, not a third stage: the
 *  tower profile is kept but drawn at SKYLINE_SCALE so the tallest near
 *  block is ~78px and the whole band stays within ~12% of the stage. */
const SKYLINE_SCALE = 0.66
const tower = (h: number) => Math.round(h * SKYLINE_SCALE)
const SKYLINE_CORE = [64, 104, 78, 118, 86, 96, 70, 112, 82].map(tower)
const SKYLINE_WING_LEFT = [58, 90, 66, 108, 74, 96, 60, 100].map(tower)
const SKYLINE_WING_RIGHT = [94, 62, 106, 72, 88, 58, 98, 68].map(tower)
const SKYLINE: ReadonlyArray<{ h: number; wing: boolean }> = [
  ...SKYLINE_WING_LEFT.map((h) => ({ h, wing: true })),
  ...SKYLINE_CORE.map((h) => ({ h, wing: false })),
  ...SKYLINE_WING_RIGHT.map((h) => ({ h, wing: true })),
]

/** A second, farther row of towers half a block out of phase with the
 *  near row: shorter, dimmer, unlit. Gives the city depth so the bottom of
 *  the stage reads as a skyline rather than a comb of nine blocks. */
const SKYLINE_FAR: ReadonlyArray<{ h: number; wing: boolean }> = [
  ...[72, 118, 84, 130, 96, 108, 78, 124].map((h) => ({ h: tower(h), wing: true })),
  ...[110, 136, 122, 150, 128, 142, 116, 146, 132, 120].map((h) => ({ h: tower(h), wing: false })),
  ...[104, 126, 90, 138, 98, 116, 82, 110].map((h) => ({ h: tower(h), wing: true })),
]

/** The three lead roles, in the order they stand on the lobby floor:
 *  the engineer takes the centre plate. Role captions are short on purpose
 *  — the badge frame is 96px wide on a phone. */
const CAST: ReadonlyArray<{ id: ClassId; role: string; lead?: boolean }> = [
  { id: 'pm', role: 'PRODUCT' },
  { id: 'eng', role: 'ENGINEER', lead: true },
  { id: 'design', role: 'DESIGN' },
]

export default function TitleScreen({
  onStart,
  onContinue,
  onDaily,
  onCodex,
  onOffice,
  officeStatus,
}: {
  onStart: () => void
  onContinue?: () => void
  onDaily: () => void
  onCodex: () => void
  onOffice?: () => void
  /** One-line campaign summary under THE OFFICE when a save exists. */
  officeStatus?: string
}) {
  const [confirmNew, setConfirmNew] = useState(false)
  const [goldenBadge, setGoldenBadge] = useState(hasGoldenBadge)
  const [celebrating, setCelebrating] = useState(false)
  const [coffeeThanks, setCoffeeThanks] = useState(
    () => typeof window !== 'undefined' && hasCoffeeThanksQuery(window.location.search),
  )
  const tipUrl = coffeePaymentUrl()
  const konamiProgress = useRef(0)
  const signTaps = useRef(0)
  const sprites = getSpriteUrls()
  const streak = getDailyStreak()
  const playedToday = hasPlayedToday()
  const lifetime = getLifetimeStats()
  const bestReorg = getBestAscension()

  const unlockGoldenBadge = () => {
    markGoldenBadgeFound()
    setGoldenBadge(true)
    setCelebrating(true)
    SFX.fanfare()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      konamiProgress.current = advanceKonami(konamiProgress.current, e.key)
      if (konamiProgress.current >= KONAMI_SEQUENCE.length) {
        konamiProgress.current = 0
        unlockGoldenBadge()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(() => setCelebrating(false), 4200)
    return () => window.clearTimeout(timer)
  }, [celebrating])

  useEffect(() => {
    if (!coffeeThanks) return
    stripCoffeeThanksQuery()
    const timer = window.setTimeout(() => setCoffeeThanks(false), 4200)
    return () => window.clearTimeout(timer)
  }, [coffeeThanks])

  // Touch players can't type the code — tapping the floor sign works too.
  const handleSignTap = () => {
    signTaps.current += 1
    if (signTaps.current >= SIGN_TAPS_REQUIRED) {
      signTaps.current = 0
      unlockGoldenBadge()
    } else if (signTaps.current >= 3) {
      SFX.menuSelect() // a little "keep going" wink
    }
  }

  // Starting over with a save in place erases it — make that explicit.
  const handleStart = () => {
    if (onContinue && !confirmNew) {
      setConfirmNew(true)
      return
    }
    onStart()
  }

  const hasStats = streak.current > 0 || lifetime.bestFloor > 0 || goldenBadge

  return (
    <div className={styles.screen}>
      {/* Field: one warm light pool behind the cast on the night-lobby ground. */}
      <div aria-hidden="true" className={styles.field} />

      <div
        aria-hidden="true"
        onPointerDown={handleSignTap}
        className={goldenBadge ? `${styles.sign} ${styles.signGolden}` : styles.sign}
      >
        {goldenBadge ? '▲ FLOOR 31' : '▲ FLOOR 30'}
      </div>

      <div className={styles.header}>
        <div className={`t-display ${styles.kicker}`}>
          <span>Q4 LADDER SIMULATION</span>
        </div>
        <h1 className={`t-display ${styles.wordmark}`}>
          <span className={styles.wordmarkLine}>CORPORATE</span>{' '}
          <span className={styles.wordmarkLine}>CLIMB</span>
        </h1>
        <div className={`t-body ${styles.tagline}`}>
          Reception to the board. One badge swipe from glory.
        </div>
        <div className={`t-body ${styles.lede}`}>
          Pick a role, work the floor, build your team, and{' '}
          <span className={styles.nowrap}>out-battle</span> every manager between you and the board.
        </div>
      </div>

      <div className={styles.cast}>
        <div aria-hidden="true" className={styles.floor} />
        {CAST.map(({ id, role, lead }) => {
          const cls = PLAYER_CLASSES.find((c) => c.id === id)
          if (!cls) return null
          const accent = lead ? 'var(--cc-gold)' : (TYPE_COLORS[cls.types[0]] ?? TYPE_COLORS.normal)
          return (
            <figure
              key={id}
              className={lead ? `${styles.plate} ${styles.plateLead}` : styles.plate}
              style={{ '--plate-accent': accent } as CSSProperties}
            >
              <div className={`sprite-idle ${styles.plateArt}`}>
                <img src={sprites[cls.spriteId]} alt="" draggable={false} />
              </div>
              <figcaption className={`t-display ${styles.plateRole}`}>{role}</figcaption>
            </figure>
          )
        })}
      </div>

      <div className={styles.deck}>
        {onOffice && (
          <div className={styles.mode}>
            <span
              id="office-campaign-label"
              className={`t-display ${styles.eyebrow} ${styles.eyebrowHero}`}
            >
              <span>CAMPAIGN · FLOORS 1–5</span>
            </span>
            <Button
              variant="primary"
              size="lg"
              onClick={onOffice}
              className={styles.hero}
              aria-describedby="office-campaign-label"
            >
              THE OFFICE
            </Button>
            {officeStatus && <span className={`t-body ${styles.status}`}>{officeStatus}</span>}
          </div>
        )}

        {confirmNew ? (
          <div className={styles.confirm}>
            <div className={`t-body ${styles.confirmText}`}>
              Start over? Your saved Classic climb will be erased.
            </div>
            <div className={styles.row}>
              <Button variant="accent" size="md" onClick={onStart}>
                ERASE &amp; START
              </Button>
              <Button variant="secondary" size="md" onClick={() => setConfirmNew(false)}>
                KEEP SAVE
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.mode}>
            <span id="classic-climb-label" className={`t-display ${styles.eyebrow}`}>
              <span>CLASSIC · 30 FLOORS</span>
            </span>
            {onContinue ? (
              <div className={styles.row}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onContinue}
                  className={styles.classic}
                  aria-describedby="classic-climb-label"
                >
                  CONTINUE
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleStart}
                  className={`${styles.classic} ${styles.newClimb}`}
                  aria-describedby="classic-climb-label"
                >
                  NEW CLIMB
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={handleStart}
                className={`${styles.classic} ${styles.classicSolo}`}
                aria-describedby="classic-climb-label"
              >
                START CLIMB
              </Button>
            )}
          </div>
        )}

        <div className={styles.utility}>
          <Button variant="accent" size="sm" onClick={onDaily} className={styles.daily}>
            DAILY CHALLENGE
          </Button>
          <Button variant="ghost" size="sm" onClick={onCodex} className={styles.codex}>
            CODEX
          </Button>
        </div>

        {tipUrl ? (
          <button
            type="button"
            className={styles.tip}
            onClick={() => window.open(tipUrl, '_blank', 'noopener,noreferrer')}
          >
            {COFFEE_TIP_LABEL}
          </button>
        ) : null}

        {hasStats && (
          <div className={`t-body ${styles.stats}`}>
            {streak.current > 0 && (
              <span>
                {streak.current}-day streak{playedToday ? ' ✓' : ''}
              </span>
            )}
            {lifetime.bestFloor > 0 && <span>Best: Floor {lifetime.bestFloor}</span>}
            {bestReorg > 0 && <span>Re-Org {bestReorg}</span>}
            {goldenBadge && <span className={styles.statsGolden}>Golden Badge</span>}
          </div>
        )}
      </div>

      <div aria-hidden="true" className={styles.skyline}>
        <div className={`${styles.skylineRow} ${styles.skylineFar}`}>
          {SKYLINE_FAR.map(({ h, wing }, i) => (
            <div
              key={i}
              className={wing ? `${styles.tower} ${styles.skylineWing}` : styles.tower}
              style={{ height: h }}
            />
          ))}
        </div>
        <div className={`${styles.skylineRow} ${styles.skylineNear}`}>
          {SKYLINE.map(({ h, wing }, i) => (
            <div
              key={i}
              className={wing ? `${styles.tower} ${styles.skylineWing}` : styles.tower}
              style={{ height: h }}
            >
              {Array.from({ length: Math.floor(h / 15) }).map((_, j) => (
                <span
                  key={j}
                  className={
                    // Indexed from the first core block so the phone's lit
                    // windows land exactly where they always have.
                    (i - SKYLINE_WING_LEFT.length + j) % 3 === 0
                      ? `${styles.window} ${styles.windowLit}`
                      : styles.window
                  }
                  style={{ top: 8 + j * 15 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {celebrating && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${(i * 37) % 96}%`,
                top: -28,
                fontSize: 14 + ((i * 7) % 12),
                animation: `confetti ${2.2 + (i % 4) * 0.4}s ease-in ${i * 0.06}s forwards`,
                opacity: 0,
              }}
            >
              {CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length]}
            </span>
          ))}
        </div>
      )}

      {coffeeThanks && (
        <div role="status" className={styles.tipToast}>
          {COFFEE_THANKS_TOAST}
        </div>
      )}

      {celebrating && (
        <div role="status" className={styles.celebration}>
          <div className={`t-display ${styles.celebrationTitle}`}>🪪 GOLDEN BADGE ACQUIRED</div>
          <div className={`t-body ${styles.celebrationBody}`}>
            Executive elevator access granted. The board will remember this.
          </div>
        </div>
      )}
    </div>
  )
}
