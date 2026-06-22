// Tier-2 (JSX) version of the api-docs consumer. Same behavior as docs/api.eso.mjs, authored as JSX:
// `defineTarget` is a KIND (no `desired`); each <ApiStub …/> is one desired item; the program returns
// the tree (instances via .map inside a component). Observe-the-world current; full enter/update/exit.
//   esto run docs/api.eso.jsx            # apply
//   esto run --dry-run docs/api.eso.jsx  # show the diff
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { defineTarget, Fragment, h, sh } from 'esto'

const OUT = 'docs/api'

const write = (i) => {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(
    `${OUT}/${i.name}.md`,
    `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`,
  )
}

// A KIND: key/value + observe-the-world (read the stubs' embedded sig back) + reactions. No `desired`.
const ApiStub = defineTarget({
  key: (i) => i.name,
  value: (i) => i.sig,
  observe: () =>
    existsSync(OUT)
      ? readdirSync(OUT)
          .filter((f) => f.endsWith('.md'))
          .map((f) => {
            const m = readFileSync(`${OUT}/${f}`, 'utf8').match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
            return { name: f.slice(0, -3), sig: m ? m[1] : '' }
          })
      : [],
  enter: (i) => write(i),
  update: (i) => write(i),
  exit: (i) => rmSync(`${OUT}/${i.name}.md`, { force: true }),
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
