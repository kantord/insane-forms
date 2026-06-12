import snippets, { morphSteps } from 'virtual:snippets'
import { ShikiMagicMovePrecompiled } from '@shikijs/magic-move/react'
import '@shikijs/magic-move/style.css'
import { memo, type ReactNode, useEffect, useRef, useState } from 'react'
import { MeadowForm, type RsvpData } from '../../examples/meadow'
import { Step2, Step3, Step4 } from '../../examples/morph'
import { type ProfileData, ProfileForm } from '../../examples/profile'
import { TerminalTreeForm, type TreeNode } from '../../examples/terminal'
import { ZodForm } from '../../src'
import { type Biome, Duplex, Sequence, Slide, Stack } from './slides'

/* Page structure (hybrid scrollytelling — see research):
 *  - hero + principles: plain flow
 *  - SchemaMorph: sticky-stepper — pinned code (Magic Move) + live form,
 *    discrete steps driven by IntersectionObserver
 *  - biome deck: fullscreen scroll-snap STATEMENT slides only (no interaction)
 *  - showcases: plain flow — code pane + operable form per biome
 * Snippets and morph steps come from the same example modules Storybook
 * renders and tests. */

const BIOMES = ['bureau', 'terminal', 'meadow'] as const

/* Tracks the slide filling the viewport: drives the progress dots and keeps
 * the URL hash pointing at the current slide (deep-linkable as scrolled).
 * Hash writes happen on the SETTLED scroll position (scrollend, with a
 * debounced-scroll fallback) — never on IO thresholds, because snap may
 * adjust the offset after scrolling finishes and desync hash from reality. */
const useActiveSlide = () => {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(-1)
  // Reload/back-forward: we re-derive position from the hash ourselves, so
  // the browser's own restoration (which races snap + content-visibility
  // sizing) is disabled.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])
  // Dots state: one observer for the page's lifetime; current index in a ref
  // so the callback never goes stale and never causes observer churn.
  const activeRef = useRef(-1)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = refs.current.indexOf(entry.target as HTMLElement)
          if (entry.intersectionRatio > 0.55) {
            if (activeRef.current !== index) {
              activeRef.current = index
              setActive(index)
            }
          } else if (index === activeRef.current && entry.intersectionRatio < 0.2) {
            activeRef.current = -1
            setActive(-1)
          }
        }
      },
      { threshold: [0.2, 0.55] },
    )
    for (const el of refs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // Hash sync from the settled position only.
  useEffect(() => {
    const settle = () => {
      const mid = window.innerHeight / 2
      const index = refs.current.findIndex((el) => {
        if (!el) return false
        const rect = el.getBoundingClientRect()
        return rect.top <= mid && rect.bottom >= mid
      })
      const id = index === -1 ? undefined : BIOMES[index]
      if (id !== undefined && window.location.hash !== `#${id}`) {
        history.replaceState(null, '', `#${id}`)
      }
    }
    // (cast: lib.dom types onscrollend unconditionally, narrowing the else to never)
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
  }, [])
  return { refs, active }
}

/* memo: the big pre-rendered HTML panes must not re-render when App's
 * active-slide state changes. */
const CodePane = memo(({ biome }: { biome: Biome }) => (
  <div
    className="carbon h-full min-h-0 overflow-auto font-code text-[0.8rem] leading-relaxed"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
    dangerouslySetInnerHTML={{ __html: snippets[biome] }}
  />
))

const Receipt = ({ data }: { data: unknown }) => (
  <div
    className="receipt mt-6 border border-ink bg-paper-deep motion-safe:animate-rise"
    role="status"
  >
    <div className="flex items-center gap-3 border-b border-dashed border-dim px-3 py-2">
      <span className="size-2 rounded-full bg-pop" aria-hidden="true" />
      <span className="text-[0.68rem] uppercase tracking-[0.12em] text-dim">
        z.output — parsed &amp; typed
      </span>
    </div>
    <pre className="m-0 overflow-x-auto p-3.5 text-[0.74rem] leading-normal">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
)

const PRINCIPLES = [
  [
    'matchless rendering',
    'Every node carries its renderer in .meta({ component }). The core never switches on schema type.',
  ],
  [
    'zero DOM in core',
    'Shells, list chrome, widgets — all user code. The library ships behavior, you ship the looks.',
  ],
  [
    'draft vs submit',
    'The form edits the z.input draft; onSubmit receives parsed z.output. Hidden defaults fill at parse.',
  ],
  [
    'tree-shakeable',
    'Named exports only. Import the resolve toolkit alone: ~0.7 kB, zero react-hook-form in the bundle.',
  ],
] as const

const SlideKicker = ({ children }: { children: ReactNode }) => (
  <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">{children}</span>
)

