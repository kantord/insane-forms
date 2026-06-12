import { useState } from 'react'
import { type Cat, CategoryForm, type ProfileData, ProfileForm } from '../../examples/profile'
import profileSource from '../../examples/profile.tsx?raw'

/* The code panes are sliced from the REAL example file (imported ?raw), so the
 * documentation can never drift from the code the tests run against. */
const slice = (from: string, to: string) => {
  const a = profileSource.indexOf(from)
  const b = profileSource.indexOf(to)
  return a !== -1 && b !== -1 && b > a ? profileSource.slice(a, b).trimEnd() : profileSource
}
const profileSnippet = slice('const Contact', 'export type ProfileData')
const treeSnippet = slice('export type Cat', 'export const CategoryForm')

const isComment = (line: string) => /^\s*(\/\/|\/\*|\*)/.test(line)

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="carbon m-0 overflow-x-auto bg-carbon p-6 text-[0.78rem] leading-relaxed text-carbon-text">
    <code>
      {code.split('\n').map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static text lines, never reordered
        <span key={i} className={isComment(line) ? 'text-carbon-dim italic' : undefined}>
          {`${line}\n`}
        </span>
      ))}
    </code>
  </pre>
)

const Receipt = ({ data }: { data: unknown }) => (
  <div
    className="receipt mt-6 border border-ink bg-paper-deep motion-safe:animate-rise"
    role="status"
  >
    <div className="flex items-center gap-3 border-b border-dashed border-dim px-3 py-2">
      <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
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

const SECTIONS = [
  {
    index: '01',
    title: 'Nested groups, hidden field, dynamic list',
    blurb: (
      <>
        Sections compose as fragments — shapes concatenate flat, decorations render in place. The
        contact list reads its add/remove bounds from the schema's own{' '}
        <code className="bg-paper-deep px-1 text-ink">.min(1).max(3)</code>.
      </>
    ),
  },
  {
    index: '02',
    title: 'Recursive tree — z.lazy renders to data depth',
    blurb: (
      <>
        A self-referential schema renders exactly as deep as the data goes, and stops. Add a child
        to grow the form.
      </>
    ),
  },
] as const

export function App() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tree, setTree] = useState<Cat | null>(null)
  const initialTree: Cat = {
    name: 'root',
    children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
  }

  return (
    <div className="min-h-screen bg-paper font-mono text-[15px] leading-relaxed text-ink">
      <div className="mx-auto max-w-[1180px] px-6 pt-12 pb-20">
        <header className="motion-safe:animate-rise">
          <div className="flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
            <span>insane-forms</span>
            <span>rev 0.1.0</span>
            <span>mit</span>
          </div>

          <h1 className="my-9 font-serif text-[clamp(3rem,8vw,5.4rem)] leading-[1.02] tracking-tight font-normal">
            the schema <em className="text-accent">is</em> the form.
          </h1>

          <p className="mb-7 max-w-2xl text-[1.02rem]">
            <strong>insane-forms</strong> renders React forms straight from plain Zod schemas. No
            JSON dialect, no renderer registry, no match statement — each schema node carries its
            own component, and React does the traversal.
          </p>

          <div className="mb-12 flex flex-wrap items-center gap-6">
            <span className="border-2 border-accent px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-accent">
              zod 4 · react 19
            </span>
            <code className="select-all border border-dashed border-dim bg-paper-deep px-3.5 py-2 text-[0.9rem]">
              pnpm add insane-forms
            </code>
          </div>
        </header>

        <ul className="mb-16 grid list-none grid-cols-1 border border-ink p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(([term, body], i) => (
            <li
              key={term}
              className="border-rule border-b p-5 last:border-b-0 sm:border-r lg:border-b-0 motion-safe:animate-rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="mb-1.5 text-[0.78rem] uppercase tracking-[0.16em] text-accent font-bold">
                {term}
              </h3>
              <p className="m-0 text-[0.84rem] text-dim">{body}</p>
            </li>
          ))}
        </ul>

        {SECTIONS.map((section, i) => (
          <section key={section.index} className="mb-18 motion-safe:animate-rise">
            <header className="mb-5">
              <span className="text-[0.78rem] font-bold tracking-[0.2em] text-accent">
                {section.index}
              </span>
              <h2 className="mt-1 mb-1.5 font-serif text-3xl font-normal">{section.title}</h2>
              <p className="m-0 max-w-2xl text-[0.9rem] text-dim">{section.blurb}</p>
            </header>
            <div className="grid grid-cols-1 border border-ink lg:grid-cols-[1.15fr_1fr]">
              <CodeBlock code={i === 0 ? profileSnippet : treeSnippet} />
              <div className="demo-pane border-t border-ink bg-paper p-7 lg:border-t-0 lg:border-l">
                {i === 0 ? (
                  <>
                    <ProfileForm onSubmit={setProfile} />
                    {profile && <Receipt data={profile} />}
                  </>
                ) : (
                  <>
                    <CategoryForm value={initialTree} onSubmit={setTree} />
                    {tree && <Receipt data={tree} />}
                  </>
                )}
              </div>
            </div>
          </section>
        ))}

        <footer className="mt-8 flex flex-wrap justify-between gap-4 border-y-3 border-double border-ink py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
          <a className="text-accent hover:underline" href="https://github.com/kantord/insane-forms">
            github.com/kantord/insane-forms
          </a>
          <a className="text-accent hover:underline" href="./storybook/">
            storybook — every piece in isolation
          </a>
          <span>the same example drives the automated suite</span>
        </footer>
      </div>
    </div>
  )
}
