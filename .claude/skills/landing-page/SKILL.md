---
name: landing-page
description: Rules for the apps/docs site — the static landing page (src/pages/index.tsx), the persistent sidebar (src/theme/Root.tsx, src/components/Sidebar.tsx) with its two sections (/docs real written docs, /explore every Storybook page), the from-scratch content-docs theme (src/components/docs/), the Tailwind/webpack gotchas specific to Docusaurus, and the perf-testing setup. Use whenever editing apps/docs/src or apps/docs/plugins, or adding landing/docs/explore sections.
---

# apps/docs (landing page + docs + explore)

**Supersedes the old `scrollytelling-landing` skill** (2026-09-20, explicit
user request): the landing page was rewritten from a standalone Vite
scrollytelling app (`apps/landing`, now deleted) into a plain static page in
the Docusaurus site (`apps/docs`), which now also hosts real written docs
(`/docs`) and a Storybook browser (`/explore`) behind a persistent sidebar.
The landing page's direction changed from "hybrid scrollytelling —
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

## No theme-classic, ever — it's not prunable, so it's not used at all

`apps/docs/docusaurus.config.ts` registers `@docusaurus/plugin-content-pages`,
`@docusaurus/plugin-sitemap`, and `@docusaurus/plugin-content-docs` directly
— no `preset-classic`, no `@docusaurus/theme-classic`, not even for the real
written docs (`/docs`). This was tried three times before landing here, each
one measured against the Lighthouse LCP budget (quality-gates skill) on the
landing page, since Docusaurus ships ONE global stylesheet for the whole
site — CSS added anywhere is paid for everywhere:

1. `preset-classic` with `docs` enabled: landing-page LCP 2.3s → 2.8s
   (budget: 2.5s). Cause: `theme-classic`'s plugin definition calls
   `getClientModules()` and unconditionally requires
   `infima/dist/css/default/default.css` (~150 KB) as a global client
   module — this runs at the PLUGIN level, not per-component, so it loads
   the instant theme-classic is an active theme, full stop.
2. Swizzling `Layout` to drop `Navbar`/`Footer`/`AnnouncementBar` (still
   useful — we don't want Docusaurus's own navbar anywhere, the persistent
   sidebar replaces it) clawed back only ~2 KB / ~60ms. Confirms (1): Infima's
   own base framework (grid, typography, buttons, admonitions, doc-sidebar
   styles) is ONE monolithic stylesheet, not tree-shaken per component — you
   cannot have theme-classic active "a little bit."