/* ---------------------------------------------------------------------- */
/* Motion preference: OS setting OR the on-page WCAG 2.2.2 toggle.         */
/* ---------------------------------------------------------------------- */

const MOTION_KEY = 'insane-forms:motion'
const MOTION_EVENT = 'insane:motion'

const motionOffNow = () =>
  document.documentElement.classList.contains('no-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Coding fonts activate lazily: each biome's face starts loading when its
 * section approaches (half a viewport early), never in the critical path.
 * Explicit fonts.load() — browsers defer below-fold font kickoff unreliably. */
const CODE_FONTS: [string, string][] = [
  ['morph', '1rem "IBM Plex Mono"'],
  ['showcase-bureau', '1rem "IBM Plex Mono"'],
  ['showcase-terminal', '1rem "JetBrains Mono Variable"'],
  ['showcase-meadow', '1rem "Fira Code Variable"'],
]

const useLazyCodeFonts = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const font = CODE_FONTS.find(([id]) => id === entry.target.id)?.[1]
          if (font !== undefined) void document.fonts.load(font)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '50% 0px' },
    )
    for (const [id] of CODE_FONTS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])
}

/** Button navigation over the slide tree — for scroll-averse readers. */
const goToSlide = (index: number) => {
  const id = BIOMES[Math.min(BIOMES.length - 1, Math.max(0, index))]
  if (id !== undefined)
    document.getElementById(id)?.scrollIntoView({
      behavior: motionOffNow() ? 'instant' : 'smooth',
    })
}

const useMotionOff = () => {
  const [off, setOff] = useState(motionOffNow)
  useEffect(() => {
    const handler = () => setOff(motionOffNow())
    window.addEventListener(MOTION_EVENT, handler)
    return () => window.removeEventListener(MOTION_EVENT, handler)
  }, [])
  return off
}

const MotionToggle = () => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(MOTION_KEY) !== 'off')
  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', !enabled)
    localStorage.setItem(MOTION_KEY, enabled ? 'on' : 'off')
    window.dispatchEvent(new Event(MOTION_EVENT))
  }, [enabled])
  return (
    <button
      type="button"
      aria-pressed={!enabled}
      onClick={() => setEnabled(!enabled)}
      className="fixed bottom-4 left-4 z-20 border border-dim bg-paper px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-dim hover:border-pop hover:text-pop"
    >
      motion: {enabled ? 'on' : 'off'}
    </button>
  )
}

/* ---------------------------------------------------------------------- */
/* SchemaMorph — the persuasion core. Sticky-stepper (Linear pattern):     */
/* narrative steps scroll on the left; the pinned panel morphs the code    */
/* (Magic Move, precompiled tokens) and re-renders the live form. Steps    */
/* are DISCRETE — IntersectionObserver, never scroll-scrubbed.             */
/* ---------------------------------------------------------------------- */

const MORPH_STEPS = [
  {
    kicker: 'step 1 · data',
    title: 'Start with plain Zod',
    body: 'A schema is data. No components, no registry — and honestly: nothing renders. That is the point; the library never guesses.',
    schema: null,
  },
  {
    kicker: 'step 2 · bind',
    title: 'Fields carry their widgets',
    body: 'Swap z.string() for a pre-bound field. Each node now carries its own component in .meta() — inputs appear. No match statement anywhere.',
    schema: Step2,
  },
  {
    kicker: 'step 3 · annotate',
    title: 'Titles live in the schema',
    body: 'Labels and descriptions are .meta() too — plain Zod chaining, and the shell renders them. The schema is still a schema: parse it, infer from it.',
    schema: Step3,
  },
  {
    kicker: 'step 4 · validate',
    title: 'Checks and defaults come free',
    body: 'Add .min(), .email(), .default() — the same declarations validate the draft, seed it, and gate submit. Try submitting empty.',
    schema: Step4,
  },
] as const

