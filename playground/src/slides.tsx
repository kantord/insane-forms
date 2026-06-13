import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/* The slideshow is a TREE:
 *
 *   ScrollyBlock (region root) — a self-contained scrollytelling region; a
 *     page may hold several, interleaved with free-flowing content. It OWNS
 *     the region's state and logic: active-unit tracking, prev/next + dots
 *     rail, wizard navigation, settled hash sync. Native scroll is only ever
 *     observed, never intercepted.
 *   Sequence (group node) — owns the biome (token scope) and the entry axis
 *     for its child slides (transitions are a GROUP concern, never per-slide).
 *   Slide (leaf) / screen units — one fixed layout each; exactly one viewport
 *     (h-svh, clipped); content adapts to the card, never the reverse.
 *   Slot layouts (Duplex, Stack) — fixed splits usable inside a slide OR in
 *     plain flow; slots clip on BOTH axes and may nest further slot layouts.
 */

export type Biome = 'bureau' | 'terminal' | 'meadow'
export type Axis = 'x' | 'y' | 'none'
export type SlideLayout = 'statement' | 'fill'

/** Group node: scopes design tokens and owns its children's transition axis. */
export const Sequence = ({
  biome,
  axis = 'y',
  children,
}: {
  biome: Biome
  axis?: Axis
  children: ReactNode
}) => (
  <div className={`biome-${biome}`} data-axis={axis}>
    {children}
  </div>
)

/** Leaf node: one viewport, fixed. `statement` centers a text measure;
 * `fill` hands the full fixed area to a slot layout. */
export const Slide = ({
  refCb,
  id,
  layout = 'statement',
  children,
}: {
  refCb?: (el: HTMLElement | null) => void
  id: string
  layout?: SlideLayout
  children: ReactNode
}) => (
  <section
    ref={refCb}
    id={id}
    className="slide screen relative h-svh w-full overflow-clip bg-paper text-ink"
  >
    <div
      className={`slide-content mx-auto flex h-full max-w-[1180px] flex-col px-6 py-12 ${
        layout === 'statement' ? 'justify-center' : ''
      }`}
    >
      {children}
    </div>
    {/* per-unit progress — fills as you scroll through this screen */}
    <div className="screen-progress" aria-hidden="true">
      <span />
    </div>
  </section>
)

/** Fixed two-pane split (side-by-side on lg, stacked rows below). Slots clip
 * and scroll internally; give the wrapper an explicit height in flow. */
export const Duplex = ({
  className = '',
  left,
  right,
}: {
  className?: string
  left: ReactNode
  right: ReactNode
}) => (
  <div
    className={`grid min-h-0 grid-cols-1 grid-rows-2 border border-ink lg:grid-cols-[1.15fr_1fr] lg:grid-rows-1 ${className}`}
  >
    <div className="flex min-h-0 min-w-0 flex-col overflow-clip">{left}</div>
    <div className="flex min-h-0 min-w-0 flex-col overflow-clip border-t border-ink lg:border-t-0 lg:border-l">
      {right}
    </div>
  </div>
)

/** Fixed vertical split — a sub-layout for slots (e.g. code over form). */
export const Stack = ({
  rows = '1fr 1fr',
  className = '',
  top,
  bottom,
}: {
  rows?: string
  className?: string
  top: ReactNode
  bottom: ReactNode
}) => (
  <div className={`grid min-h-0 gap-4 ${className}`} style={{ gridTemplateRows: rows }}>
    <div className="flex min-h-0 min-w-0 flex-col overflow-clip">{top}</div>
    <div className="flex min-h-0 min-w-0 flex-col overflow-clip">{bottom}</div>
  </div>
)

/* ---------------------------------------------------------------------- */
/* ScrollyBlock — the region root.                                         */
/* ---------------------------------------------------------------------- */

