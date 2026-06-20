#!/usr/bin/env node
// Scaffold a new esto-based reconcile skill from the two reference shapes.
//   node scaffold.mjs --name=<slug> --shape=fingerprint|invariant [--desc="..."] [--desired=ok] [--force]
// Reads templates/, substitutes __NAME__/__DESC__/__DESIRED__/__SHAPE__, writes
// .claude/skills/<name>/ (detect.sh, worker.sh, SKILL.md, from.sh, to.sh).

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=([\s\S]*)$/)
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true]
  }),
)

const name = args.name
const shape = args.shape
const desc = args.desc || `TODO: describe ${name}`
const desired = args.desired || 'ok'
const force = !!args.force

if (!name || !/^[a-z0-9-]+$/.test(name) || !['fingerprint', 'invariant'].includes(shape)) {
  console.error(
    'usage: scaffold.mjs --name=<kebab-slug> --shape=fingerprint|invariant [--desc="..."] [--desired=ok] [--force]',
  )
  process.exit(2)
}

const REPO = process.env.REPO || process.cwd()
const dest = path.join(REPO, '.claude/skills', name)
if (existsSync(dest) && !force) {
  console.error(`refusing: ${dest} already exists (use --force to overwrite)`)
  process.exit(1)
}
mkdirSync(dest, { recursive: true })

const sub = (s) =>
  s
    .replaceAll('__NAME__', name)
    .replaceAll('__DESC__', desc)
    .replaceAll('__DESIRED__', desired)
    .replaceAll('__SHAPE__', shape)

const copy = (rel, outName = path.basename(rel)) => {
  const content = sub(readFileSync(path.join(HERE, 'templates', rel), 'utf8'))
  const out = path.join(dest, outName)
  writeFileSync(out, content)
  if (out.endsWith('.sh') || out.endsWith('.mjs')) chmodSync(out, 0o755)
}

copy('detect.sh')
copy('worker.sh')
copy('SKILL.md')
copy(`${shape}/from.sh`, 'from.sh')
copy(`${shape}/to.sh`, 'to.sh')

console.log(`scaffolded ${shape} reconcile skill → .claude/skills/${name}/`)
console.log(
  `next: implement from.sh${shape === 'fingerprint' ? ' + to.sh' : ' (to.sh is ready)'}, edit worker.sh task body, then run:\n  bash .claude/skills/${name}/detect.sh`,
)
