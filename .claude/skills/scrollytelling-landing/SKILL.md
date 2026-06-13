---
name: scrollytelling-landing
description: Rules for the landing page (playground/) — slide layout tree, scroll patterns, transitions, motion accessibility, and the performance constraints. Use whenever editing playground/src (App, slides, style.css) or adding landing sections.
---

# Scrollytelling landing page

The landing is **hybrid scrollytelling** (decided via deep research, June 2026):
plain flow for hero/principles · sticky-stepper for the schema-morph narrative
· fullscreen scroll-snap for biome statement slides, with each biome's live
showcase co-located in plain flow right after its statements (one contiguous
chapter per biome). At most TWO scroll blocks (morph + biome tour).

## The slideshow is a tree

`playground/src/slides.tsx` is the only place slide geometry lives.

- **ScrollyBlock** (region root) — a self-contained scrollytelling region.
  The page holds AT MOST TWO, separated by substantial free-flow content
  (user decision). It OWNS the region's state and logic: active-unit IO, the
  dots/arrows rail, prev/next wizard navigation (`useScrolly()` context),
  and settled hash sync for ITS units only — so reload/deep-links land on
  the exact screen. Every block declares `exitId` (the next header after
  it): the last NEXT becomes "Continue ↓" and scrolls OUT of the block —
  users are never trapped at the end. Native scroll is observed, never
  intercepted — buttons drive a custom rAF autoscroll (easeOutQuart,
  380–650ms by distance, instant under no-motion) that lands exactly on
  target so snap has nothing to adjust.
- **Wizard buttons** are owned by the BLOCK (not the unit) and fixed to the
  VIEWPORT's bottom corners (secondary/Back left, primary/Next right) so
  their position never shifts with a unit's internal layout — a morph step's
  unit is a grid column, but the buttons still anchor to the screen corners.
  The fixed wrapper carries the ACTIVE unit's biome class (derived from the
  DOM via `closest('[class*="biome-"]')`), so styling stays local while
  position stays global. It fades in/out with block `index` (−1 = no unit
  seated). Biome sequences carry at least two slides each, statement→detail.
  The bottom-CENTER is reserved for the motion toggle (corners are buttons).
- **Biome** wrapper (formal; replaces the old `Sequence`) scopes the
  design-token class (`biome-*`), owns the transition axis (`data-axis`) for
  ALL its child slides, and DECLARES the chapter's asset needs via a `fonts`
  prop → stamped as `data-fonts`. Each biome's content is CO-LOCATED: its two
  statement slides, then its showcase, contiguous (a per-biome sub-story).
- **Slide** (leaf) picks a layout from a small fixed set (`statement`, `fill`).
  Every slide is exactly one viewport (`h-svh`, `overflow-clip`). Layouts
  force fixed geometry; **content adapts to the card, never the reverse** —
  this is what makes layout shift impossible by construction.
- **Screen unit** (`.screen` class): the smallest fullscreen building block —
  deck slides AND each morph step. Every unit is a snap target
  (`scroll-snap-align: start` lives in the class) and names its own
  view-timeline (`--screen`). Anything occupying a full viewport must be a
  `.screen`, or snap alignment breaks there. Per-screen scroll progress is
  shown by the Next button's fill (`--nav-progress`, set by the block's
  rAF scroll handler) — the edge pills AND the global top bar were both
  removed (user: pills went unnoticed → bad signal; top bar read as loading).
  The dots rail is the "slide X of Y" position indicator.
- **Slot layouts** (`Duplex`, `Stack`) are fixed splits whose slots clip and
  scroll internally (`min-h-0 min-w-0` + inner `overflow-auto` — BOTH axes,
  or long code lines blow the grid track out past the viewport); slots may
  nest further slot layouts. Used both inside slides and in plain flow (give an explicit height
  in flow).

Do not add ad-hoc slide markup in App.tsx; extend the layout set in slides.tsx
instead, keeping it small.

## Scroll-pattern rules (non-negotiable defaults)

