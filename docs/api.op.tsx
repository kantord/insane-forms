// docs/api.op.tsx — keep one generated API-doc stub (docs/api/<Name>.md) per public export of
// the published core. Observe-the-world current (the stub's embedded sig IS the state — no persisted
// file); full enter/update/exit lifecycle. Enumerator: `pnpm api:json` (typedoc resolves the surface,
// jq shapes it — no custom script); `sig` = esto's hash() over each export's typedoc shape.
// Effects via `sh`; observation via esto's owned read API (`read`/`ls`). No `node:*` imports.
//   esto run docs/api.op.tsx            # apply
//   esto run --dry-run docs/api.op.tsx  # show the diff
import { defineTarget, Fragment, h, hash, ls, read, sh } from 'esto'

interface ApiItem {
  name: string
  file: string
  hasDoc: boolean
  shape: unknown
}
interface Export {
  name: string
  file?: string
  sig: string
}

const OUT = 'docs/api'

// EFFECT: build the body in JS, write it via `sh` (content shell-quoted by the tag).
const writeStub = (i: Export): void => {
  const body = `<!-- esto:sig=${i.sig} -->\n# \`${i.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${i.file}\`.\n`
  sh`mkdir -p ${OUT}`
  sh`printf '%s' ${body} > ${OUT}/${i.name}.md`
}

const ApiStub = defineTarget({
  key: (i: Export): string => i.name,
  value: (i: Export): string => i.sig, // fingerprint → update when an export's shape changes
  // CURRENT: observe the world — read each stub's embedded sig back out.
  observe: (): Export[] =>
    ls(OUT)
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => {
        const m = read(`${OUT}/${f}`).match(/^<!-- esto:sig=([a-f0-9]+) -->/m)
        return { name: f.slice(0, -3), sig: m ? m[1] : '' }
      }),
  enter: (i: Export): void => writeStub(i),
  update: (i: Export): void => writeStub(i),
  exit: (i: Export): void => {
    sh`rm -f ${OUT}/${i.name}.md`
  },
})

// DESIRED: the public API surface from `pnpm api:json` (typedoc + jq). sig = hash of the shape.
const PublicApi = (): unknown =>
  (JSON.parse(sh`pnpm -s api:json`) as ApiItem[]).map((x) => (
    <ApiStub name={x.name} file={x.file} sig={hash(JSON.stringify(x.shape))} />
  ))

export default (): unknown => (
  <Fragment>
    <PublicApi />
  </Fragment>
)
