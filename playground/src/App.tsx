import snippets, { morphSteps } from 'virtual:snippets'
import { ShikiMagicMovePrecompiled } from '@shikijs/magic-move/react'
import '@shikijs/magic-move/style.css'
import { memo, type ReactNode, useEffect, useState } from 'react'
import { MeadowForm, type RsvpData } from '../../examples/meadow'
import { Step2, Step3, Step4 } from '../../examples/morph'
import { type ProfileData, ProfileForm } from '../../examples/profile'
import { TerminalTreeForm, type TreeNode } from '../../examples/terminal'
import { ZodForm } from '../../src'
import { Biome, type BiomeName, Duplex, motionOffNow, ScrollyBlock, Slide, Stack } from './slides'

/* Page structure (hybrid scrollytelling — see research):
 *  - hero + principles: plain flow
 *  - SchemaMorph: sticky-stepper — pinned code (Magic Move) + live form,
 *    discrete steps driven by IntersectionObserver
 *  - biome deck: fullscreen scroll-snap STATEMENT slides only (no interaction)
 *  - showcases: plain flow — code pane + operable form per biome
 * Snippets and morph steps come from the same example modules Storybook
 * renders and tests. */

/* memo: the big pre-rendered HTML panes must not re-render when App's
 * active-slide state changes. */
