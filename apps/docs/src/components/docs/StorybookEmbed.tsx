import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'

/** Drops one live Storybook story inline into a written doc page (`.mdx`,
 * imported directly — no MDXProvider wiring needed, see DocItem.tsx). Same
 * iframe mechanism as /explore (src/pages/explore.tsx) and the same
 * `?id=&mode=` convention as the persistent sidebar (src/components/
 * Sidebar.tsx), just sized to sit inside a column of prose instead of
 * filling the whole right pane. */
export const StorybookEmbed = ({
  id,
  title,
  height = 360,
}: {
  id: string
  title: string
  height?: number
}) => {
  const iframeSrc = useBaseUrl(`/storybook/iframe.html?id=${id}&viewMode=story`)

  return (
    <div className="not-prose my-6 min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-[0.68rem] uppercase tracking-[0.16em] text-dim">{title}</span>
        <Link
          className="text-[0.65rem] uppercase tracking-[0.14em] text-dim/80 no-underline hover:text-pop"
          to={`/explore?id=${id}&mode=story`}
        >
          open in storybook ↗
        </Link>
      </div>
      <iframe
        src={iframeSrc}
        title={title}
        style={{ height }}
        className="w-full border-[length:var(--rule-w)] border-line bg-paper"
      />
    </div>
  )
}
