// docs/doc-coverage.op.tsx — INVARIANT, stated positively: every TS export of the core has a JsDoc.
// Shape: <GitRepo>{({File}) => <File glob>{({file}) => <TsExports of={file}>{({name}) => <JsDoc/>}}}.
//   • GitRepo / File  = filesystem locators (render-props; File is capability-injected by GitRepo,
//     already rooted). Userland — just closures + `sh`.
//   • TsExports of={file} = a per-file TS scope (NOT a filesystem locator): the typedoc `api:json`
//     surface, filtered to exports declared in that file.
//   • JsDoc = the constituent, positive: observe() = exports that already have a doc; esto computes
//     the gap → `enter` → a grounded prompt task.
//
// PENDING esto features (this file runs end-to-end once they land; reconcile logic proven via a
// `unit`-based /tmp proxy today):
//   1. defineTarget→unit rename (in flight in the esto worktree) — kept on committed `defineTarget`.
//   2. relative imports (`./scopes.mjs`) — broken, so locators are inlined here instead of shared.
//   3. data-ctx accumulation — not built; the data-ctx attributes below are inert grounding for now.
//   esto run docs/doc-coverage.op.tsx            # emit a grounded task per export missing a doc
//   esto run --dry-run docs/doc-coverage.op.tsx  # list them, write nothing
import { defineTarget, h, prompt, sh } from 'esto'

interface ApiItem {
  name: string
  file: string
  hasDoc: boolean
}
type RenderProp<T> = (scope: T) => unknown
const rp = <T,>(children: unknown): RenderProp<T> =>
  (Array.isArray(children) ? children[0] : children) as RenderProp<T>

// ── filesystem locators (inline until esto resolves relative imports → a shared `scopes` module) ──
const makeFile =
  (root: string) =>
  ({ glob, children }: { glob: string; children: unknown }) => {
    const i = glob.lastIndexOf('/')
    const dir = glob.slice(0, i)
    const pat = glob.slice(i + 1)
    const cb = rp<{ file: string }>(children)
    return sh`find ${root}/${dir} -maxdepth 1 -name ${pat} -type f`
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((f: string) => cb({ file: f.replace(`${root}/`, '') }))
  }
const GitRepo = ({ children }: { children: unknown }) =>
  rp<{ File: ReturnType<typeof makeFile> }>(children)({
    File: makeFile(sh`git rev-parse --show-toplevel`.trim()),
  })

// ── per-file TS scope: the resolved surface (typedoc api:json), filtered to this file ──
const API = JSON.parse(sh`pnpm -s api:json`) as ApiItem[]
const TsExports = ({ of, children }: { of: string; children: unknown }) => {
  const base = of.split('/').pop()
  const cb = rp<{ name: string; file: string }>(children)
  return API.filter((x) => x.file === base).map((x) => cb({ name: x.name, file: x.file }))
}

// ── the invariant: a JsDoc should be present on every export (positive; observe = the documented set) ──
const JsDoc = defineTarget({
  key: (x: ApiItem): string => x.name,
  value: (_x: ApiItem): string => 'present',
  observe: (): ApiItem[] => API.filter((x) => x.hasDoc),
  enter: (x: { name: string; file: string }) =>
    prompt`Add a JSDoc \`/** … */\` to the public export \`${x.name}\` in \`packages/core/src/${x.file}\`.
Be concise and contract-focused: what it does, its parameters, what it returns. Match the voice of the
already-documented siblings in that file. Then re-run \`pnpm run check:docs\` — it must pass.`,
})

export default (): unknown => (
  <GitRepo data-ctx="insane-forms — schema-driven React forms on Zod; pnpm monorepo. See CLAUDE.md / quality-gates.">
    {({ File }) => (
      <File
        glob="packages/core/src/*.ts*"
        data-ctx="packages/core = the ONLY published package: named exports only, zero runtime deps, no DOM."
      >
        {({ file }) => (
          <TsExports of={file}>{({ name }) => <JsDoc name={name} file={file} />}</TsExports>
        )}
      </File>
    )}
  </GitRepo>
)
