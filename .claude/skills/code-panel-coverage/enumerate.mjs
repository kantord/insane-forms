#!/usr/bin/env node
// Enumerator for the code-panel "no black boxes" reconcile.
//
// Parses packages/examples/fields.tsx (the binding/shell/widget definitions the
// code panel displays) with the TypeScript compiler API, collects every
// "meaningful" symbol shown (PascalCase identifiers + `insane.*` calls), and
// classifies each by its import source / declaration:
//   shadcn   – imported from @/components/ui/<file> (covered iff <file> is in the registry → it auto-links)
//   core     – imported from insane-forms (or an `insane.*` member)
//   external – imported from react/lucide/zod/etc (auto-exempt by policy)
//   local    – defined in fields.tsx (our binding/shell/widget → wants a cross-ref to its page)
//   unknown  – none of the above
//
// Emits TSV `symbol<TAB>covered|uncovered` on stdout (this is esto's --from), and
// a sidecar classify.json (symbol → {class,source,status,suggestion}) the worker reads.
//
// "covered" = shadcn-linked OR external OR listed in crossref.json OR exempt.json.
// v1 scope: symbols in fields.tsx. Extending to story render bodies is a follow-up.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = process.env.REPO || process.cwd()
const COVERAGE_DIR = process.env.COVERAGE_DIR || '/tmp/code-panel-coverage'

const fieldsFile = path.join(REPO, 'packages/examples/fields.tsx')
const registryFile = path.join(REPO, 'apps/storybook/.storybook/shadcn-registry.json')
const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}
const crossref = readJson(path.join(HERE, 'crossref.json'), {}) // symbol -> doc URL
const exempt = new Set(readJson(path.join(HERE, 'exempt.json'), [])) // symbols to ignore

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
  'Array', 'Object', 'Date', 'Number', 'String', 'Boolean', 'Promise', 'Map', 'Set',
  'WeakMap', 'WeakSet', 'RegExp', 'Error', 'Symbol', 'BigInt', 'Math', 'JSON', 'Proxy',
  'Reflect', 'Function', 'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit',
  'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Parameters', 'Awaited',
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
  const isExport = ts.canHaveModifiers(st) && ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  if (!isExport) continue
  if (ts.isVariableStatement(st))
    for (const d of st.declarationList.declarations)
      if (ts.isIdentifier(d.name)) exported.add(d.name.text)
  else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name)
    exported.add(st.name.text)
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
  if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassDeclaration(node)) && node.name)
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
  if (localDecls.has(sym)) return { class: 'local', source: 'fields.tsx', exported: exported.has(sym) }
  return { class: 'unknown', source: '?' }
}

const SUGGEST = {
  shadcn: 'shadcn primitive missing from the registry — refresh shadcn-registry.json (vendor:registry).',
  core: 'insane-forms core symbol — add a doc URL in crossref.json, or add to exempt.json if not doc-worthy.',
  local: 'our own symbol — exported bindings/shells: add a cross-ref to its Storybook page in crossref.json; internal helpers: add to exempt.json.',
  external: 'external lib — auto-exempt by policy; add a crossref URL only if you want it linked.',
  builtin: 'JS/TS built-in — auto-exempt.',
  unknown: 'unresolved — inspect manually; add to crossref.json or exempt.json.',
}

const detail = {}
const rows = []
for (const sym of [...shown].sort()) {
  const c = classify(sym)
  let status, reason
  if (c.class === 'shadcn') {
    const linked = registry.has(c.file)
    status = linked ? 'covered' : 'uncovered'
    reason = linked ? 'shadcn-linked' : 'shadcn-missing-from-registry'
  } else if (crossref[sym]) {
    status = 'covered'
    reason = 'crossref'
  } else if (exempt.has(sym)) {
    status = 'covered'
    reason = 'exempt'
  } else if (c.class === 'external' || c.class === 'builtin') {
    status = 'covered'
    reason = `${c.class}-auto-exempt`
  } else {
    status = 'uncovered'
    reason = 'no-link'
  }
  detail[sym] = { ...c, status, reason, suggestion: SUGGEST[c.class] }
  rows.push(`${sym}\t${status}`)
}

mkdirSync(COVERAGE_DIR, { recursive: true })
writeFileSync(path.join(COVERAGE_DIR, 'classify.json'), JSON.stringify(detail, null, 2))
// TSV sidecar so the worker needs no JSON parsing: sym<TAB>class<TAB>source<TAB>exported<TAB>suggestion
const tsv = Object.entries(detail)
  .map(([k, v]) => [k, v.class, v.source, v.exported ?? '', (v.suggestion || '').replace(/\t/g, ' ')].join('\t'))
  .join('\n')
writeFileSync(path.join(COVERAGE_DIR, 'classify.tsv'), tsv + (tsv ? '\n' : ''))
process.stdout.write(rows.join('\n') + (rows.length ? '\n' : ''))
