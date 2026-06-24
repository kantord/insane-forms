// docs/api.op.tsx — manage docs/api/ as a tree: one generated stub per public export of the core.
// Supervisor-as-matcher form: <Folder name="docs/api"> is a scope; each <File name content> is a CLAIM.
//   • create  — an export with no stub yet
//   • update  — the stub's bytes differ from `content`
//   • keep    — bytes match
//   • prune   — a .md in docs/api claimed by no export (orphan) → deleted (within circuit-breaker limits)
// The supervisor compares actual file bytes vs `content`, so no sig marker is needed. Enumerator:
// `pnpm api:json` (typedoc + jq, no custom script).
//   esto run docs/api.op.tsx            # apply
//   esto run --dry-run docs/api.op.tsx  # show create/update/keep/prune, write nothing
import { h, sh } from 'esto'
import { GitRepo } from 'esto/fs'

interface ApiItem {
  name: string
  file: string
}

const exports = JSON.parse(sh`pnpm -s api:json`) as ApiItem[]

const stub = (x: ApiItem): string =>
  `# \`${x.name}\`\n\nPublic API of \`insane-forms\` — declared in \`packages/core/src/${x.file}\`.\n`

export default (): unknown => (
  <GitRepo>
    {({ Folder }) => (
      <Folder name="docs/api">
        {({ File }) => exports.map((x) => <File name={`${x.name}.md`} content={stub(x)} />)}
      </Folder>
    )}
  </GitRepo>
)
