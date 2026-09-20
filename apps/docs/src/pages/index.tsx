import Head from '@docusaurus/Head'
import Link from '@docusaurus/Link'
import type { ReactNode } from 'react'
import { BureauDemo, MeadowDemo, TerminalDemo } from '../components/BiomeDemos'
import { CodePane } from '../components/CodePane'
import '../css/custom.css'
import { SchemaMorph } from '../components/SchemaMorph'
import { Showcase } from '../components/Showcase'

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

const Kicker = ({ children }: { children: ReactNode }) => (
  <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">{children}</span>
)

const BIOMES = [
  {
    id: 'bureau',
    kicker: '01 · bureau',
    title: 'Nested groups, hidden fields, dynamic lists',
    intro:
      'Sections compose as fragments — shapes concatenate flat, decorations render in place. A hidden field renders nothing yet still reaches the output. The contact list’s add/remove buttons are gated by the same .min(1).max(3) the validator runs; nothing is declared twice.',
    showcaseTitle: 'Nested groups, hidden field, dynamic list',
    story: 'design-biomes--bureau',
    blurb: (
      <>
        The contact list reads its add/remove bounds from the schema&rsquo;s own{' '}
        <code className="bg-paper-deep px-1 text-ink">.min(1).max(3)</code>. Submit to see the
        parsed, typed output.
      </>
    ),
    Demo: BureauDemo,
  },
  {
    id: 'terminal',
    kicker: '02 · terminal',
    title: 'A different biome entirely — recursion is just Zod',
    intro:
      'This section’s design tokens are remapped locally — phosphor, amber, hard edges — and the chrome is ~70 lines of user code; the library didn’t change. A z.lazy schema defers each level, so the tree form renders exactly as deep as the data goes.',
    showcaseTitle: 'Recursive tree — z.lazy renders to data depth',
    story: 'design-biomes--terminal',
    blurb: <>Add nodes — the form renders exactly as deep as the data goes, and stops.</>,
    Demo: TerminalDemo,
  },
  {
    id: 'meadow',
    kicker: '03 · meadow',
    title: 'Any design system — chrome is user code',
    intro:
      'Soft and rounded this time. Shells, widgets, and list chrome bind once per design system; forms are just schemas from then on. Every form is plain Zod with .meta() copy, and the parsed, typed output arrives in onSubmit.',
    showcaseTitle: 'The RSVP, live',
    story: 'design-biomes--meadow',
    blurb: <>Defaults seeded from the schema; output parsed on submit.</>,
    Demo: MeadowDemo,
  },
] as const

export default function Home() {
  return (
    <>
      <Head>
        <title>the schema is the form. | insane-forms</title>
        <meta
          name="description"
          content="insane-forms — schema-driven React forms on plain Zod. The schema is the form."
        />
        <html lang="en" />
      </Head>
      <div className="bg-paper font-mono text-[15px] leading-relaxed text-ink">
        {/* ---- hero + principles ---- */}
        <div className="mx-auto max-w-[1180px] px-6 pt-12 pb-16">
          <header>
            <div className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
              <span>insane-forms</span>
              <span className="flex gap-4">
                <Link className="hover:text-pop" href="pathname://./storybook/">
                  storybook
                </Link>
                <a className="hover:text-pop" href="https://github.com/kantord/insane-forms">
                  github
                </a>
              </span>
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
            {PRINCIPLES.map(([term, body]) => (
              <li
                key={term}
                className="border-rule border-b p-5 last:border-b-0 sm:border-r lg:border-b-0"
              >
                <h3 className="mb-1.5 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-pop">
                  {term}
                </h3>
                <p className="m-0 text-[0.84rem] text-dim">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- watch a schema become a form (click through the steps) ---- */}
        <SchemaMorph />

        {/* ---- part two: design biomes ---- */}
        <section className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
            <span>part two</span>
            <span>design biomes</span>
          </div>
          <h2 className="mt-10 mb-5 max-w-3xl font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.08] font-normal">
            Three biomes, one library
          </h2>
          <p className="m-0 max-w-2xl text-[1.02rem]">
            The same schemas above can wear any skin. Each section below is a <em>style biome</em>:
            its design tokens are remapped locally, the chrome is a page of user code, and the
            library underneath never changes.
          </p>

          <h3 className="mt-16 mb-4 font-serif text-3xl font-normal">A biome is just tokens</h3>
          <p className="mb-4 max-w-2xl text-[0.98rem]">
            There is no theming API. A biome is a CSS class that remaps a handful of semantic design
            tokens — paper, ink, the pop accent, the fonts — and everything inside re-skins itself,
            because the chrome only ever speaks in those tokens. This is the terminal biome,
            verbatim from the stylesheet this page loads:
          </p>
          <div className="max-w-3xl border border-ink">
            <CodePane id="tokens" />
          </div>

          <h3 className="mt-16 mb-4 font-serif text-3xl font-normal">Bind once, then forget</h3>
          <p className="mb-4 max-w-2xl text-[0.98rem]">
            A design system meets the library in exactly one place: a field binding. A widget (how a
            value is edited), a shell (how a field is dressed — label, description, error), and an
            optional list wrapper. Each is a plain component over plain props; none of them import
            the form engine.
          </p>
          <p className="m-0 max-w-2xl text-[0.98rem] text-dim">
            From that point on, forms stop being UI work. A product team writes{' '}
            <code className="bg-paper-deep px-1">
              TextField.min(2).meta(&#123; title: &apos;Name&apos; &#125;)
            </code>{' '}
            and is done. The three sections below are three such bindings; the schemas inside them
            are interchangeable.
          </p>
        </section>

        {/* ---- biome tour: intro + live showcase, one contiguous chapter per
                biome, plain flow (no scroll-snap deck, no wizard nav) ---- */}
        {BIOMES.map(({ id, kicker, title, intro, showcaseTitle, story, blurb, Demo }) => (
          <div key={id} className={`biome-${id}`}>
            <section className="w-full bg-paper-deep/40 py-16 text-ink">
              <div className="mx-auto max-w-[1180px] px-6">
                <Kicker>{kicker}</Kicker>
                <h2 className="mt-2 mb-5 max-w-3xl font-serif text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] font-normal">
                  {title}
                </h2>
                <p className="m-0 max-w-2xl text-[1rem]">{intro}</p>
              </div>
            </section>
            <Showcase
              id={`showcase-${id}`}
              biome={id}
              title={showcaseTitle}
              blurb={blurb}
              story={story}
            >
              <Demo />
            </Showcase>
          </div>
        ))}

        {/* ---- footer ---- */}
        <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-20">
          <footer className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
            <a className="text-pop hover:underline" href="https://github.com/kantord/insane-forms">
              github.com/kantord/insane-forms
            </a>
            <Link className="text-pop hover:underline" href="pathname://./storybook/">
              storybook — every piece in isolation
            </Link>
            <span>the same example drives the automated suite</span>
          </footer>
        </div>
      </div>
    </>
  )
}
