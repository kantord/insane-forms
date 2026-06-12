/** Vite plugin: smart font delivery for the landing page.
 *
 * Decision (explicit, June 2026): we KEEP the full six-family set — the
 * per-biome typography is part of the design. The budget is met by loading
 * order instead of trimming: preload ONLY the above-the-fold faces
 * (`crossorigin` is mandatory or the preload is wasted and the font fetched
 * twice), give the hero faces metric-matched local fallbacks (capsize
 * metrics → size-adjust/ascent/descent overrides, killing swap-CLS), and
 * leave the coding fonts un-preloaded — their panes sit below the fold under
 * content-visibility, so the browser activates them lazily on approach. */

import courierNew from '@capsizecss/metrics/courierNew'
import georgia from '@capsizecss/metrics/georgia'
import instrumentSerif from '@capsizecss/metrics/instrumentSerif'
import splineSansMono from '@capsizecss/metrics/splineSansMono'
import type { Plugin } from 'vite'

type Metrics = {
  ascent: number
  descent: number
  lineGap: number
  unitsPerEm: number
  xWidthAvg: number
}

/* Fontaine-style overrides: scale the fallback so its average glyph width
 * matches the web font, then correct the vertical metrics for that scale. */
const fallbackFace = (name: string, local: string, font: Metrics, fallback: Metrics): string => {
  const sizeAdjust = font.xWidthAvg / font.unitsPerEm / (fallback.xWidthAvg / fallback.unitsPerEm)
  const pct = (n: number) => `${((n / font.unitsPerEm / sizeAdjust) * 100).toFixed(2)}%`
  return [
    '@font-face{',
    `font-family:"${name}";`,
    `src:local("${local}");`,
    `size-adjust:${(sizeAdjust * 100).toFixed(2)}%;`,
    `ascent-override:${pct(font.ascent)};`,
    `descent-override:${pct(Math.abs(font.descent))};`,
    `line-gap-override:${pct(font.lineGap)};`,
    '}',
  ].join('')
}

/** Hashed filenames of the above-the-fold faces (hero headline + body). */
const PRELOAD_PATTERNS = [
  /^instrument-serif-latin-400-normal-.*\.woff2$/,
  /^instrument-serif-latin-400-italic-.*\.woff2$/,
  /^spline-sans-mono-latin-wght-normal-.*\.woff2$/,
]

export function fontsPlugin(): Plugin {
  return {
    name: 'insane-forms:fonts',
    apply: 'build',
    enforce: 'post', // run after vite:build-html has emitted index.html
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
      const preloads = PRELOAD_PATTERNS.flatMap((pattern) => {
        const hit = assets.find((name) => pattern.test(name.split('/').pop() ?? ''))
        return hit === undefined
          ? []
          : [`<link rel="preload" as="font" type="font/woff2" crossorigin href="./${hit}">`]
      })
      const style = `<style>${fallbackFace('Instrument Serif Fallback', 'Georgia', instrumentSerif, georgia)}${fallbackFace('Spline Sans Mono Fallback', 'Courier New', splineSansMono, courierNew)}</style>`

      const html = bundle['index.html']
      if (html?.type === 'asset' && typeof html.source === 'string') {
        html.source = html.source.replace('</title>', `</title>${preloads.join('')}${style}`)
      }
      if (preloads.length !== PRELOAD_PATTERNS.length) {
        this.warn(`fonts: expected ${PRELOAD_PATTERNS.length} preloads, found ${preloads.length}`)
      }
    },
  }
}