export const motionOffNow = () =>
  document.documentElement.classList.contains('no-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Wizard autoscroll: fast start, soft landing (easeOutQuart), duration
 * scaled by distance and capped — snappy but polished. Lands exactly on the
 * target, so proximity snap has nothing left to adjust. */
const smoothScrollTo = (top: number) => {
  if (motionOffNow()) {
    window.scrollTo({ top })
    return
  }
  const start = window.scrollY
  const distance = top - start
  if (distance === 0) return
  const duration = Math.min(650, Math.max(380, Math.abs(distance) * 0.45))
  const began = performance.now()
  const ease = (t: number) => 1 - (1 - t) ** 4
  const frame = (now: number) => {
    const progress = Math.min(1, (now - began) / duration)
    window.scrollTo(0, start + distance * ease(progress))
    if (progress < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

type ScrollyState = {
  index: number
  count: number
  atStart: boolean
  atEnd: boolean
  hasExit: boolean
  goTo: (index: number) => void
  next: () => void
  prev: () => void
}

const ScrollyContext = createContext<ScrollyState | null>(null)

/** Slides/steps consume this to render their own (locally styled) controls. */
export const useScrolly = () => useContext(ScrollyContext)

export const ScrollyBlock = ({
  units,
  exitId,
  children,
}: {
  units: string[]
  /** Where the last NEXT leads — the next header after the block, so users
   * are never trapped at the end of a slideshow. */
  exitId?: string
  children: ReactNode
}) => {
  const [index, setIndex] = useState(-1)
  const indexRef = useRef(-1)

  // Active-unit tracking: one observer per block lifetime.
  useEffect(() => {
    const elements = units.map((id) => document.getElementById(id))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = elements.indexOf(entry.target as HTMLElement)
          if (entry.intersectionRatio > 0.55) {
            if (indexRef.current !== i) {
              indexRef.current = i
              setIndex(i)
            }
          } else if (i === indexRef.current && entry.intersectionRatio < 0.2) {
            indexRef.current = -1
            setIndex(-1)
          }
        }
      },
      { threshold: [0.2, 0.55] },
    )
    for (const el of elements) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [units])

  // Settled hash sync for THIS block's units only (the block under the
  // viewport midpoint wins; blocks never fight because units are disjoint).
  useEffect(() => {
    const settle = () => {
      const mid = window.innerHeight / 2
      const id = units.find((unitId) => {
        const el = document.getElementById(unitId)
        if (!el) return false
        const rect = el.getBoundingClientRect()
        return rect.top <= mid && rect.bottom >= mid
      })
      if (id !== undefined && window.location.hash !== `#${id}`) {
        history.replaceState(null, '', `#${id}`)
      }
    }
    if ('onscrollend' in (window as object)) {
      window.addEventListener('scrollend', settle)
      return () => window.removeEventListener('scrollend', settle)
    }
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(settle, 150)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [units])

  const goTo = useCallback(
    (i: number) => {
      const id = units[Math.min(units.length - 1, Math.max(0, i))]
      const el = id === undefined ? null : document.getElementById(id)
      if (el) smoothScrollTo(el.getBoundingClientRect().top + window.scrollY)
    },
    [units],
  )

  // The active unit's biome class — so the fixed corner buttons render in
  // the LOCAL style while keeping a globally consistent position.
  const [unitBiome, setUnitBiome] = useState('')
  useEffect(() => {
    const id = units[index]
    if (id === undefined) return
    const host = document.getElementById(id)?.closest('[class*="biome-"]')
    const cls = host ? [...host.classList].find((c) => c.startsWith('biome-')) : undefined
    setUnitBiome(cls ?? '')
  }, [index, units])

  const state = useMemo<ScrollyState>(() => {
    const atEnd = index >= units.length - 1
    return {
      index,
      count: units.length,
      atStart: index <= 0,
      atEnd,
      hasExit: exitId !== undefined,
      goTo,
      next: () => {
        if (indexRef.current >= units.length - 1 && exitId !== undefined) {
          const el = document.getElementById(exitId)
          if (el) smoothScrollTo(el.getBoundingClientRect().top + window.scrollY)
          return
        }
        goTo(indexRef.current + 1)
      },
      prev: () => goTo(indexRef.current - 1),
    }
  }, [index, units.length, goTo, exitId])

  const exiting = state.atEnd && state.hasExit
  return (
    <ScrollyContext.Provider value={state}>
      {children}
      {/* wizard buttons: FIXED at the viewport's bottom corners — the position
          never moves, whatever the unit's internal layout (user decision).
          The wrapper carries the active unit's biome class, so the styling is
          still local. Visible only while one of this block's units is seated. */}
      <div
        className={`${unitBiome} pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between px-6 pb-6 transition-opacity duration-300 ${
          index === -1 ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          disabled={state.atStart || index === -1}
          onClick={state.prev}
          className="pointer-events-auto border border-dim bg-paper px-5 py-2 font-mono text-[0.78rem] uppercase tracking-[0.18em] text-dim transition-colors hover:border-pop hover:text-pop disabled:pointer-events-none disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          disabled={(state.atEnd && !state.hasExit) || index === -1}
          onClick={state.next}
          className="pointer-events-auto border border-ink bg-ink px-6 py-2 font-mono text-[0.78rem] font-bold uppercase tracking-[0.18em] text-paper transition-colors hover:border-pop hover:bg-pop disabled:pointer-events-none disabled:opacity-30"
        >
          {exiting ? 'Continue ↓' : 'Next'}
        </button>
      </div>
      {/* region rail: dots + prev/next, readable on any biome (blend), visible
          only while one of this block's units is seated */}
      <nav
        aria-label="Slides"
        className={`fixed top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col items-center gap-2 mix-blend-difference transition-opacity duration-300 ${
          index === -1 ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          aria-label="Previous slide"
          disabled={state.atStart}
          onClick={state.prev}
          className="mb-1 flex size-7 items-center justify-center border border-white text-white transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-30"
        >
          ↑
        </button>
        {units.map((id, i) => (
          <a
            key={id}
            href={`#${id}`}
            className={`size-2.5 rounded-full border border-white transition-colors ${
              index === i ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <span className="sr-only">{id}</span>
          </a>
        ))}
        <button
          type="button"
          aria-label="Next slide"
          disabled={state.atEnd}
          onClick={state.next}
          className="mt-1 flex size-7 items-center justify-center border border-white text-white transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-30"
        >
          ↓
        </button>
      </nav>
    </ScrollyContext.Provider>
  )
}
