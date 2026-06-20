#!/usr/bin/env node
// Build-time coverage gate for the code-panel "no black boxes" invariant.
//
// Parses packages/examples/fields.tsx with the TypeScript compiler, collects every
// "meaningful" symbol shown in the code panel (PascalCase identifiers + `insane.*`),
// classifies each by import source / declaration, and reports the ones that are
// neither linked nor exempt. Exits non-zero if any remain (CI gate).
//
//   node check.mjs            # report + exit 1 if uncovered
//   node check.mjs --json     # machine-readable {covered,uncovered:[...]}
//
// This is a plain invariant check (desired = "everything covered", a constant), so it
// is a single pass — no reconcile engine needed. Coverage decisions live in the two
// shared config files next to the plugin, so a symbol is "covered" here iff it actually
// renders a link in the panel.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const asJson = process.argv.includes('--json')

// This file lives in apps/storybook/.storybook/ — resolve the repo root from here.
const storybookDir = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(storybookDir, '../../..')
const fieldsFile = path.join(REPO, 'packages/examples/fields.tsx')
const registryFile = path.join(storybookDir, 'shadcn-registry.json')
const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}
const crossref = readJson(path.join(storybookDir, 'code-panel-crossref.json'), {}) // symbol -> URL
const exempt = new Set(readJson(path.join(storybookDir, 'code-panel-exempt.json'), [])) // symbols to ignore

// registry: components/ui/<file> basename -> has Base/Radix docs (i.e. linkable)
const registry = new Set()
for (const item of readJson(registryFile, [])) {
  if (!(item.meta?.links?.base?.docs ?? item.meta?.links?.radix?.docs)) continue
  for (const f of item.files ?? []) {
    const b = f.path
      .split('/')
      .pop()
      ?.replace(/\.tsx?$/, '')
    if (b) registry.add(b)
  }
}

// JS/TS globals + common utility types — PascalCase but never "black boxes".
const BUILTINS = new Set([
  'Array',
  'Object',
  'Date',
  'Number',
  'String',
  'Boolean',
  'Promise',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'RegExp',
  'Error',
  'Symbol',
  'BigInt',
  'Math',
  'JSON',
  'Proxy',
  'Reflect',
  'Function',
  'Partial',
  'Required',
  'Readonly',
  'Record',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'Awaited',
])

const src = readFileSync(fieldsFile, 'utf8')
const sf = ts.createSourceFile('fields.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

// import map: local name -> module specifier; top-level exported names.
const importModule = new Map()
const exported = new Set()
for (const st of sf.statements) {
  if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
    const mod = st.moduleSpecifier.text
    const c = st.importClause
    if (!c) continue
    if (c.name) importModule.set(c.name.text, mod) // default
    const nb = c.namedBindings
    if (nb && ts.isNamespaceImport(nb)) importModule.set(nb.name.text, mod)
    if (nb && ts.isNamedImports(nb)) for (const e of nb.elements) importModule.set(e.name.text, mod)
    continue
  }
  const isExport =
    ts.canHaveModifiers(st) &&
    ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  if (!isExport) continue
  if (ts.isVariableStatement(st)) {
    for (const d of st.declarationList.declarations)
      if (ts.isIdentifier(d.name)) exported.add(d.name.text)
  } else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) {
    exported.add(st.name.text)
  }
}

// One walk: collect shown symbols + ALL local declaration names (any depth) +
// type-parameter names. Skip import statements (not part of the displayed slices).
const isPascal = (s) => /^[A-Z][A-Za-z0-9]*$/.test(s)
const shown = new Set()
const localDecls = new Set()
const typeParams = new Set()
const declName = (n) => (n && ts.isIdentifier(n) ? n.text : undefined)
const visit = (node) => {
  if (ts.isImportDeclaration(node)) return
  if (ts.isTypeParameterDeclaration(node)) typeParams.add(node.name.text)
  if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
    const n = declName(node.name)
    if (n) localDecls.add(n)
  }
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isClassDeclaration(node)) &&
    node.name
  )
    localDecls.add(node.name.text)
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'insane'
  ) {
    shown.add(`insane.${node.name.text}`)
  }
  if (ts.isIdentifier(node) && isPascal(node.text)) shown.add(node.text)
  ts.forEachChild(node, visit)
}
visit(sf)
for (const tp of typeParams) shown.delete(tp) // generics aren't references

const classify = (sym) => {
  if (sym.startsWith('insane.')) return { class: 'core', source: 'insane-forms' }
  if (BUILTINS.has(sym)) return { class: 'builtin', source: 'js/ts' }
  const mod = importModule.get(sym)
  if (mod?.startsWith('@/components/ui/'))
    return { class: 'shadcn', source: mod, file: mod.split('/').pop() }
  if (mod === 'insane-forms') return { class: 'core', source: mod }
  if (mod) return { class: 'external', source: mod }
  if (localDecls.has(sym))
    return { class: 'local', source: 'fields.tsx', exported: exported.has(sym) }
  return { class: 'unknown', source: '?' }
}

const SUGGEST = {
  shadcn:
    'shadcn primitive missing from the registry — refresh shadcn-registry.json (vendor:registry).',
  core: 'insane-forms core symbol — add a URL to code-panel-crossref.json, or list in code-panel-exempt.json.',
  local:
    'our own symbol — exported bindings/shells: add to code-panel-crossref.json; internal helpers: code-panel-exempt.json.',
  external: 'external lib — auto-exempt; add a crossref URL only if you want it linked.',
  builtin: 'JS/TS built-in — auto-exempt.',
  unknown: 'unresolved — inspect; add to code-panel-crossref.json or code-panel-exempt.json.',
}

const uncovered = []
let covered = 0
for (const sym of [...shown].sort()) {
  const c = classify(sym)
  const ok =
    (c.class === 'shadcn' && registry.has(c.file)) ||
    crossref[sym] ||
    exempt.has(sym) ||
    c.class === 'external' ||
    c.class === 'builtin'
  if (ok) covered++
  else uncovered.push({ symbol: sym, ...c, suggestion: SUGGEST[c.class] })
}

if (asJson) {
  console.log(JSON.stringify({ covered, uncovered }, null, 2))
} else if (uncovered.length === 0) {
  console.log(`✓ code-panel coverage: ${covered} symbols, no black boxes.`)
} else {
  console.error(`✗ code-panel coverage: ${uncovered.length} black box(es) (${covered} covered):\n`)
  for (const u of uncovered)
    console.error(
      `  ${u.symbol}  [${u.class}${u.exported === false ? ', internal' : ''}]\n    ${u.suggestion}`,
    )
  console.error(
    '\nResolve each via apps/storybook/.storybook/code-panel-crossref.json (link) or code-panel-exempt.json (ignore).',
  )
}
process.exit(uncovered.length === 0 ? 0 : 1)
