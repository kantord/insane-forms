#!/usr/bin/env bash
# esto --from: CURRENT state = the persisted record of which widgets have a
# verified realistic example, and at which binding hash. A PERSISTED file (not a
# live grep) is what lets `exit` fire — a recorded widget that's gone from --to.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
cat "$HERE/state.tsv" 2>/dev/null || true
