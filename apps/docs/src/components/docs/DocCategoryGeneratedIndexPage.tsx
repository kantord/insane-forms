import type { Props } from '@theme/DocCategoryGeneratedIndexPage'

/** `docs.docCategoryGeneratedIndexComponent` — only reached if a sidebar
 * category has no index doc AND opts into a generated index page (we don't
 * configure that today, but it's cheap insurance against a build failure if
 * a future doc folder does). Deliberately bare. */
export default function DocCategoryGeneratedIndexPage({ categoryGeneratedIndex }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 font-display text-ink">
      <h1 className="mb-4 font-display text-3xl font-black tracking-tight">
        {categoryGeneratedIndex.title}
      </h1>
      {categoryGeneratedIndex.description && <p>{categoryGeneratedIndex.description}</p>}
    </div>
  )
}