3. **What actually worked**: drop theme-classic entirely and supply
   content-docs' required components ourselves — `docsRootComponent`,
   `docVersionRootComponent`, `docRootComponent`, `docItemComponent`,
   `docCategoryGeneratedIndexComponent` in the plugin options
   (`docusaurus.config.ts`), pointed at `src/components/docs/*.tsx`
   (absolute paths via `path.resolve(__dirname, ...)` — the generated
   `.docusaurus/` registry can't resolve paths relative to the config file).
   Result: landing LCP back to 2.3s with full doc pages. These components
   import ONLY `@docusaurus/plugin-content-docs/client` (`useDoc`,
   `useDocRootMetadata`, `DocProvider`, `DocsSidebarProvider`,
   `DocsVersionProvider` — theme-agnostic hooks, safe standalone) and
   `@docusaurus/renderRoutes` — never anything from `@docusaurus/theme-classic`
   or `@theme/*` aliases theme-classic would have provided. `useDoc`/etc.
   need `@docusaurus/theme-common` and `@docusaurus/plugin-content-docs`
   declared as ROOT devDependencies (not just transitive through a preset) —
   `tsc` resolves their types either way, but webpack's runtime resolution
   won't without the explicit dependency.

**If you're tempted to add `preset-classic` back "just for this one thing"**:
don't, without re-measuring. That's exactly attempt (1) above. Any doc
feature that turns out to need theme-classic specifically (versioning,
Algolia search) is a real, explicit trade to make — state it, don't silently
reach for the preset.

## Two sections, ONE merged sidebar: /docs vs /explore

`/docs` and `/explore` are fed by two different mechanisms but render into
the SAME sidebar tree (`src/components/Sidebar.tsx`) — there is no
second, doc-page-local sidebar. That was the original shape (each section
had its own tree) and was explicitly rejected as a "double sidebar."

- **`/docs`** — real, hand-authored documentation. Markdown/MDX files under
  `apps/docs/docs/`, routed and sidebar-generated by
  `@docusaurus/plugin-content-docs` (autogenerated from folder structure,
  `sidebars.ts`). Rendering is our own minimal theme (previous section) —
  `src/components/docs/DocItem.tsx` renders a title + the compiled MDX with
  plain typographic CSS (`.docs-content` in `custom.css` — Tailwind's
  preflight zeroes out default `<p>`/`<h1>` margins, so writing ANY prose
  content needs this or it renders as one unreadable run-on block).
  `src/components/docs/DocRoot.tsx` renders no LEFT sidebar column — its
  sidebar tree is pushed up into the persistent sidebar instead (see
  "Merging the two trees" below) — but does render top links, a footer bar,
  and (via DocItem) a right "Asides" rail; see "Per-article chrome" below.
- **`/explore`** — every Storybook story/autodocs page, embedded via iframe.
  Nothing here is content-docs; it's a `?id=<storyId>&mode=story|docs` query
  param read by `src/pages/explore.tsx`, rendering
  `<iframe src="<baseUrl>storybook/iframe.html?id=...&viewMode=...">`.
  `src/hooks/useStorybookIndex.ts` fetches `<baseUrl>/storybook/index.json`
  CLIENT-SIDE (Storybook writes this at ITS OWN build time) — the single
  source of truth for "every page in Storybook," so no story-discovery logic
  is duplicated here, and it doesn't matter that `build:docs` runs before
  `build:storybook` (`pnpm run test:e2e`/the Pages workflow): the fetch just
  404s until Storybook's build lands. Fetch failure resolves to an empty
  list, never a crash.
  - Don't try to generate content-docs pages FROM Storybook's story data
    (one MDX file per story) to get a "proper" sidebar for this instead —
    considered and rejected: it would require building Storybook BEFORE
    Docusaurus (reversed from today, since Docusaurus would need
    `index.json` at ITS build time) and re-deriving Storybook's title→id
    slugging by hand. More framework-fighting for no gain over the
    client-fetch approach already in place.

### Per-article chrome: top links, footer bar, right "Asides" rail

2026-09-20 (explicit user request, sourced from a second Claude Design
artifact, "Pages & dark mode" — a set of full-page mockups establishing
shared page chrome, separate from the rebrand artifact in "Design system"
below): every `/docs` article gets a right-aligned "storybook"/"github" link
row above it and a footer bar below it (`github.com/kantord/insane-forms` +
"the same example drives the automated suite" — true site-wide, since
displayed code IS generated from the real test-backing source, see
[[code-example-pipeline]]), matching the landing page's own header/footer
verbatim in style, plus a right "Asides" rail (`src/components/Asides.tsx`):
an auto-derived "on this page" anchor list from the article's own headings
(no scroll-spy — plain `href="#id"` links, hidden when the article has none
shallow enough to list) plus a fixed "see also" link to `/explore`, shown
unconditionally since it's true of every doc page regardless of that page's
own heading structure. Don't add a "Note" callout slot speculatively —
there's no real editorial content to put in one yet with the docs pages
still placeholders (`docs/intro.md`, `docs/guides/getting-started.md`).

**All three (top links, footer, Asides) live in `DocItem.tsx`, not
`DocRoot.tsx`.** First attempt put the top links row and footer in
`DocRoot.tsx` wrapping `{docElement}`, with Asides inside `DocItem.tsx`
alongside the article — that put Asides and the top links/footer in
different flex containers, so the top links/footer spanned the FULL content
width underneath where the Asides column sits, instead of stopping beside
it like the mockup (Asides runs parallel to the top links + article +
footer stack, all three inside the mockup's own `flex:1` middle column,
never full-width). Fixed by moving the top links row and footer inside
`DocItem.tsx`'s own flex row, in a `min-w-0 flex-1` wrapper alongside
`<Asides>` — `DocRoot.tsx` now does nothing but set the wider
`max-w-[1180px]` and render `{docElement}`.

**Explicitly decided NOT to do, when this landed**: replace the dynamic
sidebar (previous section) with the design mockup's static "On this page" +
hardcoded "Examples" list (Profile/Contacts/Categories/Collections/Editable
table/Field behaviors — none of which exist as real pages). The mockup's
exact information architecture was treated as style reference only; the
sidebar mechanism (real `/docs` tree + Storybook index, merged) stayed as
documented above. Don't silently build those named example pages later
thinking it "completes" this spec — that's a separate, larger content
decision, not implied by this chrome work.

### The shared tree component: CollapsibleTree.tsx

`src/components/CollapsibleTree.tsx` is the ONE hierarchical sidebar
renderer, consuming a generic `TreeItem[]` (`{type:'link', href, label,
active}` or `{type:'category', label, items}`). Both trees adapt their own
data into this shape rather than each hand-rolling their own recursive JSX:
`src/components/Sidebar.tsx`'s `storybookToTreeItems` (Storybook entries →
tree) and `src/components/docs/DocSidebarItems.tsx`'s `toTreeItems`
(content-docs' `PropSidebarItem[]` → tree, comparing each link's `href`
against `useLocation().pathname` for `active`).

