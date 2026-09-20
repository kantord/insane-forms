import { DocProvider, useDoc } from '@docusaurus/plugin-content-docs/client'
import type { Props } from '@theme/DocItem'

const DocItemContent = ({ content: Content }: { content: Props['content'] }) => {
  const { metadata, contentTitle, frontMatter } = useDoc()
  const showSyntheticTitle = !frontMatter.hide_title && contentTitle === undefined
  return (
    <article className="docs-content font-mono text-ink">
      {showSyntheticTitle && (
        <h1 className="mb-6 font-serif text-4xl font-normal">{metadata.title}</h1>
      )}
      <Content />
    </article>
  )
}

/** `docs.docItemComponent` — deliberately minimal: a title (unless the
 * markdown already has its own `# heading`, matching upstream's synthetic-title
 * rule) plus the compiled MDX content, styled by our own `.docs-content`
 * rules (custom.css) rather than theme-classic's `.markdown` + Infima. No
 * TOC/pagination/breadcrumbs/edit-this-page — add them back deliberately if
 * real docs content grows enough to need them, not as a default. */
export default function DocItem(props: Props) {
  return (
    <DocProvider content={props.content}>
      <DocItemContent content={props.content} />
    </DocProvider>
  )
}
