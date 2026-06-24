// docs/doc-coverage.op.tsx — INVARIANT, stated positively: every TS export of the core has a JsDoc.
// Shape: <Context data>…<GitRepo>{({File}) => <File glob>{({file}) => <TsExports of={file}>{({name}) => <JsDoc/>}}}.
//   • GitRepo / File  = filesystem locators (capability-injected render-props) from ./scopes.op.mjs.
//   • TsExports of={file} = a per-file TS scope (typedoc api:json, filtered to that file).
//   • JsDoc = the constituent, positive: observe() = exports that already have a doc; esto computes
//     the gap → `enter` → a grounded prompt task.
//   • <Context data={…}> = grounding: the data flows down and is emitted as a Structured-context
//     section in each task (content-addressed in esto).
//   esto run docs/doc-coverage.op.tsx            # emit a grounded task per export missing a doc
//   esto run --dry-run docs/doc-coverage.op.tsx  # list them, write nothing
import { Context, h, prompt, sh, unit } from 'esto'
import { GitRepo } from 'esto/fs'

interface ApiItem {
  name: string
  file: string
  hasDoc: boolean
}

// esto/fs locators unwrap render-prop children internally; userland render-props (TsExports) still do.
const rp = (children: unknown) =>
  (Array.isArray(children) ? children[0] : children) as (scope: { name: string; file: string }) => unknown

// The resolved public surface (typedoc), run once and shared by desired (per file) and observe.
const API = JSON.parse(sh`pnpm -s api:json`) as ApiItem[]

// Per-file TS scope: the exports declared in `of`, as render-prop instances. NOT a filesystem locator.
const TsExports = ({ of, children }: { of: string; children: unknown }) => {
  const base = of.split('/').pop()
  return API.filter((x) => x.file === base).map((x) =>
    rp(children)({ name: x.name, file: x.file }),
  )
}

// The invariant: a JsDoc should be present on every export. observe() = the documented set; the diff
// surfaces the undocumented ones as `enter`.
const JsDoc = unit({
  key: (x: ApiItem): string => x.name,
  value: (_x: ApiItem): string => 'present',
  observe: (): ApiItem[] => API.filter((x) => x.hasDoc),
  enter: (x: { name: string; file: string }) =>
    prompt`Add a JSDoc \`/** … */\` to the public export \`${x.name}\` in \`packages/core/src/${x.file}\`.
Be concise and contract-focused: what it does, its parameters, what it returns. Match the voice of the
already-documented siblings in that file. Then re-run \`pnpm run check:docs\` — it must pass.`,
})

export default (): unknown => (
  <Context data={{ repo: 'insane-forms — schema-driven React forms on Zod; pnpm monorepo' }}>
    <GitRepo>
      {({ File }) => (
        <Context data={{ pkg: 'packages/core — the only published package: named exports, zero runtime deps, no DOM' }}>
          <File glob="packages/core/src/*.ts*">
            {({ file }) => (
              <TsExports of={file}>{({ name, file }) => <JsDoc name={name} file={file} />}</TsExports>
            )}
          </File>
        </Context>
      )}
    </GitRepo>
  </Context>
)
