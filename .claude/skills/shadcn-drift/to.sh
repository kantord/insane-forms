#!/usr/bin/env bash
# esto --to: desired state = the re-vendor output. Re-installs every vendored
# component into a throwaway detached worktree (so the real tree is untouched),
# Biome-normalizes via the MAIN repo's Biome, hashes. Emits TSV "name<TAB>sha256".
# A component that no longer installs upstream is omitted -> esto fires --exit.
set -u
REPO="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
cd "$REPO" || exit 1

names=()
for f in packages/ui/components/ui/*.tsx; do names+=("$(basename "$f" .tsx)"); done

WT="$(mktemp -d "${TMPDIR:-/tmp}/shadcn-drift-wt.XXXXXX")"
cleanup() { git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"; }
trap cleanup EXIT
git worktree add --detach "$WT" HEAD >/dev/null 2>&1 || { echo "to.sh: worktree add failed" >&2; exit 1; }

# One CLI call for all components (much faster than one-at-a-time). Best-effort:
# a component dropped upstream just won't be written, which is the signal we want.
( cd "$WT/packages/ui" && pnpm dlx shadcn@latest add --yes --overwrite "${names[@]}" ) >&2 2>/dev/null || true

for name in "${names[@]}"; do
  wf="$WT/packages/ui/components/ui/$name.tsx"
  [ -f "$wf" ] || continue   # gone upstream -> omit -> --exit
  hash="$(pnpm exec biome format --stdin-file-path=c.tsx <"$wf" 2>/dev/null | sha256sum | cut -d' ' -f1)"
  printf '%s\t%s\n' "$name" "$hash"
done
