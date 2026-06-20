#!/usr/bin/env node
// Build-time gate: every PUBLIC RUNTIME export of insane-forms must be referenced
// by at least one test (a proxy for "is covered"). Types are out of scope (their
// proofs live in *.check.tsx). React-runtime exports that are exercised only
// INDIRECTLY (through the examples render/interact/url-state suites, not by name)
// are listed in EXEMPT with a reason.
//
//   node scripts/check-api-tests.mjs           # report + exit 1 if any untested
//   node scripts/check-api-tests.mjs --json

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const asJson = process.argv.includes('--json')
const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(CORE, '../..')
const insaneFile = path.join(CORE, 'src/insane.tsx')

// Exercised indirectly by the examples integration suites (not referenced by name).
const EXEMPT = {
  Render: 'exercised by packages/examples/tests/{render,interact}.test.tsx via <ZodForm>',
  useQueryParamsSync: 'exercised by the url-state stories / examples URL-sync flows',
}

// Public runtime exports = top-level exported const/function in insane.tsx.
const src = readFileSync(insaneFile, 'utf8')
const sf = ts.createSourceFile('insane.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const isExported = (n) =>
  ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
const names = new Set()
sf.forEachChild((node) => {
  if (ts.isVariableStatement(node) && isExported(node))
    for (const d of node.declarationList.declarations) names.add(d.name.getText(sf))
  else if (ts.isFunctionDeclaration(node) && isExported(node) && node.name)
    names.add(node.name.text)
})

// Gather all test sources across the workspace.
const testText = []
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e)
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(test|check)\.tsx?$/.test(e)) testText.push(readFileSync(p, 'utf8'))
  }
}
walk(path.join(REPO, 'packages'))
const allTests = testText.join('\n')

const untested = [...names]
  .filter((n) => !EXEMPT[n] && !new RegExp(`\\b${n}\\b`).test(allTests))
  .sort((a, b) => a.localeCompare(b))
const tested = names.size - untested.length - Object.keys(EXEMPT).filter((n) => names.has(n)).length

if (asJson) {
  console.log(
    JSON.stringify({ total: names.size, tested, exempt: Object.keys(EXEMPT), untested }, null, 2),
  )
} else if (untested.length === 0) {
  console.log(
    `✓ public API tests: every runtime export is referenced by a test (${tested} tested, ${Object.keys(EXEMPT).length} exempt).`,
  )
} else {
  console.error(`✗ public API tests: ${untested.length} runtime export(s) have no test:\n`)
  for (const u of untested) console.error(`  ${u}`)
  console.error(
    '\nAdd a test referencing each, or list it in EXEMPT (with a reason) in scripts/check-api-tests.mjs.',
  )
}
process.exit(untested.length === 0 ? 0 : 1)
