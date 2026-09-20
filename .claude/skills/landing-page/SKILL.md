---
name: landing-page
description: Rules for the apps/docs site — the static landing page (src/pages/index.tsx), the persistent sidebar embedding every Storybook page (src/theme/Root.tsx, src/components/DocsSidebar.tsx, src/pages/docs.tsx), the Tailwind/webpack gotchas specific to Docusaurus, and the perf-testing setup. Use whenever editing apps/docs/src or apps/docs/plugins, or adding landing/docs sections.
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
+ local plugins, and nothing else. This was NOT the original setup —
`preset-classic` was tried first and dropped when it turned out `theme-classic`
ships a full framework's worth of component CSS (admonitions, avatars, badges,
doc sidebar, blog chrome…) that this page uses none of, and that CSS alone
blew the Lighthouse LCP budget on its own (measured: dropping it cut the
render-blocking stylesheet from ~217 KB to ~150 KB). The navbar is gone too —
its two links (Storybook, GitHub) live in the page's own masthead row instead,
styled like everything else on the page.

The "real docs pages" step this pointed at turned out NOT to need
`preset-classic` either — see "Docs section" below: it's a custom sidebar
embedding Storybook directly, not a Docusaurus content-docs sidebar. If a
future need (long-form written docs, search, versioning) genuinely requires
`preset-classic`'s doc-content system, that's a real trade to make explicitly
— state it, don't silently add the preset back to fix an unrelated problem.

## Docs section — persistent sidebar embedding Storybook

Reachable from every page (the sidebar is global — see "Persistent layout"
below), `/docs?id=<storyId>&mode=story|docs` embeds ONE Storybook page (a
story canvas or an autodocs page) picked by the sidebar. This is deliberately
NOT a Docusaurus content-docs setup and NOT an embed of Storybook's own
manager UI (which has its own sidebar, still linked separately from the
masthead for when you want Controls/Actions/the full Storybook chrome) — it's
a lighter, same-look-as-the-rest-of-the-site nav over Storybook's story
canvases.

- **`src/hooks/useStorybookIndex.ts`** fetches `<baseUrl>/storybook/index.json`
  client-side (Storybook writes this at ITS OWN build time, listing every
  story + autodocs page it built). This is the single source of truth for
  "every page in Storybook" — no story-discovery logic is duplicated here,
  and it doesn't matter that `build:docs` runs before `build:storybook`
  (`pnpm run test:e2e`/the Pages workflow): the fetch just 404s until
  Storybook's build lands, same as any other client-side data fetch. Fetch
  failure resolves to an empty list (sidebar renders, just empty), never a
  crash.
- **`src/components/DocsSidebar.tsx`** groups entries by their `title` (a
  slash-separated path, e.g. `Examples/Forms`) into a plain nested
  `Record<string, TreeNode>` tree (NOT a `Map` — see the note below) and
  renders it recursively. Each leaf links to `/docs?id=<id>&mode=<type>` via
  `@docusaurus/Link`; the active entry is derived by comparing the current
  `id` query param (`@docusaurus/router`'s `useLocation`) — no separate
  "selected" state.
- **`src/pages/docs.tsx`** reads `id`/`mode` from the query string and renders
  `<iframe src="<baseUrl>storybook/iframe.html?id=<id>&viewMode=<mode>">`
  filling the content pane. No per-story routes, no build-time knowledge of
  which stories exist — new stories show up automatically next time
  `index.json` is fetched.
- Use plain objects/arrays for this tree, not `Map`. A `Map`-based version of
  `buildTree` crashed on first paint in production
  (`TypeError: Cannot read properties of undefined (reading 'groups')`,
  reproducible only with real fetched data, not obviously wrong from reading
  the code) — switching to `Record<string, TreeNode>` fixed it outright. Cause
  never fully isolated; treat `Map` in this render path as suspect if the
  crash resurfaces.

### Persistent layout (sidebar on every page, landing included)

`src/theme/Root.tsx` — Docusaurus's documented global-wrapper swizzle point,
rendered around EVERY route — puts `<DocsSidebar>` in a fixed-height flex row
next to `{children}` (the page). This is deliberate and was an explicit
request: the sidebar is on the landing page too, not just `/docs`. Two
consequences if you touch this:

- `html`/`body`/`#__docusaurus` are pinned to `height: 100%` (`custom.css`) so
  the SIDEBAR and the PAGE each get their own `overflow-y-auto` scroll
  container instead of the whole document scrolling — without this the
  sidebar scrolls away with the page on anything taller than one screen.
- `custom.css` is imported from `Root.tsx`, not from `index.tsx` — it's the
  one place guaranteed to run for every route. Don't re-import it per-page.

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
2. **Fonts get base64-inlined by Docusaurus's default webpack rule — don't
   fight this with a competing `module.rules` entry.** Docusaurus's font rule
   (`@docusaurus/utils`'s `getFileLoaderUtils`) is `url-loader` (inlines any
   font under its size threshold as a `data:` URI, else falls back to
   `file-loader`) as a PLAIN entry in `module.rules` — NOT `oneOf`-wrapped.
   An earlier attempt here added a second top-level rule forcing
   `.woff`/`.woff2`/`.ttf`/`.otf` to `type: 'asset/resource'`, reasoning that
   webpack's `oneOf` semantics would make it win. It doesn't: webpack applies
   EVERY matching rule in a plain (non-`oneOf`) `module.rules` array, so both
   ran, and the file ultimately served at the font's URL was
   `url-loader`'s file-loader-fallback JS module text (`export default
   __webpack_public_path__ + "..."`) instead of the binary — every self-hosted
   font 404's-worth-of-garbage ("OTS parsing error: invalid sfntVersion") in
   the browser console, silently falling back to system fonts. **Don't
   reintroduce a `module.rules` override for fonts.** What actually fixes the
   Lighthouse LCP budget, in order of impact: (a) `static-server.mjs`'s gzip
   (see below) — base64 text compresses fine; (b) importing only the
   `latin-*.css` file where the Fontsource package ships one
   (`@fontsource/instrument-serif/latin-400.css`,
   `@fontsource/ibm-plex-mono/latin-400.css`) instead of the full package
   entrypoint, which pulls EVERY subset (latin-ext, cyrillic, greek,
   vietnamese…) as separate `@font-face` `url()`s that still get inlined at
   build time even though the browser's `unicode-range` matching would never
   fetch them at runtime. The three variable-font families
   (`@fontsource-variable/*`) don't ship a latin-only file — Fontsource bundles
   every subset into one `wght.css` per family — so they're accepted as-is.
   If the budget gets tight again, that's the next lever: extract just the
   `-latin-` `@font-face` block from each `wght.css` (by comment header, e.g.
   `/* jetbrains-mono-latin-wght-normal */`) rather than reaching for a
   webpack rule again.

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