- **Categories are collapsed by default, expand automatically when they
  contain the active page, and can otherwise be clicked open to browse** —
  explicit request. `open = containsActive(item) || manuallyOpen` (per-node
  `useState`): a category holding the current page can't be collapsed (you're
  standing in it), everything else starts closed but is still reachable by
  clicking its header.
- **The disclosure triangle MUST be `aria-hidden`.** Without it, the
  button's accessible name becomes "▸ Forms" instead of "Forms", which
  silently breaks `getByRole('button', {name: 'Forms', exact: true})` in
  tests (and screen readers double-announcing the glyph). Learned by e2e
  failures using non-exact name matches that then collided with substrings
  like "Integration examples" containing "examples".
- **Plain objects for the tree-building helper, NEVER `Map`.** This bug has
  now recurred twice in the exact same shape: a `Map`-keyed intermediate
  tree (`{groups: Map<...>}` the first time, `{categories: Map<...>}` the
  second, both times in `storybookToTreeItems`-equivalent code) crashes the
  whole page on first paint in production
  (`TypeError: Cannot read properties of undefined (reading 'groups'|'categories')`),
  reproducible only with real fetched data, never isolated further than
  "switching to `Record<string, T>` fixes it outright." If you're about to
  write `new Map()` inside a sidebar tree builder: don't — use a plain
  object instead, no exceptions, until the actual cause is understood.

### Merging the two trees: DocsSidebarSync

