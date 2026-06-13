#!/usr/bin/env sh
# Measure the TRUE size of the core library.
#
# Builds src/ into ONE browser-targeted production JS file (peers externalized —
# a library never bundles react/zod), pretty-prints it with Biome so the line
# count reflects real code (not bundler-compact lines), lints it to confirm it
# is well-formed JS, then counts it with cloc (code vs comment vs blank).
set -e

OUT=measure
BIN=./node_modules/.bin
rm -rf "$OUT"
mkdir -p "$OUT"

echo "── 1. single-file browser build (esbuild, es2020, peers external) ──"
"$BIN/esbuild" src/index.ts \
  --bundle --format=esm --target=es2020 --legal-comments=inline \
  --external:react --external:react/* \
  --external:react-dom --external:react-dom/* \
  --external:zod \
  --external:react-hook-form \
  --external:@hookform/resolvers --external:@hookform/resolvers/* \
  --outfile="$OUT/insane-forms.js"

# Biome honors .gitignore (measure/ is ignored); --vcs-enabled=false lets it
# process this throwaway artifact directly.
echo "── 2. pretty-print (Biome) ──"
"$BIN/biome" format --vcs-enabled=false --write "$OUT/insane-forms.js"

echo "── 3. lint the output (Biome) ──"
"$BIN/biome" lint --vcs-enabled=false "$OUT/insane-forms.js" || true

echo "── 4. production payload size (minified + gzip) ──"
"$BIN/esbuild" src/index.ts \
  --bundle --format=esm --target=es2020 --minify \
  --external:react --external:react/* \
  --external:react-dom --external:react-dom/* \
  --external:zod \
  --external:react-hook-form \
  --external:@hookform/resolvers --external:@hookform/resolvers/* \
  --outfile="$OUT/insane-forms.min.js"
printf 'minified: %s bytes  ·  gzip: %s bytes\n' \
  "$(wc -c < "$OUT/insane-forms.min.js")" \
  "$(gzip -c "$OUT/insane-forms.min.js" | wc -c)"

echo "── 5. line count (cloc) ──"
cloc "$OUT/insane-forms.js"
