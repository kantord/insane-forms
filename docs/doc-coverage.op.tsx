// docs/doc-coverage.op.tsx — INVARIANT, stated positively: every public export of the core has a
// JsDoc. You DESCRIBE the desired state — a <JsDoc/> for every export — and esto computes where it's
// unmet (missing → `enter` → a grounded prompt task an agent fulfills). There is no "violation" list:
// `observe()` returns the exports that ALREADY satisfy it; the diff is the gap.
//
// Enumerator: `pnpm api:json` (typedoc resolves the surface + jq shapes hasDoc — no custom script),
// run once and shared by desired (all exports) and observe (the documented subset).
//   esto run docs/doc-coverage.op.tsx            # emit a grounded task per export still missing a doc
//   esto run --dry-run docs/doc-coverage.op.tsx  # list them, write nothing
import { Context, defineTarget, Fragment, h, prompt, sh } from 'esto'

interface ApiItem {
  name: string
  file: string
  hasDoc: boolean
}

// One typedoc run, shared by the desired set (all exports) and observe (the satisfied subset).
const API = JSON.parse(sh`pnpm -s api:json`) as ApiItem[]

// A JsDoc is a constituent that SHOULD be present on each export. `observe()` = the exports that
// already have one; esto diffs desired-vs-observe, so an export with no doc surfaces as `enter`.
const JsDoc = defineTarget({
  key: (x: ApiItem): string => x.name,
  value: (_x: ApiItem): string => 'present',
  observe: (): ApiItem[] => API.filter((x) => x.hasDoc),
  enter: (x: ApiItem) =>
    prompt`Add a JSDoc \`/** … */\` to the public export \`${x.name}\` in \`packages/core/src/${x.file}\`.
Be concise and contract-focused: what it does, its parameters, what it returns. Match the voice of the
already-documented siblings in that file. Then re-run \`pnpm run check:docs\` — it must pass.`,
})

// Subject scope: every public export should have a JsDoc. (Bare nesting <PublicExports><JsDoc/></…>
// awaits esto's defineScope + structured item context; until then the scope emits the instances.)
const PublicExports = (): unknown => API.map((x) => <JsDoc name={x.name} file={x.file} />)

// Grounding: repo + package context flows down to every task (content-addressed, deduped across tasks).
export default (): unknown => (
  <Context value="Repo: insane-forms — schema-driven React forms on Zod; pnpm monorepo. See CLAUDE.md / quality-gates skill.">
    <Context value="packages/core = the ONLY published package (`insane-forms`): named exports only, tree-shakeable, ZERO runtime deps, no DOM in core. Public surface = src/index.ts (resolved via the TS checker).">
      <Fragment>
        <PublicExports />
      </Fragment>
    </Context>
  </Context>
)
