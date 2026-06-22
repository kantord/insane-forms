#!/usr/bin/env node
// Emit the public API surface of insane-forms as JSON: [{ name, file, sig }].
// Public surface = runtime exports of insane.tsx + the explicit `export type {…}` list
// in index.ts (declared in types.ts). `sig` = a short hash of the declaration text, so it
// changes when the export's shape changes (drives `update` in a reconcile). Sibling of check-docs.mjs.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(CORE, 'src')
const parse = (f) => {
  const text = readFileSync(f, 'utf8')
  return { text, sf: ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) }
}
const sig = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8)

// Public type names: the `export type { … } from './types'` block in index.ts.
const index = parse(path.join(SRC, 'index.ts'))
const publicTypes = new Set()
index.sf.forEachChild((n) => {
  if (
    ts.isExportDeclaration(n) &&
    n.exportClause &&
    ts.isNamedExports(n.exportClause) &&
    n.moduleSpecifier?.getText(index.sf).includes('./types')
  )
    for (const e of n.exportClause.elements) publicTypes.add(e.name.text)
})

const isExported = (n) =>
  ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

const byName = new Map()
const collect = (file, { runtime = false } = {}) => {
  const { sf } = parse(file)
  const base = path.basename(file)
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
    const s = sig(node.getText(sf))
    for (const name of names) {
      if (!(runtime || publicTypes.has(name))) continue
      const prev = byName.get(name) // overloads: fold their text together so sig is stable
      byName.set(name, { name, file: base, sig: prev ? sig(prev.sig + s) : s })
    }
  })
}
collect(path.join(SRC, 'insane.tsx'), { runtime: true })
collect(path.join(SRC, 'types.ts'))

process.stdout.write(JSON.stringify([...byName.values()]))