Content-docs' own sidebar data (`useDocsSidebar()`, from
`@docusaurus/plugin-content-docs/client`) is ONLY readable from inside a
`/docs/*` route's own `DocsSidebarProvider` — but the persistent sidebar
(`src/theme/Root.tsx`) renders as a SIBLING of the routed page, not a
descendant, so it structurally cannot read that context. Similarly,
`useLayoutDocsSidebar()` (content-docs' "works anywhere" sidebar hook) only
returns a `{link}` pointer, not the full tree — not enough to render.

The fix is a second, plain context: `src/contexts/DocsSidebarSync.tsx`
(`{items, setItems}`), provided by `Root.tsx` around BOTH `<Sidebar>` and
`{children}`. `src/components/docs/DocRoot.tsx` (a descendant, inside a doc
route) pushes its `sidebarItems` up via `useEffect` the moment it renders;
`Sidebar.tsx` reads them back down via the same context. The autogenerated
sidebar is one static tree for the whole `/docs` section (not per-page), so
DocRoot does NOT clear it on unmount — once you've visited any doc page in
a session, the tree stays in the sidebar (matching "explore"'s always-on
behavior) rather than collapsing back to a single "guides" entry point.

## Persistent layout (sidebar on every page, landing included)

`src/theme/Root.tsx` — Docusaurus's documented global-wrapper swizzle point,
rendered around EVERY route — puts `<Sidebar>` in a fixed-height flex row
next to `{children}` (the page), wrapped in `DocsSidebarSyncProvider`
(previous section). This was an explicit request: the sidebar is on the
landing page too, not just `/docs`/`/explore`. Two consequences if you touch
this:

- `html`/`body`/`#__docusaurus` are pinned to `height: 100%` (`custom.css`) so
  the SIDEBAR and the PAGE each get their own `overflow-y-auto` scroll
  container instead of the whole document scrolling — without this the
  sidebar scrolls away with the page on anything taller than one screen.
- `custom.css` is imported from `Root.tsx`, not from `index.tsx` — it's the
  one place guaranteed to run for every route. There's no `theme.customCss`
  hook to register it through instead (no preset/theme registered at all —
  previous section), so this plain import IS the mechanism. Don't re-import
  it per-page.

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

## Design system: tokens, fonts, dark mode

**2026-09-20 rebrand** (explicit user request, sourced from a Claude Design
artifact the user built separately — see "Extracting a Claude Design
artifact's real content" below if this needs doing again): new palette,
Archivo as the site's display font, and a working light/dark toggle.

- **Tokens live in `packages/examples/biomes.css`**, shared with Storybook —
  not `apps/docs/src/css/custom.css` (site-only concerns: fonts, paper grain,
  code-note styling). `:root` sets the light-mode values; `:root[data-theme="dark"]`
  overrides them. The three biome classes (`.biome-terminal`, `.biome-meadow`)
  layer their own token overrides on top and are unaffected by dark mode — they
  were already their own fixed palettes.
- **`--font-display`** (renamed from `--font-serif`) is Archivo Variable on the
  bureau/site chrome, remapped per-biome (mono for terminal, Instrument Serif
  for meadow). Use the `font-display` Tailwind class, not `font-serif`, for any
  new heading.
- **Dark mode is `data-theme` on `<html>`, NOT Docusaurus's own color-mode
  system.** `src/contexts/ColorMode.tsx` is a standalone localStorage +
  `matchMedia` + `data-theme` attribute toggle, wired in at `Root.tsx`. This is
  deliberate, not an oversight: Docusaurus's own `ColorModeProvider` lives in
  `@docusaurus/theme-classic`, which this site doesn't register (see "No
  theme-classic, ever" above) — reaching for it means reaching for the preset
  again. It's also independent from Storybook's own dark-mode toggle, which
  uses a `.dark` CLASS on a different element — the two never collide because
  they key off different attributes entirely; don't try to unify them.
- **State always starts at `'light'`, corrected in an effect post-mount —
  never compute it during the initial render.** The first version of this
  read `localStorage`/`matchMedia` via `useState(initialMode)`, which runs
  during BOTH the server's render (where `window` is undefined → `'light'`)
  AND the client's hydration render (where `window` exists → often
  `'dark'`) — two different outputs for the same render pass is a real React
  hydration error (#418: text content mismatch), reproducible on every load
  for a visitor whose system/stored preference is dark, not just a cosmetic
  issue. Confirmed via `list_console_messages` before and after the fix.
  Current code: `useState<Mode>('light')`, then one `useEffect(() => {
  setMode(initialMode()); setHydrated(true) }, [])`, then a second effect
  gated on `hydrated` that writes `data-theme`/localStorage — this keeps the
  first client render's output identical to the server's, so hydration
  succeeds, and only touches the DOM/storage once the corrected value is
  known.
- **Known gap: no anti-flash inline script.** Because state starts at
  `'light'` (previous bullet), a visitor whose stored/system preference is
  dark still sees one frame of the light-mode SSR output before the
  post-mount effect flips it — a visual flash, not an error. Not yet fixed.
  If this becomes worth fixing, the fix is a tiny inline `<script>` in
  `docusaurus.config.ts`'s `scripts`/head injection that reads
  `localStorage`/`matchMedia` and sets `data-theme` synchronously before the
  stylesheet paints — note this alone would reintroduce the hydration
  mismatch on the sidebar's "light mode"/"dark mode" TEXT unless that text
  node also gets `suppressHydrationWarning`, since the inline script only
  fixes the CSS-visible attribute, not React's own `mode` state. Don't reach
  for `theme-classic`'s version of this for the same reason as above.
- **Sidebar active-state is filled, not bordered**: `bg-pop text-paper
  font-bold` for the active link (both `Sidebar.tsx`'s `SectionLink` and
  `CollapsibleTree.tsx`'s leaf links) — replaced an earlier border-left
  indicator style. Keep both in sync; they're two separate components
  rendering the same visual language and there's no shared style helper for it.

### Extracting a Claude Design artifact's real content

The user works out design direction in a separate Claude Design (Artifact
canvas) session, then hands over the resulting `claude.ai/artifact/<id>` link
— not a `claude.ai/design/p/<id>` link (that's a different, inaccessible
surface; ask for the artifact-format link instead if given that one). Reading
a "single page" design artifact via the `Artifact` tool's `read` action
returns only its compiled bundler JS (a client-side unpacking loader), not the
rendered design — there are no separately published project files to read
instead (`list scope:files` confirms this). The actual page markup, inline
styles, real hex colors, and font-family names are inside the LOCALLY SAVED
full HTML file the tool result points to: parse it directly (Python:
base64-decode + gunzip each `__bundler/manifest` entry to confirm they're just
runtime code, then find and JSON-parse the `__bundler/template` script tag's
content — that's the actual rendered HTML with inline styles). Don't ask the
user to re-describe the design instead of doing this extraction; it's slower
and lossier than just reading the file.

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
