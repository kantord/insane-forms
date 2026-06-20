#!/usr/bin/env bash
# esto --from: current state = each committed shadcn component, Biome-normalized
# then hashed. Emits TSV "name<TAB>sha256" (one line per component).
set -u
REPO="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
cd "$REPO" || exit 1

for f in packages/ui/components/ui/*.tsx; do
  name="$(basename "$f" .tsx)"
  hash="$(pnpm exec biome format --stdin-file-path=c.tsx <"$f" 2>/dev/null | sha256sum | cut -d' ' -f1)"
  printf '%s\t%s\n' "$name" "$hash"
done
