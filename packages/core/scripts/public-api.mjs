#!/usr/bin/env node
// The public API surface of insane-forms, resolved via the TS checker in ONE call:
// `getExportsOfModule` follows `export *` and re-exports, so there's no AST-walking.
// Each export → { name, file, sig, hasDoc }. Single source of truth for the docs gate
// (check-docs.mjs) and esto consumers (docs/*.op.tsx).
//   node scripts/public-api.mjs           # JSON array to stdout
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(CORE, 'src/index.ts')

/** The published public API: every export of src/index.ts, resolved (incl. `export *`). */
export function publicApi() {
  const prog = ts.createProgram([ENTRY], { allowJs: true, jsx: ts.JsxEmit.ReactJSX })
  const chk = prog.getTypeChecker()
  const mod = chk.getSymbolAtLocation(prog.getSourceFile(ENTRY))
  return chk
    .getExportsOfModule(mod)
    .map((s) => {
      const real = s.flags & ts.SymbolFlags.Alias ? chk.getAliasedSymbol(s) : s
      const decl = real.declarations?.[0]
      const text = decl ? decl.getText(decl.getSourceFile()) : s.getName()
      return {
        name: s.getName(),
        file: decl ? path.basename(decl.getSourceFile().fileName) : '?',
        sig: createHash('sha256').update(text).digest('hex').slice(0, 8),
        hasDoc: real.getDocumentationComment(chk).length > 0,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.stdout.write(JSON.stringify(publicApi()))
