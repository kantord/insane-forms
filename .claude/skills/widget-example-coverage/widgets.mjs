#!/usr/bin/env node
// Enumerator for the widget-example-coverage reconcile.
//
// Widget set = the `*Field` bindings demonstrated in the showcase story groups
// (base-widgets + derived-widgets). For each, the VALUE is a hash of its binding
// definition sliced from fields.tsx — so the hash changes when the binding changes
// (→ esto --update: "the example may be stale").
//
//   node widgets.mjs --desired   # all widgets: key<TAB>hash  (esto --to)
//   node widgets.mjs --seed      # widgets ALREADY in a realistic example: key<TAB>hash
//                                #   (one-time seed for the --from state file)

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const mode = process.argv[2]
const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../..')
const fieldsFile = path.join(REPO, 'packages/examples/fields.tsx')
const storiesDir = path.join(REPO, 'apps/storybook/stories')
const examplesDir = path.join(REPO, 'packages/examples')

const read = (p) => {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return ''
  }
}

// 1. The showcase groups define what counts as a "widget".
const SHOWCASE = ['base-widgets.stories.tsx', 'derived-widgets.stories.tsx']
const showcaseSrc = SHOWCASE.map((f) => read(path.join(storiesDir, f))).join('\n')

// 2. Slice each exported binding's definition from fields.tsx; hash it.
const src = read(fieldsFile)
const sf = ts.createSourceFile('fields.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const defText = new Map()
const isExported = (n) =>
  ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
sf.forEachChild((node) => {
  if (ts.isVariableStatement(node) && isExported(node))
    for (const d of node.declarationList.declarations)
      if (ts.isIdentifier(d.name)) defText.set(d.name.text, node.getText(sf))
})

const isWidget = (name) =>
  /Field$/.test(name) && defText.has(name) && new RegExp(`\\b${name}\\b`).test(showcaseSrc)
const widgets = [...defText.keys()].filter(isWidget).sort()
const hash = (name) => createHash('sha256').update(defText.get(name)).digest('hex').slice(0, 16)

// Realistic surfaces = example stories + demo app modules; NOT the isolated
// showcases, field-behaviors, css/composition meta-stories, or tests.
const EXCLUDE = new Set([
  ...SHOWCASE,
  'shells.stories.tsx',
  'field-behaviors.stories.tsx',
  'css.stories.tsx',
  'composition.stories.tsx',
])
const realisticSrc = [
  ...readdirSync(storiesDir)
    .filter((f) => f.endsWith('.stories.tsx') && !EXCLUDE.has(f))
    .map((f) => read(path.join(storiesDir, f))),
  ...readdirSync(examplesDir)
    .filter((f) => f.endsWith('.tsx') && f !== 'fields.tsx')
    .map((f) => read(path.join(examplesDir, f))),
].join('\n')
const inRealisticExample = (w) => new RegExp(`\\b${w}\\b`).test(realisticSrc)

if (mode === '--desired') {
  for (const w of widgets) console.log(`${w}\t${hash(w)}`)
} else if (mode === '--seed') {
  for (const w of widgets) if (inRealisticExample(w)) console.log(`${w}\t${hash(w)}`)
} else {
  console.error('usage: widgets.mjs --desired | --seed')
  process.exit(2)
}
