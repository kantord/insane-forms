#!/usr/bin/env bash
# --to: DESIRED state as "key<TAB>fingerprint" — usually transform(current), e.g.
# regenerate/re-vendor into a THROWAWAY git worktree and hash. Reference: shadcn-drift/to.sh
# (worktree keeps the real tree untouched; hash with the same normalization as from.sh).
set -u
REPO="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
cd "$REPO" || exit 1
# TODO: produce the desired fingerprints. Sketch:
# WT="$(mktemp -d)"; git worktree add --detach "$WT" HEAD >/dev/null 2>&1
# trap 'git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"' EXIT
# ( cd "$WT" && REGENERATE ) >/dev/null 2>&1
# for f in "$WT"/PATH/*.EXT; do printf '%s\t%s\n' "$(basename "$f" .EXT)" "$(sha256sum "$f" | cut -d' ' -f1)"; done
echo "__NAME__/to.sh: TODO implement" >&2; exit 1
