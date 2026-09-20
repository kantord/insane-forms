import Link from '@docusaurus/Link'
import { DocProvider, useDoc } from '@docusaurus/plugin-content-docs/client'
import type { Props } from '@theme/DocItem'
import { useEffect } from 'react'
import { useDocsSidebarSync } from '../../contexts/DocsSidebarSync'
import { Asides } from '../Asides'

const DocItemContent = ({ content: Content }: { content: Props['content'] }) => {
  const { metadata, contentTitle, frontMatter, toc } = useDoc()
  const { setOnThisPage } = useDocsSidebarSync()
  const showSyntheticTitle = !frontMatter.hide_title && contentTitle === undefined

  useEffect(() => {
    const entries = toc
      .filter((item) => item.level <= 2)
      .map((item) => ({
        id: item.id,
        label: item.value,
      }))
    setOnThisPage(entries.length > 0 ? entries : null)
    return () => setOnThisPage(null)
  }, [toc, setOnThisPage])

  return (
    <div className="flex gap-10">
      <div className="min-w-0 flex-1">
        <div className="mb-8 flex justify-end gap-6 border-b-[length:var(--rule-w)] border-line py-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-dim">
          <Link className="hover:text-pop" to="/explore">
            storybook
          </Link>
          <a className="hover:text-pop" href="https://github.com/kantord/insane-forms">
            github
          </a>
        </div>
        <article className="docs-content text-ink">
          {showSyntheticTitle && (
            <h1 className="mb-6 font-display text-[66px] leading-[.94] font-black tracking-[-.04em]">
              {metadata.title}
            </h1>
          )}
          <Content />
        </article>
        {(metadata.previous || metadata.next) && (
          <div className="mt-8 flex items-center justify-between gap-6 border-t-[length:var(--rule-w)] border-line pt-4 font-mono text-[0.8rem]">
            {metadata.previous ? (
              <Link
                className="text-dim no-underline hover:text-pop"
                to={metadata.previous.permalink}
              >
                ← {metadata.previous.title}
              </Link>
            ) : (
              <span />
            )}
            {metadata.next && (
              <Link
                className="font-semibold text-pop no-underline hover:underline"
                to={metadata.next.permalink}
              >
                {metadata.next.title} →
              </Link>
            )}
          </div>
        )}
        <footer className="mt-8 flex flex-wrap justify-between gap-4 border-t-[length:var(--rule-w)] border-line py-2 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
          <a className="text-pop hover:underline" href="https://github.com/kantord/insane-forms">
            github.com/kantord/insane-forms
          </a>
          <span>the same example drives the automated suite</span>
        </footer>
      </div>
      <Asides />
    </div>
  )
}

/** `docs.docItemComponent` — a title (unless the markdown already has its own
 * `# heading`, matching upstream's synthetic-title rule), the compiled MDX
 * content, and a right "Asides" rail (../Asides.tsx — a fixed "see also"
 * link; empty by default otherwise per the design system handoff), styled
 * by our own `.docs-content` rules (custom.css) rather than theme-classic's
 * `.markdown` + Infima.
 *
 * "On this page" is NOT rendered here — the handoff's SidebarNav organism
 * puts it at the top of the persistent LEFT sidebar, not in a right rail
 * (an earlier pass got this backwards, going only off the raw mockup HTML
 * without the actual screenshots — see the landing-page skill). This
 * component pushes its own `useDoc().toc` up to that sidebar via
 * `DocsSidebarSync`'s `onThisPage` field, cleared on unmount (unlike the
 * docs TREE synced by DocRoot, "on this page" is per-page and must not
 * persist once you navigate away).
 *
 * Top links row + footer bar live HERE, not in DocRoot, so the Asides rail
 * (a flex sibling of this whole column) runs parallel to all three — top
 * links, article, footer — matching the mockup's column split exactly:
 * DocRoot previously rendered them outside DocItem's flex row, so they spanned
 * the full width underneath the Asides column instead of stopping beside it.
 *
 * Prev/next uses content-docs' own `metadata.previous`/`.next` (real doc
 * order from `sidebars.ts`'s autogeneration) — not hardcoded, so it's
 * honest with only 2 real pages today and needs no updates as more are
 * added. */
export default function DocItem(props: Props) {
  return (
    <DocProvider content={props.content}>
      <DocItemContent content={props.content} />
    </DocProvider>
  )
}
