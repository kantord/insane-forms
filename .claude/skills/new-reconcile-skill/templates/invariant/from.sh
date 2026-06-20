#!/usr/bin/env bash
# --from: MEASURE reality as "key<TAB>status". Reference: code-panel-coverage/from.sh
# For code-aware checks use the TypeScript compiler (see code-panel-coverage/enumerate.mjs);
# shell (grep/test) for simple textual predicates. ONE analysis tool — don't mix.
set -u
REPO="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
cd "$REPO" || exit 1
# TODO: emit "key<TAB>status" per item — "__DESIRED__" when the predicate holds,
# anything else when it does not. Example (textual predicate):
# for f in $(git ls-files 'PATTERN'); do
#   if CHECK "$f"; then printf '%s\t__DESIRED__\n' "$f"; else printf '%s\tmissing\n' "$f"; fi
# done
echo "__NAME__/from.sh: TODO implement" >&2; exit 1
