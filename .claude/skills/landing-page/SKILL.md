---
name: landing-page
description: Rules for the docs-site landing page (apps/docs/src/pages/index.tsx) — plain static layout, the Tailwind/webpack gotchas specific to Docusaurus, and the perf-testing setup. Use whenever editing apps/docs/src or apps/docs/plugins, or adding landing sections.
---

# Landing page (apps/docs)

**Supersedes the old `scrollytelling-landing` skill** (2026-09-20, explicit
user request): the landing page was rewritten from a standalone Vite
scrollytelling app (`apps/landing`, now deleted) into a plain static page in
the Docusaurus site (`apps/docs`) that will also host real docs pages +
embedded Storybook next. The direction changed from "hybrid scrollytelling —
sticky-stepper morph, fullscreen scroll-snap biome deck, Magic Move code
animation, motion toggle, six-font chapter-prioritized loading" to "simple,
bold, static — same content, top-to-bottom flow, no scroll-driven JS." If you
find yourself wanting to reintroduce scroll-snap decks, IntersectionObserver-driven
steppers, or code-morph animation here: that's the OLD decision this one
overrode — don't silently resurrect it, ask first (see "Changing these
decisions" below).

## What the page actually is

One file, plain React, no client-side router tricks: `apps/docs/src/pages/index.tsx`.
Sections run top to bottom in normal document flow — hero, principles grid,
schema-morph (a step SELECTOR, not scroll-linked), a short "part two" intro,
then one contiguous block per biome (bureau/terminal/meadow): an intro
paragraph followed immediately by its live `Showcase` (code pane + operable
demo form), then the footer. No `ScrollyBlock`/`Slide`/`Biome` slide-deck
components exist anymore — `apps/docs/src/components/` only holds `Showcase`,
`CodePane`, `Receipt`, `BiomeDemos` (the three demo state wrappers), and
`SchemaMorph` (the step selector). Keep it that way: a new section is a new
`<section>` in plain flow, not a new slide-deck primitive.

- **SchemaMorph** (`src/components/SchemaMorph.tsx`): four buttons (`step 1..4`),
  each swapping a pre-highlighted code snippet and re-rendering the matching
  schema's live form. No IntersectionObserver, no sticky positioning, no
  animation library — clicking is the only interaction.
- **Showcase** (`src/components/Showcase.tsx`): a biome's code pane + operable
  form, side by side on a CSS grid (stacks on mobile), plus a link into the
  matching Storybook story. This is the ONE piece of layout structure worth
  keeping factored out; don't add more slide-layout abstraction than this.
- No motion toggle, no `prefers-reduced-motion` handling: there is currently no
  JS-driven animation on this page to gate. If you add motion, add the toggle
  back then — don't add it preemptively.

## No theme/preset — deliberate, and load-bearing for perf

`apps/docs/docusaurus.config.ts` has NO `presets`/`themes` entry. It uses
`@docusaurus/plugin-content-pages` (bare page routing) + `@docusaurus/plugin-sitemap`
+ three local plugins, and nothing else. This was NOT the original setup —
`preset-classic` was tried first and dropped when it turned out `theme-classic`
ships a full framework's worth of component CSS (admonitions, avatars, badges,
doc sidebar, blog chrome…) that this page uses none of, and that CSS alone
blew the Lighthouse LCP budget on its own (measured: dropping it cut the
render-blocking stylesheet from ~217 KB to ~150 KB). The navbar is gone too —
its two links (Storybook, GitHub) live in the page's own masthead row instead,
styled like everything else on the page.

**Re-evaluate this once real docs pages exist** (the next step): a docs
section genuinely needs sidebar/TOC/search chrome, at which point adopting
`preset-classic` for THOSE routes (not necessarily this one) is the right
trade to revisit — state that trade-off explicitly when it comes up, don't
silently add the preset back to fix an unrelated problem.

## Tailwind under Docusaurus/webpack: two non-obvious gotchas

Both of these caused real, measured Lighthouse regressions during the
migration — don't reintroduce them.

1. **Scope `@source` explicitly, or Tailwind scans the whole monorepo.**
   `apps/storybook` uses `@tailwindcss/vite`, which scopes its automatic
   content detection to Vite's own module graph (precise). `apps/docs` can
   only use the generic `@tailwindcss/postcss` plugin (Docusaurus builds with
   webpack), which has no module graph to scope to — its automatic detection
   walks the whole git-tracked monorepo, generating utilities for every class
   used anywhere (Storybook stories included). `apps/docs/src/css/custom.css`
   opts out with `@import "tailwindcss" source(none);` and lists exactly the
   files this page renders via explicit `@source` lines (the page's own
   `src/pages`/`src/components`, plus the specific `packages/examples/*.tsx`
   files the demos import — not the whole `packages/examples` directory,
   which would pull in the unrelated shadcn `fields.tsx` bindings). Adding a
   new demo or biome means adding its source file to that list.
2. **Fonts must never be base64-inlined.** Docusaurus's default webpack rule
   inlines any font under ~10 KB as a `data:` URI in the CSS. With six
   self-hosted families that put ~110 KB of base64 straight into the
   render-blocking stylesheet — the single biggest contributor to the LCP
   regression measured during the migration (fixing it alone took LCP from
   ~4.6s to ~1.7s). `apps/docs/plugins/workspace-aliases-plugin.ts` prepends a
   `module.rules` entry forcing `.woff`/`.woff2`/`.ttf`/`.otf` to
   `asset/resource` (always a separate cacheable file, never inlined) ahead of
   Docusaurus's own `oneOf` rule. If Lighthouse's `render-blocking-resources`
   or LCP budget regresses again, check `build/assets/css/*.css` for
   `base64` fonts FIRST.

## Local perf/e2e testing: use `static-server.mjs`, not `docusaurus serve`

`apps/docs/scripts/static-server.mjs` is a small dependency-free static file
server, used by both Playwright (`playwright.config.ts` webServer) and
Lighthouse CI (`.lighthouserc.json` `startServerCommand`) — NOT
`docusaurus serve`. Two reasons, both measured, not theoretical:

- `docusaurus serve` runs everything through `serve-handler`'s `cleanUrls`
  mode, which 301-redirects any `.html` request to its extension-less form
  AND drops the query string in the process. That's fatal for the embedded
  Storybook build's `iframe.html?id=...&viewMode=story` deep links (the
  redirect strips the `?id=...` needed to pick a story) — e2e tests hitting
  those URLs silently land on the wrong page instead of failing loudly.
- It doesn't gzip. GitHub Pages (and any real static host) compresses
  text assets in transit; a local test server that doesn't measures the
  Lighthouse LCP/TBT budget against transfer sizes production will never
  actually see. This was the dominant cause of the LCP regression during the
  migration — bigger than the CSS/font fixes above, once those were in place.

If you touch the static server, keep both properties: no clean-url
redirects, gzip on when the client sends `Accept-Encoding: gzip`.

## Code display

Snippets and the schema-morph steps come from `apps/docs/plugins/snippets-plugin.ts`
(a Docusaurus content plugin) — see the [[code-example-pipeline]] skill for
the actual slicing/highlighting rules. Never hand-write a displayed code
string here.

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
