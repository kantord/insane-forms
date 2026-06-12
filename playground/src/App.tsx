import snippets from 'virtual:snippets'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { MeadowForm, type RsvpData } from '../../examples/meadow'
import { type ProfileData, ProfileForm } from '../../examples/profile'
import { TerminalTreeForm, type TreeNode } from '../../examples/terminal'

/* The biome slideshow: every biome is a full-bleed color section made of
 * fullscreen narrative slides (statement → code → live demo), advanced by
 * plain scrolling (root scroll-snap — no hijacking), each slide hash-linkable.
 * Snippets are sliced from the same example modules the "Design biomes"
 * Storybook stories render and test. */

const BIOMES = ['bureau', 'terminal', 'meadow'] as const
type Biome = (typeof BIOMES)[number]

const SLIDE_IDS = BIOMES.flatMap((b) => [b, `${b}-code`, `${b}-demo`])

/* Tracks the slide filling the viewport: drives the progress dots and keeps
 * the URL hash pointing at the current slide (deep-linkable as scrolled). */
const useActiveSlide = () => {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(-1)
  // Deep links: the browser's native anchor jump happens before React mounts,
  // so re-scroll to the hash target once the slides exist.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = refs.current.indexOf(entry.target as HTMLElement)
          if (entry.intersectionRatio > 0.55) {
            setActive(index)
            const id = SLIDE_IDS[index]
            if (id !== undefined) history.replaceState(null, '', `#${id}`)
          } else if (index === active && entry.intersectionRatio < 0.2) {
            setActive(-1)
          }
        }
      },
      { threshold: [0.2, 0.55] },
    )
    for (const el of refs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  })
  return { refs, active }
}

const CodePane = ({ biome }: { biome: Biome }) => (
  <div
    className="carbon min-h-0 flex-1 overflow-auto border border-ink font-code text-[0.8rem] leading-relaxed"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
    dangerouslySetInnerHTML={{ __html: snippets[biome] }}
  />
)

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

/* One fullscreen slide: the biome class makes it a full-width color section;
 * content sits in the usual measure, vertically centered. `fixed` slides pin
 * to exactly one viewport — oversized code/forms scroll internally. Within a
 * biome's sub-slideshow, follow-up slides enter on the X axis. */
