// docs/doc-coverage.op.tsx — Tier-3 (agentic): every undocumented PUBLIC export of the core becomes
// a GROUNDED prompt task (tasks/<name>.md) an agent fulfills — the reaction is a prompt, not a file
// write. Enumerator: check-docs.mjs --json (TS checker). observe() = [] (these are gaps to fill, not
// artifacts to track), so every desired item is an `enter` → one grounded task.
//   esto run docs/doc-coverage.op.tsx            # emit a grounded task per undocumented export
//   esto run --dry-run docs/doc-coverage.op.tsx  # list them, write nothing
import { Context, defineTarget, Fragment, h, prompt, sh } from 'esto'

interface Export {
  name: string
  file: string
}

const UndocumentedExport = defineTarget({
  key: (i: Export): string => i.name,
  value: (_i: Export): string => 'undocumented',
  observe: (): Export[] => [],
  enter: (i: Export) =>
    prompt`Add a JSDoc \`/** … */\` comment to the public export \`${i.name}\` in \`packages/core/src/${i.file}\`.
Be concise and contract-focused: what it does, its parameters, what it returns. Match the voice of the
already-documented siblings in that file. Then re-run \`pnpm run check:docs\` — it must pass.`,
})

interface DocsJson {
  undocumented: Export[]
}

// DESIRED: the undocumented public exports, from the existing gate's --json output.
const Undocumented = (): unknown =>
  (JSON.parse(sh`node packages/core/scripts/check-docs.mjs --json || true`) as DocsJson).undocumented.map(
    (x) => <UndocumentedExport name={x.name} file={x.file} />,
  )

// Grounding: repo + package context flows down to every task (content-addressed, deduped across tasks).
export default (): unknown => (
  <Context value="Repo: insane-forms — schema-driven React forms on Zod; pnpm monorepo. See CLAUDE.md / quality-gates skill.">
    <Context value="packages/core = the ONLY published package (`insane-forms`): named exports only, tree-shakeable, ZERO runtime deps, no DOM in core. Public surface = src/index.ts (resolved via the TS checker).">
      <Fragment>
        <Undocumented />
      </Fragment>
    </Context>
  </Context>
)