const SchemaMorph = () => {
  const [step, setStep] = useState(0)
  const [out, setOut] = useState<unknown>(null)
  const motionOff = useMotionOff()
  const refs = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = refs.current.indexOf(entry.target as HTMLElement)
          if (index !== -1) setStep(index)
        }
      },
      { threshold: 0.6 },
    )
    for (const el of refs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])
  useEffect(() => setOut(null), [])
  const schema = MORPH_STEPS[step]?.schema ?? null

  return (
    <section id="morph" className="biome-bureau w-full bg-paper-deep/40 text-ink">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-x-12 px-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          {MORPH_STEPS.map((s, i) => (
            <div
              key={s.kicker}
              ref={(el) => {
                refs.current[i] = el
              }}
              className="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-svh"
            >
              <SlideKicker>{s.kicker}</SlideKicker>
              <h3 className="mt-2 mb-3 font-serif text-3xl font-normal">{s.title}</h3>
              <p className="m-0 max-w-md text-[0.95rem] text-dim">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center py-8 lg:sticky lg:top-0 lg:h-svh">
          <Stack
            rows="1.15fr 1fr"
            className="h-[84svh] w-full"
            top={
              <div className="h-full overflow-auto border border-ink bg-carbon font-code text-[0.8rem] leading-relaxed [&_.shiki-magic-move-container]:m-0 [&_.shiki-magic-move-container]:p-6">
                <ShikiMagicMovePrecompiled
                  steps={morphSteps}
                  step={step}
                  options={{ duration: motionOff ? 0 : 450, stagger: 2, animateContainer: false }}
                />
              </div>
            }
            bottom={
              <div className="demo-pane h-full overflow-auto border border-ink bg-paper p-6">
                {schema ? (
                  <ZodForm key={step} schema={schema} onSubmit={setOut}>
                    <button type="submit">Save</button>
                  </ZodForm>
                ) : (
                  <p className="m-0 text-[0.85rem] text-dim">
                    Nothing renders yet — the schema carries no components. Data first.
                  </p>
                )}
                {out != null && <Receipt data={out} />}
              </div>
            }
          />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------- */
/* Showcases: plain flow, where the OPERABLE forms live (research: real    */
/* interaction never goes inside a snap deck).                             */
/* ---------------------------------------------------------------------- */

const BureauDemo = memo(() => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  return (
    <>
      <ProfileForm onSubmit={setProfile} />
      {profile && <Receipt data={profile} />}
    </>
  )
})

const INITIAL_TREE: TreeNode = {
  name: 'root',
  children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
}

const TerminalDemo = memo(() => {
  const [tree, setTree] = useState<TreeNode | null>(null)
  return (
    <>
      <TerminalTreeForm value={INITIAL_TREE} onSubmit={setTree} />
      {tree && <Receipt data={tree} />}
    </>
  )
})

const MeadowDemo = memo(() => {
  const [rsvp, setRsvp] = useState<RsvpData | null>(null)
  return (
    <>
      <MeadowForm onSubmit={setRsvp} />
      {rsvp && <Receipt data={rsvp} />}
    </>
  )
})

const Showcase = ({
  id,
  biome,
  title,
  blurb,
  story,
  children,
}: {
  id: string
  biome: Biome
  title: string
  blurb: ReactNode
  story: string
  children: ReactNode
}) => (
  <section id={id} className={`biome-${biome} w-full bg-paper py-16 text-ink`}>
    <div className="mx-auto flex max-w-[1180px] flex-col px-6">
      <h2 className="mb-1.5 font-serif text-3xl font-normal">{title}</h2>
      <p className="m-0 mb-6 max-w-2xl text-[0.9rem] text-dim">{blurb}</p>
      <Duplex
        className="h-[78svh]"
        left={<CodePane biome={biome} />}
        right={<div className="demo-pane h-full overflow-auto bg-paper p-7">{children}</div>}
      />
      <a
        href={`./storybook/?path=/story/${story}`}
        className="mt-2 self-end text-[0.65rem] uppercase tracking-[0.14em] text-dim/80 hover:text-pop"
      >
        this example in storybook ↗
      </a>
    </div>
  </section>
)

export function App() {
  const { refs, active } = useActiveSlide()
  useLazyCodeFonts()
  const slideRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el
  }

  return (
    <div className="min-h-screen bg-paper font-mono text-[15px] leading-relaxed text-ink">
      {/* constant scroll feedback: CSS scroll-driven progress bar */}
      <div className="scroll-progress" aria-hidden="true" />
      <MotionToggle />

      {/* slide rail: prev/next for scroll-averse readers + progress dots —
          visible only while the deck is on screen */}
      <nav
        aria-label="Slides"
        className={`fixed top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col items-center gap-2 mix-blend-difference transition-opacity duration-300 ${
          active === -1 ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          aria-label="Previous slide"
          disabled={active <= 0}
          onClick={() => goToSlide(active - 1)}
          className="mb-1 flex size-7 items-center justify-center border border-white text-white transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-30"
        >
          ↑
        </button>
        {BIOMES.map((id, i) => (
          <a
            key={id}
            href={`#${id}`}
            className={`size-2.5 rounded-full border border-white transition-colors ${
              active === i ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <span className="sr-only">{id}</span>
          </a>
        ))}
        <button
          type="button"
          aria-label="Next slide"
          disabled={active >= BIOMES.length - 1}
          onClick={() => goToSlide(active + 1)}
          className="mt-1 flex size-7 items-center justify-center border border-white text-white transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-30"
        >
          ↓
        </button>
      </nav>

      {/* ---- plain flow: hero + principles ---- */}
      <div className="mx-auto max-w-[1180px] px-6 pt-12 pb-16">
        <header className="motion-safe:animate-rise">
          <div className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
            <span>insane-forms</span>
            <span>rev 0.1.0</span>
            <span>mit</span>
          </div>

          <h1 className="my-9 font-serif text-[clamp(3rem,8vw,5.4rem)] leading-[1.02] font-normal tracking-tight">
            the schema <em className="text-pop">is</em> the form.
          </h1>

          <p className="mb-7 max-w-2xl text-[1.02rem]">
            <strong>insane-forms</strong> renders React forms straight from plain Zod schemas. No
            JSON dialect, no renderer registry, no match statement — each schema node carries its
            own component, and React does the traversal.
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-6">
            <span className="border-2 border-pop px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-pop">
              zod 4 · react 19
            </span>
            <code className="select-all border border-dashed border-dim bg-paper-deep px-3.5 py-2 text-[0.9rem]">
              pnpm add insane-forms
            </code>
          </div>
        </header>

        <ul className="grid list-none grid-cols-1 border border-ink p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(([term, body], i) => (
            <li
              key={term}
              className="border-rule border-b p-5 last:border-b-0 sm:border-r lg:border-b-0 motion-safe:animate-rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="mb-1.5 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-pop">
                {term}
              </h3>
              <p className="m-0 text-[0.84rem] text-dim">{body}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ---- sticky-stepper: watch a schema become a form ---- */}
      <SchemaMorph />

      {/* ---- snap deck: biome statements (no interaction) ---- */}
      <Sequence biome="bureau" axis="y">
        <Slide refCb={slideRef(0)} id="bureau">
          <SlideKicker>01 · bureau</SlideKicker>
          <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
            Nested groups, hidden fields, dynamic lists
          </h2>
          <p className="m-0 max-w-2xl text-[1.05rem]">
            Sections compose as fragments — shapes concatenate flat, decorations render in place. A
            hidden field renders nothing yet still reaches the output.
          </p>
          <p className="mt-6 text-[0.8rem] uppercase tracking-[0.18em] text-dim">
            the full worked form follows the deck ↓
          </p>
        </Slide>
      </Sequence>

      <Sequence biome="terminal" axis="y">
        <Slide refCb={slideRef(1)} id="terminal">
          <SlideKicker>02 · terminal</SlideKicker>
          <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
            A different biome entirely
          </h2>
          <p className="m-0 max-w-2xl text-[1.05rem]">
            This section's design tokens are remapped locally — phosphor, amber, hard edges — and
            the chrome is ~70 lines of user code. The library didn't change.
          </p>
        </Slide>
      </Sequence>

      <Sequence biome="meadow" axis="y">
        <Slide refCb={slideRef(2)} id="meadow">
          <SlideKicker>03 · meadow</SlideKicker>
          <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
            Any design system — chrome is user code
          </h2>
          <p className="m-0 max-w-2xl text-[1.05rem]">
            Soft and rounded this time. Shells, widgets, and list chrome bind once per design
            system; forms are just schemas from then on.
          </p>
        </Slide>
      </Sequence>

      {/* ---- plain flow: the operable showcases ---- */}
      <Showcase
        id="showcase-bureau"
        biome="bureau"
        title="Nested groups, hidden field, dynamic list"
        story="design-biomes--bureau"
        blurb={
          <>
            The contact list reads its add/remove bounds from the schema's own{' '}
            <code className="bg-paper-deep px-1 text-ink">.min(1).max(3)</code>. Submit to see the
            parsed, typed output.
          </>
        }
      >
        <BureauDemo />
      </Showcase>

      <Showcase
        id="showcase-terminal"
        biome="terminal"
        title="Recursive tree — z.lazy renders to data depth"
        story="design-biomes--terminal"
        blurb={<>Add nodes — the form renders exactly as deep as the data goes, and stops.</>}
      >
        <TerminalDemo />
      </Showcase>

      <Showcase
        id="showcase-meadow"
        biome="meadow"
        title="The RSVP, live"
        story="design-biomes--meadow"
        blurb={<>Defaults seeded from the schema; output parsed on submit.</>}
      >
        <MeadowDemo />
      </Showcase>

      {/* ---- footer ---- */}
      <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-20">
        <footer className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
          <a className="text-pop hover:underline" href="https://github.com/kantord/insane-forms">
            github.com/kantord/insane-forms
          </a>
          <a className="text-pop hover:underline" href="./storybook/">
            storybook — every piece in isolation
          </a>
          <span>the same example drives the automated suite</span>
        </footer>
      </div>
    </div>
  )
}
