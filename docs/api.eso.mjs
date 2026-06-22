// First real `esto run` consumer for insane-forms: keep one generated API-doc stub
// (docs/api/<Name>.md) per public export of the published core. Observe-the-world current
// (the stubs' embedded sig is the state — no persisted file), full enter/update/exit lifecycle.
//   esto run docs/api.eso.mjs            # apply
//   esto run --dry-run docs/api.eso.mjs  # show the diff (CI gate)

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { defineTarget, sh } from 'esto'

const OUT = 'docs/api'

// DESIRED: the public API surface (name + signature hash), from the TS-compiler enumerator.
const desired = () =>
  JSON.parse(sh`node packages/core/scripts/list-exports.mjs`).map((x) => ({
    name: x.name,
    file: x.file,
    sig: x.sig,
  }))

// CURRENT: observe the world — read each generated stub's embedded sig back out (Node fs, robust).
const observe = () => {
  if (!existsSync(OUT)) return []
  return readdirSync(OUT)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const m = readFileSync(`${OUT}/${f}`, 'utf8').match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
      return { name: f.slice(0, -3), sig: m ? m[1] : '' }
    })
}

const write = (i) => {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(
    `${OUT}/${i.name}.md`,
    `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`,
  )
}

export default defineTarget({
  key: (i) => i.name,
  value: (i) => i.sig, // fingerprint → drives update when an export's shape changes
  desired,
  observe,
  enter: (i) => write(i), // new export → create its stub
  update: (i) => write(i), // signature changed → regenerate
  exit: (i) => rmSync(`${OUT}/${i.name}.md`, { force: true }), // export gone → remove orphan
})