const Slide = ({
  refCb,
  id,
  biome,
  enter = 'y',
  fixed = false,
  children,
}: {
  refCb: (el: HTMLElement | null) => void
  id: string
  biome: Biome
  enter?: 'x' | 'y'
  fixed?: boolean
  children: ReactNode
}) => (
  <section
    ref={refCb}
    id={id}
    className={`biome-${biome} w-full snap-start bg-paper text-ink ${
      fixed ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}
  >
    <div
      className={`mx-auto flex max-w-[1180px] flex-col justify-center px-6 py-14 ${
        fixed ? 'h-full' : 'min-h-screen'
      } ${enter === 'x' ? 'slide-enter-x' : 'slide-enter-y'}`}
    >
      {children}
    </div>
  </section>
)

const SlideKicker = ({ children }: { children: ReactNode }) => (
  <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">{children}</span>
)

const StoryLink = ({ story }: { story: string }) => (
  <a
    href={`./storybook/?path=/story/${story}`}
    className="mt-3 self-end text-[0.65rem] uppercase tracking-[0.14em] text-dim/80 hover:text-pop"
  >
    this example in storybook ↗
  </a>
)

export function App() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [rsvp, setRsvp] = useState<RsvpData | null>(null)
  const { refs, active } = useActiveSlide()
  const slideRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el
  }
  const initialTree: TreeNode = {
    name: 'root',
    children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
  }

  return (
    <div className="min-h-screen bg-paper font-mono text-[15px] leading-relaxed text-ink">
      {/* constant scroll feedback: CSS scroll-driven progress bar */}
      <div className="scroll-progress" aria-hidden="true" />

      {/* slide progress — visible only while the slideshow is on screen */}
      <nav
        aria-label="Slides"
        className={`fixed top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col gap-2 transition-opacity duration-300 ${
          active === -1 ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {SLIDE_IDS.map((id, i) => (
          <a
            key={id}
            href={`#${id}`}
            className={`size-2.5 rounded-full border border-ink transition-colors ${
              i % 3 === 0 ? 'mt-2 first:mt-0' : ''
            } ${active === i ? 'border-pop bg-pop' : 'bg-transparent'}`}
          >
            <span className="sr-only">{id}</span>
          </a>
        ))}
      </nav>

      {/* ---- ordinary flow: hero + principles ---- */}
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
            own component, and React does the traversal. Below: three design systems, zero library
            changes.
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

      {/* ---- biome 01 · bureau ---- */}
      <Slide refCb={slideRef(0)} id="bureau" biome="bureau">
        <SlideKicker>01 · bureau</SlideKicker>
        <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
          Nested groups, hidden field, dynamic list
        </h2>
        <p className="m-0 max-w-2xl text-[1.05rem]">
          Sections compose as fragments — shapes concatenate flat, decorations render in place. A
          hidden field renders nothing yet still reaches the output, and the contact list reads its
          add/remove bounds from the schema's own{' '}
          <code className="bg-paper-deep px-1">.min(1).max(3)</code>.
        </p>
        <p className="mt-6 text-[0.8rem] uppercase tracking-[0.18em] text-dim">
          scroll — the schema first, then the living form ↓
        </p>
      </Slide>

      <Slide refCb={slideRef(1)} id="bureau-code" biome="bureau" enter="x" fixed>
        <SlideKicker>01 · bureau — the schema</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          Plain Zod with pre-bound fields. This is the entire form definition.
        </p>
        <CodePane biome="bureau" />
      </Slide>

      <Slide refCb={slideRef(2)} id="bureau-demo" biome="bureau" enter="x" fixed>
        <SlideKicker>01 · bureau — alive</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          The same schema, rendered. Submit to see the parsed, typed output.
        </p>
        <div className="demo-pane min-h-0 flex-1 overflow-auto border border-ink bg-paper p-7">
          <ProfileForm onSubmit={setProfile} />
          {profile && <Receipt data={profile} />}
        </div>
        <StoryLink story="design-biomes--bureau" />
      </Slide>

      {/* ---- biome 02 · terminal ---- */}
      <Slide refCb={slideRef(3)} id="terminal" biome="terminal">
        <SlideKicker>02 · terminal</SlideKicker>
        <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
          Recursive tree — z.lazy renders to data depth
        </h2>
        <p className="m-0 max-w-2xl text-[1.05rem]">
          A different biome entirely. The design tokens of this whole section are remapped locally —
          phosphor, amber, hard edges — and the chrome is ~70 lines of user code. The library didn't
          change.
        </p>
        <p className="mt-6 text-[0.8rem] uppercase tracking-[0.18em] text-dim">
          scroll — chrome, then the growing tree ↓
        </p>
      </Slide>

      <Slide refCb={slideRef(4)} id="terminal-code" biome="terminal" enter="x" fixed>
        <SlideKicker>02 · terminal — the chrome</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          A shell, a widget, a list wrapper, a recursive schema. That's a design system.
        </p>
        <CodePane biome="terminal" />
      </Slide>

      <Slide refCb={slideRef(5)} id="terminal-demo" biome="terminal" enter="x" fixed>
        <SlideKicker>02 · terminal — alive</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          Add nodes — the form renders exactly as deep as the data goes, and stops.
        </p>
        <div className="demo-pane min-h-0 flex-1 overflow-auto border border-ink bg-paper p-7">
          <TerminalTreeForm value={initialTree} onSubmit={setTree} />
          {tree && <Receipt data={tree} />}
        </div>
        <StoryLink story="design-biomes--terminal" />
      </Slide>

      {/* ---- biome 03 · meadow ---- */}
      <Slide refCb={slideRef(6)} id="meadow" biome="meadow">
        <SlideKicker>03 · meadow</SlideKicker>
        <h2 className="mt-2 mb-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] font-normal">
          Any design system — chrome is user code
        </h2>
        <p className="m-0 max-w-2xl text-[1.05rem]">
          Soft and rounded this time. Shells, widgets, and list chrome bind once per design system;
          forms are just schemas from then on.
        </p>
        <p className="mt-6 text-[0.8rem] uppercase tracking-[0.18em] text-dim">
          scroll — schema, then RSVP ↓
        </p>
      </Slide>

      <Slide refCb={slideRef(7)} id="meadow-code" biome="meadow" enter="x" fixed>
        <SlideKicker>03 · meadow — the schema</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          Four fields, defaults included. Titles and descriptions live in .meta().
        </p>
        <CodePane biome="meadow" />
      </Slide>

      <Slide refCb={slideRef(8)} id="meadow-demo" biome="meadow" enter="x" fixed>
        <SlideKicker>03 · meadow — alive</SlideKicker>
        <p className="mt-2 mb-4 max-w-2xl text-[0.9rem] text-dim">
          The RSVP, live. Defaults seeded from the schema; output parsed on submit.
        </p>
        <div className="demo-pane min-h-0 flex-1 overflow-auto rounded-3xl border border-rule bg-paper-deep p-7">
          <MeadowForm onSubmit={setRsvp} />
          {rsvp && <Receipt data={rsvp} />}
        </div>
        <StoryLink story="design-biomes--meadow" />
      </Slide>

      {/* ---- ordinary flow resumes: footer ---- */}
      <div className="mx-auto max-w-[1180px] px-6 pt-16 pb-20">
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
