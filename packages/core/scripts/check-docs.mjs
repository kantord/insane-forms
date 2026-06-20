#!/usr/bin/env node
// Build-time gate: every PUBLIC export of insane-forms must carry a JSDoc comment.
//
// The public surface is what src/index.ts re-exports: `export * from './insane'`
// (all top-level runtime exports of insane.tsx) + the explicit `export type { … }`
// list from ./types. For each, we check for a leading JSDoc (/** … */) via the
// TypeScript compiler's comment ranges. Exits non-zero listing any undocumented.
//
//   node scripts/check-docs.mjs           # report + exit 1 if any undocumented
//   node scripts/check-docs.mjs --json    # machine-readable list

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const asJson = process.argv.includes('--json')
const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(CORE, 'src')

const parse = (file) => {
  const text = readFileSync(file, 'utf8')
  return {
    text,
    sf: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
  }
}

// Public type names: the `export type { … } from './types'` block in index.ts.
const index = parse(path.join(SRC, 'index.ts'))
const publicTypeNames = new Set()
index.sf.forEachChild((node) => {
  if (
    ts.isExportDeclaration(node) &&
    node.exportClause &&
    ts.isNamedExports(node.exportClause) &&
    node.moduleSpecifier?.getText(index.sf).includes('./types')
  ) {
    for (const e of node.exportClause.elements) publicTypeNames.add(e.name.text)
  }
})

// A declaration is "documented" if it has a leading /** … */ JSDoc block.
const hasJsDoc = (node, text) => {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []
  return ranges.some(
    (r) =>
      r.kind === ts.SyntaxKind.MultiLineCommentTrivia && text.slice(r.pos, r.pos + 3) === '/**',
  )
}

// Collect public exports from a file: runtime (all exported decls) or only those
// whose name is in `nameFilter` (for the type surface).
const collect = (file, { runtime = false } = {}) => {
  const { text, sf } = parse(file)
  const out = []
  const isExported = (n) =>
    ts.canHaveModifiers(n) &&
    ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  sf.forEachChild((node) => {
    let names = []
    if (ts.isVariableStatement(node) && isExported(node))
      names = node.declarationList.declarations.map((d) => d.name.getText(sf))
    else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      isExported(node) &&
      node.name
    )
      names = [node.name.text]
    if (!names.length) return
    const documented = hasJsDoc(node, text)
    for (const name of names) {
      if (runtime || publicTypeNames.has(name))
        out.push({
          name,
          file: path.basename(file),
          documented,
          kind: runtime ? 'runtime' : 'type',
        })
    }
  })
  return out
}

const raw = [
  ...collect(path.join(SRC, 'insane.tsx'), { runtime: true }),
  ...collect(path.join(SRC, 'types.ts')),
]
// Dedup by name (a function may have several overload signatures): documented if ANY carries a JSDoc.
const byName = new Map()
for (const e of raw) {
  const prev = byName.get(e.name)
  if (!prev) byName.set(e.name, { ...e })
  else prev.documented = prev.documented || e.documented
}
const exportsList = [...byName.values()]
const undocumented = exportsList
  .filter((e) => !e.documented)
  .sort((a, b) => a.name.localeCompare(b.name))
const documented = exportsList.length - undocumented.length

if (asJson) {
  console.log(JSON.stringify({ total: exportsList.length, documented, undocumented }, null, 2))
} else if (undocumented.length === 0) {
  console.log(`✓ public API docs: ${documented}/${exportsList.length} exports documented.`)
} else {
  console.error(
    `✗ public API docs: ${undocumented.length} undocumented (${documented}/${exportsList.length}):\n`,
  )
  for (const u of undocumented) console.error(`  ${u.name}  [${u.kind}, ${u.file}]`)
  console.error('\nAdd a /** … */ JSDoc to each public export.')
}
process.exit(undocumented.length === 0 ? 0 : 1)
