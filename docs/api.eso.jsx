// Tier-2 (JSX) version of the api-docs consumer. Same behavior as docs/api.eso.mjs, authored as JSX:
// `defineTarget` is a KIND (no `desired`); each <ApiStub …/> is one desired item; the program returns
// the tree (instances via .map inside a component). Observe-the-world current; full enter/update/exit.
//
// Correct-shape esto program: EFFECTS via `sh`; OBSERVATION via esto's owned read API (`read`/`ls`).
// No `node:*` imports.
//   esto run docs/api.eso.jsx            # apply
//   esto run --dry-run docs/api.eso.jsx  # show the diff
import { defineTarget, Fragment, h, ls, read, sh } from 'esto'

const OUT = 'docs/api'

const writeStub = (i) => {
  const body = `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`
  sh`mkdir -p ${OUT}`
  sh`printf '%s' ${body} > ${OUT}/${i.name}.md`
}

// A KIND: key/value + observe-the-world (read the stubs' embedded sig back) + reactions. No `desired`.
const ApiStub = defineTarget({
  key: (i) => i.name,
  value: (i) => i.sig,
  observe: () =>
    ls(OUT)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const m = read(`${OUT}/${f}`).match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
        return { name: f.slice(0, -3), sig: m ? m[1] : '' }
      }),
  enter: (i) => writeStub(i),
  update: (i) => writeStub(i),
  exit: (i) => sh`rm -f ${OUT}/${i.name}.md`,
})

// A component: enumerate the public API and emit one <ApiStub/> instance per export.
const PublicApi = () =>
  JSON.parse(sh`node packages/core/scripts/list-exports.mjs`).map((x) => (
    <ApiStub name={x.name} file={x.file} sig={x.sig} />
  ))

export default () => (
  <Fragment>
    <PublicApi />
  </Fragment>
)
