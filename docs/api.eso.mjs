// First real `esto run` consumer for insane-forms: keep one generated API-doc stub
// (docs/api/<Name>.md) per public export of the published core. Observe-the-world current
// (the stubs' embedded sig is the state — no persisted file), full enter/update/exit lifecycle.
//
// Correct-shape esto program: EFFECTS via `sh` (the one effect primitive); OBSERVATION via
// esto's tiny owned read API (`read`/`ls`). No `node:*` imports — esto is not Node.
//   esto run docs/api.eso.mjs            # apply
//   esto run --dry-run docs/api.eso.mjs  # show the diff (CI gate)
import { defineTarget, ls, read, sh } from 'esto'

const OUT = 'docs/api'

// DESIRED: the public API surface (name + signature hash), from the TS-compiler enumerator.
const desired = () =>
  JSON.parse(sh`node packages/core/scripts/list-exports.mjs`).map((x) => ({
    name: x.name,
    file: x.file,
    sig: x.sig,
  }))

// CURRENT: observe the world — read each generated stub's embedded sig back out.
const observe = () =>
  ls(OUT)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const m = read(`${OUT}/${f}`).match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
      return { name: f.slice(0, -3), sig: m ? m[1] : '' }
    })

// EFFECT: build the body in JS, write it via `sh` (content shell-quoted by the tag).
const writeStub = (i) => {
  const body = `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`
  sh`mkdir -p ${OUT}`
  sh`printf '%s' ${body} > ${OUT}/${i.name}.md`
}

export default defineTarget({
  key: (i) => i.name,
  value: (i) => i.sig, // fingerprint → drives update when an export's shape changes
  desired,
  observe,
  enter: (i) => writeStub(i), // new export → create its stub
  update: (i) => writeStub(i), // signature changed → regenerate
  exit: (i) => sh`rm -f ${OUT}/${i.name}.md`, // export gone → remove orphan
})
