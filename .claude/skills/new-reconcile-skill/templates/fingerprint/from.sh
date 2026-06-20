#!/usr/bin/env bash
# --from: CURRENT state as "key<TAB>fingerprint". Reference: shadcn-drift/from.sh
set -u
REPO="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
cd "$REPO" || exit 1
# TODO: enumerate current items and fingerprint each. Example (content hash):
# for f in PATH/*.EXT; do
#   printf '%s\t%s\n' "$(basename "$f" .EXT)" "$(sha256sum "$f" | cut -d' ' -f1)"
# done
echo "__NAME__/from.sh: TODO implement" >&2; exit 1