- **Never animate the element the user operates.** Operable forms live in
  plain flow or hold still; panes with inner scroll get ENTRY-only animation.
- **Discrete content → discrete triggers** (IntersectionObserver state), never
  scroll-scrubbed. Scroll-linked (scrubbed) animation is for cosmetics only.
- No scroll hijacking: `scroll-snap-type: y proximity` on `html`, nothing else.
- Viewport units: `svh` for fixed slides/panels (`dvh` reflows mid-scroll as
  mobile chrome collapses — the one documented downside that directly hurts
  a snapped deck); never `vh`. Slides clip with `overflow: clip`, not
  `hidden` (hidden makes a scroll container; clip preserves SDA seeking and
  a11y order).
- Transitions use the slide's NAMED view-timeline (`--slide`) — anonymous
  `view()` breaks once slides are `overflow-hidden` (they become scroll
  containers and the timeline resolves against themselves).
- Hash sync writes from the SETTLED scroll position (`scrollend`, debounced
  scroll fallback) — never from IO thresholds, since snap adjusts the offset
  after scrolling ends. `history.scrollRestoration = 'manual'`; position is
  re-derived from the hash after mount. The slide rail offers prev/next
  buttons for scroll-averse readers.

## Motion accessibility

- All motion sits inside `@media (prefers-reduced-motion: no-preference)`.
- The on-page WCAG 2.2.2 toggle (`MotionToggle`, `html.no-motion`) must keep
  working for any new animation; JS-driven animation reads `useMotionOff()`
  (OS preference OR toggle). Progress indicators are exempt (scrollbar-like).

## Performance constraints (each fixed a measured regression)

- ScrollyBlock active-unit tracking is ONE rAF-throttled passive scroll
  handler using the viewport-MIDPOINT (not IO ratios) — robust for units of
  any height (snap slides + tall plain-flow showcases coexist in one block).
  Current index in a ref; never recreate listeners per render. Showcases are
  co-located in DOM but are NOT block units (forms stay plain flow, research),
  so the corner buttons fade over them.
- Form/demo state lives in small memoized components, never in `App`.
- No `mix-blend-mode` on fixed full-viewport layers.
- Animate `transform`/`opacity` only; no scaling of viewport-sized layers.
- `content-visibility: auto` + `contain-intrinsic-size` on heavy INNER panes
  (`.carbon`, `.demo-pane`) — never on snap targets or view-timeline subjects.
- Budget check: full-deck programmatic scroll must hold ~60fps (worst frame
  ≤ ~17ms, rAF counting in headless Chrome), and `pnpm run perf` (Lighthouse
  budget: LCP ≤ 2.5s, TBT ≤ 300ms, CLS ≤ 0.1) gates CI on the built page.
- Full-React rendering is kept under a MEASURE-FIRST decision (signed off):
  `pnpm run analyze` reports bundle composition; revisit an islands build
  only if framework runtime exceeds ~50% of the bundle.

## Fonts (explicit decision, June 2026)

The full six-family set is INTENTIONAL — per-biome typography is part of the
design. Do not trim families for budget; the budget is met by delivery order
(user sign-off exists for this; research flagged it as a contradiction):

- Preload ONLY above-the-fold faces (serif 400 + italic, body mono latin) via
  `playground/fonts.plugin.ts` — `crossorigin` is mandatory on font preloads
  or they're double-fetched.
- The same plugin injects metric-matched local fallbacks (capsize metrics →
  `size-adjust`/`ascent`/`descent`/`line-gap` overrides) so swap-CLS ≈ 0;
  fallback families are in the `--font-serif`/`--font-mono` stacks.
- Coding fonts are NEVER preloaded or render-blocking: `useLazyCodeFonts`
  warms each biome's face via `document.fonts.load()` half a viewport before
  its section (explicit, because browsers defer below-fold font kickoff
  unreliably). Verify the waterfall: load = 3 hero faces (+morph's font),
  others only on approach; latin subsets only.
- All self-hosted via Fontsource (GDPR) — verify zero external URLs in dist.

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
