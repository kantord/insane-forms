// docs/api.op.tsx — keep one generated API-doc stub (docs/api/<Name>.md) per public export of
// the published core. Observe-the-world current (the stub's embedded sig IS the state — no persisted
// file); full enter/update/exit lifecycle. Enumerator: public-api.mjs (TS checker, resolves export*).
// Effects: node:fs writes + `sh` for delete (esto's node:fs shim has no rmSync).
//   esto run docs/api.op.tsx            # apply
//   esto run --dry-run docs/api.op.tsx  # show the diff
import { defineTarget, Fragment, h, sh } from 'esto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

interface Export {
  name: string
  file?: string
  sig: string
}

const OUT = 'docs/api'

const writeStub = (i: Export): void => {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(
    `${OUT}/${i.name}.md`,
    `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`,
  )
}

const ApiStub = defineTarget({
  key: (i: Export): string => i.name,
  value: (i: Export): string => i.sig, // fingerprint → update when an export's shape changes
  // CURRENT: observe the world — read each stub's embedded sig back out.
  observe: (): Export[] =>
    (existsSync(OUT) ? readdirSync(OUT) : [])
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => {
        const m = readFileSync(`${OUT}/${f}`, 'utf8').match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
        return { name: f.slice(0, -3), sig: m ? m[1] : '' }
      }),
  enter: (i: Export): void => writeStub(i),
  update: (i: Export): void => writeStub(i),
  exit: (i: Export): void => {
    sh`rm -f ${OUT}/${i.name}.md`
  },
})

// DESIRED: the public API surface (name + file + signature hash).
const PublicApi = (): unknown =>
  (JSON.parse(sh`node packages/core/scripts/public-api.mjs`) as Export[]).map((x) => (
    <ApiStub name={x.name} file={x.file} sig={x.sig} />
  ))

export default (): unknown => (
  <Fragment>
    <PublicApi />
  </Fragment>
)
