// Tier-3 (agentic) consumer: every undocumented PUBLIC export of the core becomes a GROUNDED
// prompt task (tasks/<name>.md) an agent can fulfill — the first reaction that's a prompt, not a
// mechanical file write. Reuses the existing check-docs.mjs gate as the enumerator.
//   esto run docs/doc-coverage.eso.jsx            # emit a grounded task per undocumented export
//   esto run --dry-run docs/doc-coverage.eso.jsx  # list them, write nothing
import { defineTarget, h, Context, Fragment, prompt, sh } from 'esto'

// A KIND whose reaction is a PROMPT. observe() = [] (these are gaps to fill, not artifacts to track),
// so every desired item is an `enter` → one grounded task. value is constant; the gap either exists or not.
const UndocumentedExport = defineTarget({
  key: (i) => i.name,
  value: () => 'undocumented',
  observe: () => [],
  enter: (i) =>
    prompt`Add a JSDoc \`/** … */\` comment to the public export \`${i.name}\` in \`packages/core/src/${i.file}\`.
Be concise and contract-focused: what it does, its parameters, what it returns. Match the voice of the
already-documented siblings in that file. Then re-run \`pnpm run check:docs\` — it must pass.`,
})

// DESIRED = the undocumented public exports, straight from the existing gate's --json output.
const Undocumented = () =>
  JSON.parse(sh`node packages/core/scripts/check-docs.mjs --json || true`).undocumented.map((x) => (
    <UndocumentedExport name={x.name} file={x.file} />
  ))

// Grounding: repo + package context flows down to every task (content-addressed, deduped across tasks).
export default () => (
  <Context value="Repo: insane-forms — schema-driven React forms on Zod; pnpm monorepo. See CLAUDE.md / quality-gates skill.">
    <Context value="packages/core = the ONLY published package (`insane-forms`): named exports only, tree-shakeable, ZERO runtime deps, no DOM in core. Public surface = the `export type {…}` list in index.ts + runtime exports of insane.tsx.">
      <Fragment>
        <Undocumented />
      </Fragment>
    </Context>
  </Context>
)
