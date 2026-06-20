#!/usr/bin/env bash
# esto worker. $1 = mode: "update" (key<TAB>old<TAB>new) | "exit" (key<TAB>value).
# Emits one markdown reconcile task per item to $SHADCN_DRIFT_TASKS, then acks.
mode="${1:-update}"
TASKS_DIR="${SHADCN_DRIFT_TASKS:-/tmp/shadcn-drift-tasks}"
mkdir -p "$TASKS_DIR"

while IFS=$'\t' read -r key a b; do
  [ -z "$key" ] && continue
  if [ "$mode" = "exit" ]; then
    cat >"$TASKS_DIR/$key.md" <<TASK
# shadcn drift: \`$key\` — gone from upstream

A fresh \`shadcn add $key\` did not produce a file, but we still vendor
\`packages/ui/components/ui/$key.tsx\` (committed hash: $a).

Decide:
1. Grep usages of $key across packages/examples + apps.
2. If renamed upstream, find the new name and migrate; if intentionally local,
   document why; if unused, remove it.
3. Run the quality gates (quality-gates skill) before declaring done.
TASK
  else
    cat >"$TASKS_DIR/$key.md" <<TASK
# shadcn drift: \`$key\` — changed upstream

\`packages/ui/components/ui/$key.tsx\` no longer matches a fresh \`shadcn add $key\`
(normalized content hash differs).
  old (committed): $a
  new (upstream):  $b

Reconcile:
1. Re-vendor just this component:
   \`cd packages/ui && pnpm dlx shadcn@latest add --yes --overwrite $key\`
   then \`pnpm exec biome format --write components/ui/$key.tsx\`
2. \`git diff packages/ui/components/ui/$key.tsx\` — classify EACH hunk as:
   (a) an intentional local edit to KEEP (e.g. a \`"use client"\` line — note
       components.json has rsc:false, so a fresh add omits it; decide deliberately), or
   (b) a genuine upstream change to ACCEPT.
3. Re-apply the (a) keepers.
4. Grep usages of <$key> across packages/examples + apps; confirm none break.
5. Run the quality gates (quality-gates skill) before declaring done.
TASK
  fi
  printf 'done\t%s\n' "$key"
done
