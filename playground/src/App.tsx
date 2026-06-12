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
  <pre className="carbon">
    <code>
      {code.split('\n').map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static text lines, never reordered
        <span key={i} className={isComment(line) ? 'carbon-comment' : undefined}>
          {`${line}\n`}
        </span>
      ))}
    </code>
  </pre>
)

const Receipt = ({ data }: { data: unknown }) => (
  <div className="receipt" role="status">
    <div className="receipt-head">
      <span className="stamp stamp-sm">received</span>
      <span className="receipt-note">z.output — parsed &amp; typed</span>
    </div>
    <pre>{JSON.stringify(data, null, 2)}</pre>
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

export function App() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tree, setTree] = useState<Cat | null>(null)
  const initialTree: Cat = {
    name: 'root',
    children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
  }

  return (
    <div className="sheet">
      <header className="masthead">
        <div className="rule-line">
          <span>form № 001</span>
          <span>schema-driven disclosure statement</span>
          <span>rev 0.1.0</span>
        </div>
        <h1 className="title">
          the schema <em>is</em> the form.
        </h1>
        <p className="lede">
          <strong>insane-forms</strong> renders React forms straight from plain Zod schemas. No JSON
          dialect, no renderer registry, no match statement — each schema node carries its own
          component, and React does the traversal.
        </p>
        <div className="masthead-row">
          <span className="stamp">zod 4 · react 19 · mit</span>
          <code className="install">pnpm add insane-forms</code>
        </div>
      </header>

      <ul className="principles">
        {PRINCIPLES.map(([term, body]) => (
          <li key={term}>
            <h3>{term}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ul>

      <section className="specimen">
        <header className="specimen-head">
          <span className="spec-tag">specimen a</span>
          <h2>Nested groups, hidden field, dynamic list</h2>
          <p>
            Sections compose as fragments — shapes concatenate flat, decorations render in place.
            The contact list reads its add/remove bounds from the schema's own{' '}
            <code>.min(1).max(3)</code>.
          </p>
        </header>
        <div className="duplex">
          <CodeBlock code={profileSnippet} />
          <div className="demo-pane">
            <ProfileForm onSubmit={setProfile} />
            {profile && <Receipt data={profile} />}
          </div>
        </div>
      </section>

      <section className="specimen">
        <header className="specimen-head">
          <span className="spec-tag">specimen b</span>
          <h2>Recursive tree — z.lazy renders to data depth</h2>
          <p>
            A self-referential schema renders exactly as deep as the data goes, and stops. Add a
            child to grow the form.
          </p>
        </header>
        <div className="duplex">
          <CodeBlock code={treeSnippet} />
          <div className="demo-pane">
            <CategoryForm value={initialTree} onSubmit={setTree} />
            {tree && <Receipt data={tree} />}
          </div>
        </div>
      </section>

      <footer className="colophon">
        <div className="rule-line">
          <span>filed under MIT</span>
          <a href="https://github.com/kantord/insane-forms">github.com/kantord/insane-forms</a>
          <a href="./storybook/">storybook — every piece in isolation</a>
          <span>the same example drives the automated suite</span>
        </div>
      </footer>
    </div>
  )
}