const CodePane = memo(({ biome }: { biome: BiomeName }) => (
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

/* Each biome declares its code font; the `Biome` wrapper / showcase stamps it
 * as `data-fonts`. */
const BIOME_FONT: Record<BiomeName, string> = {
  bureau: '1rem "IBM Plex Mono"',
  terminal: '1rem "JetBrains Mono Variable"',
  meadow: '1rem "Fira Code Variable"',
}

/* Chapter-prioritized asset loading: the biome whose chapter the URL hash
 * points at loads FIRST (visible content), everything else is preloaded after
 * first paint via requestIdleCallback — present but deprioritized. Reads the
 * `data-fonts` each Biome/showcase declares, so adding a biome needs no edit
 * here. */
const useChapterAssets = () => {
  useEffect(() => {
    const hosts = [...document.querySelectorAll<HTMLElement>('[data-fonts]')]
    const fontsOf = (el: HTMLElement | null | undefined) =>
      (el?.dataset.fonts ?? '').split('|').filter(Boolean)
    const load = (fonts: string[]) => {
      for (const f of fonts) void document.fonts.load(f)
    }
    const hashId = window.location.hash.slice(1)
    const activeHost = hashId
      ? (document.getElementById(hashId)?.closest('[data-fonts]') as HTMLElement | null)
      : null
    load(fontsOf(activeHost)) // active chapter first
    const rest = () => {
      for (const el of hosts) if (el !== activeHost) load(fontsOf(el))
    }
    if ('requestIdleCallback' in window)
      (window as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(rest)
    else setTimeout(rest, 200)
  }, [])
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
      className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 border border-dim bg-paper px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-dim hover:border-pop hover:text-pop"
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

const MORPH_UNIT_IDS = MORPH_STEPS.map((_, i) => `morph-step-${i + 1}`)

const SchemaMorph = () => {
  const [step, setStep] = useState(0)
  const [out, setOut] = useState<unknown>(null)
  const motionOff = useMotionOff()
  useEffect(() => {
    const elements = MORPH_UNIT_IDS.map((id) => document.getElementById(id))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = elements.indexOf(entry.target as HTMLElement)
          if (index !== -1) setStep(index)
        }
      },
      { threshold: 0.6 },
    )
    for (const el of elements) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])
  useEffect(() => setOut(null), [])
  const schema = MORPH_STEPS[step]?.schema ?? null

  return (
    <section
      id="morph"
      className="biome-bureau w-full bg-paper-deep/40 text-ink"
      data-fonts={BIOME_FONT.bureau}
    >
      <ScrollyBlock units={MORPH_UNIT_IDS} exitId="interlude">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-x-12 px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            {MORPH_STEPS.map((s, i) => (
              <div
                key={s.kicker}
                id={`morph-step-${i + 1}`}
                className="screen relative flex h-svh flex-col justify-center py-10 pl-5"
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
      </ScrollyBlock>
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
  biome: BiomeName
  title: string
  blurb: ReactNode
  story: string
  children: ReactNode
}) => (
  <section
    id={id}
    className={`biome-${biome} w-full bg-paper py-16 text-ink`}
    data-fonts={BIOME_FONT[biome]}
  >
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
  useChapterAssets()
  // Reload/back-forward: we re-derive position from the hash ourselves, so
  // the browser's restoration (which races snap + content-visibility sizing)
  // is disabled. ScrollyBlocks own the per-region hash writes.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <div className="min-h-screen bg-paper font-mono text-[15px] leading-relaxed text-ink">
      <MotionToggle />

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

      {/* ---- free flow between the two scrolly blocks ---- */}
      <section id="interlude" className="mx-auto max-w-[1180px] px-6 py-28">
        <div className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
          <span>part two</span>
          <span>design biomes</span>
        </div>
        <h2 className="mt-10 mb-5 max-w-3xl font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.08] font-normal">
          Three biomes, one library
        </h2>
        <p className="m-0 max-w-2xl text-[1.02rem]">
          The same schemas you just watched grow can wear any skin. Each of the next sections is a
          <em> style biome</em>: the section's design tokens are remapped locally, the chrome is a
          page of user code, and the library underneath never changes. Scroll on — or use the
          buttons — to tour three of them; the full worked forms follow after.
        </p>

        <h3 className="mt-20 mb-4 font-serif text-3xl font-normal">A biome is just tokens</h3>
        <p className="mb-4 max-w-2xl text-[0.98rem]">
          There is no theming API. A biome is a CSS class that remaps a handful of semantic design
          tokens — paper, ink, the pop accent, the fonts — and everything inside re-skins itself,
          because the chrome only ever speaks in those tokens. This is the terminal biome, verbatim
          from the stylesheet this very page loads:
        </p>
        <div
          className="carbon max-w-3xl overflow-auto border border-ink font-code text-[0.8rem] leading-relaxed"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
          dangerouslySetInnerHTML={{ __html: snippets.tokens }}
        />
        <p className="mt-4 max-w-2xl text-[0.9rem] text-dim">
          The same file styles the Storybook, so what you see here is what the test suite renders.
        </p>

        <h3 className="mt-20 mb-4 font-serif text-3xl font-normal">Bind once, then forget</h3>
        <p className="mb-4 max-w-2xl text-[0.98rem]">
          A design system meets the library in exactly one place: a field binding. A widget (how a
          value is edited), a shell (how a field is dressed — label, description, error), and an
          optional list wrapper. Each is a plain component over plain props; none of them import the
          form engine.
        </p>
        <p className="mb-4 max-w-2xl text-[0.98rem]">
          From that point on, forms stop being UI work. A product team writes
          <code className="bg-paper-deep px-1">
            {' '}
            TextField.min(2).meta(&#123; title: 'Name' &#125;)
          </code>{' '}
          and is done — validation, the draft's seeded defaults, the label, and the typed submit
          payload all come from that one declaration. The three sections ahead are three such
          bindings; the schemas inside them are interchangeable.
        </p>
        <p className="m-0 max-w-2xl text-[0.98rem] text-dim">
          If you can write a component that renders an input, you can have a biome of your own — the
          terminal chrome ahead is about seventy lines, written for this page.
        </p>
      </section>

      {/* ---- biome tour: ONE ScrollyBlock. The 6 statement slides are the
              navigable snap units (dots = slide X of Y); each biome's live
              showcase sits in plain flow right after its statements, so the
              content order reads as one contiguous chapter per biome. ---- */}
      <ScrollyBlock
        units={['bureau', 'bureau-2', 'terminal', 'terminal-2', 'meadow', 'meadow-2']}
        exitId="site-footer"
      >
        <Biome name="bureau" fonts={[BIOME_FONT.bureau]}>
          <Slide id="bureau">
            <SlideKicker>01 · bureau</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              Nested groups, hidden fields, dynamic lists
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              Sections compose as fragments — shapes concatenate flat, decorations render in place.
              A hidden field renders nothing yet still reaches the output.
            </p>
          </Slide>
          <Slide id="bureau-2">
            <SlideKicker>01 · bureau — the contract</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              One schema, one source of truth
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              The contact list's add and remove buttons are gated by the same .min(1).max(3) the
              validator runs. Declared defaults seed the draft and fill at parse. Nothing is
              declared twice — disagreement is impossible.
            </p>
          </Slide>
        </Biome>
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

        <Biome name="terminal" fonts={[BIOME_FONT.terminal]}>
          <Slide id="terminal">
            <SlideKicker>02 · terminal</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              A different biome entirely
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              This section's design tokens are remapped locally — phosphor, amber, hard edges — and
              the chrome is ~70 lines of user code. The library didn't change.
            </p>
          </Slide>
          <Slide id="terminal-2">
            <SlideKicker>02 · terminal — recursion</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              Renders to data depth, then stops
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              Recursion is just Zod: a z.lazy schema defers each level, so the tree form renders
              exactly as deep as the data goes. Add a node and the form grows by one input — no
              special cases anywhere.
            </p>
          </Slide>
        </Biome>
        <Showcase
          id="showcase-terminal"
          biome="terminal"
          title="Recursive tree — z.lazy renders to data depth"
          story="design-biomes--terminal"
          blurb={<>Add nodes — the form renders exactly as deep as the data goes, and stops.</>}
        >
          <TerminalDemo />
        </Showcase>

        <Biome name="meadow" fonts={[BIOME_FONT.meadow]}>
          <Slide id="meadow">
            <SlideKicker>03 · meadow</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              Any design system — chrome is user code
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              Soft and rounded this time. Shells, widgets, and list chrome bind once per design
              system; forms are just schemas from then on.
            </p>
          </Slide>
          <Slide id="meadow-2">
            <SlideKicker>03 · meadow — binding</SlideKicker>
            <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
              Bind once. Forms are schemas.
            </h2>
            <p className="m-0 max-w-2xl text-[1.05rem]">
              A widget, a shell, a one-line binding — that's a field kind. From then on, every form
              is plain Zod with .meta() copy, and the parsed, typed output arrives in onSubmit.
            </p>
          </Slide>
        </Biome>
        <Showcase
          id="showcase-meadow"
          biome="meadow"
          title="The RSVP, live"
          story="design-biomes--meadow"
          blurb={<>Defaults seeded from the schema; output parsed on submit.</>}
        >
          <MeadowDemo />
        </Showcase>
      </ScrollyBlock>

      {/* ---- footer ---- */}
      <div id="site-footer" className="mx-auto max-w-[1180px] px-6 pt-10 pb-20">
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
