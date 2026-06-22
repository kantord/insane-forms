#!/usr/bin/env node
// Build-time gate: every PUBLIC export of insane-forms must carry a JSDoc comment.
// The public surface comes from public-api.mjs (TS checker, resolves `export *`); this is
// just the gate over it.
//   node scripts/check-docs.mjs           # report + exit 1 if any undocumented
//   node scripts/check-docs.mjs --json    # machine-readable list
import { publicApi } from './public-api.mjs'

const asJson = process.argv.includes('--json')
const api = publicApi()
const undocumented = api.filter((e) => !e.hasDoc)
const documented = api.length - undocumented.length

if (asJson) {
  console.log(JSON.stringify({ total: api.length, documented, undocumented }, null, 2))
} else if (undocumented.length === 0) {
  console.log(`✓ public API docs: ${documented}/${api.length} exports documented.`)
} else {
  console.error(
    `✗ public API docs: ${undocumented.length} undocumented (${documented}/${api.length}):\n`,
  )
  for (const u of undocumented) console.error(`  ${u.name}  [${u.file}]`)
  console.error('\nAdd a /** … */ JSDoc to each public export.')
}
process.exit(undocumented.length === 0 ? 0 : 1)
