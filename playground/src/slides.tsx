import type { ReactNode } from 'react'

/* The slideshow is a TREE:
 *
 *   Sequence (group node) — owns the biome (token scope), the entry axis for
 *     its child slides (transitions are a GROUP concern, never per-slide),
 *     and is the unit navigation/optimization can reason about.
 *   Slide (leaf) — picks one layout from a small fixed set. Layouts force
 *     fixed geometry: every slide is exactly one viewport (h-svh, clipped);
 *     slots scroll internally. Content adapts to the card — it can never
 *     reshape the slide, so there are no layout shifts by construction.
 *   Slot layouts (Duplex, Stack) — fixed splits usable inside a slide OR in
 *     plain flow; their slots may nest further slot layouts.
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
    className="slide relative h-svh w-full snap-start overflow-clip bg-paper text-ink"
  >
    <div
      className={`slide-content mx-auto flex h-full max-w-[1180px] flex-col px-6 py-12 ${
        layout === 'statement' ? 'justify-center' : ''
      }`}
    >
      {children}
    </div>
    {/* chapter progress — fills as you scroll through this slide */}
    <div className="slide-progress" aria-hidden="true">
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
