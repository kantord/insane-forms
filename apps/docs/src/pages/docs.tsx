import Head from '@docusaurus/Head'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'

/** The right-hand pane for the persistent sidebar (src/theme/Root.tsx):
 * embeds one Storybook page — a story canvas or an autodocs page — picked by
 * `id`/`mode` in the query string, which the sidebar sets when you click an
 * entry. No per-story routes: Storybook can grow or rename stories freely,
 * nothing here needs to know about it beyond "read the query string". */
export default function Docs() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const id = params.get('id')
  const mode = params.get('mode') === 'docs' ? 'docs' : 'story'
  const iframeSrc = useBaseUrl(`/storybook/iframe.html?id=${id}&viewMode=${mode}`)

  return (
    <>
      <Head>
        <title>docs | insane-forms</title>
      </Head>
      {id ? (
        <iframe key={id} className="h-full w-full border-0" src={iframeSrc} title={id} />
      ) : (
        <div className="flex h-full items-center justify-center bg-paper font-mono text-dim">
          <p className="max-w-sm text-center text-[0.9rem]">
            Pick a page from the sidebar — every Storybook story and component doc lives here.
          </p>
        </div>
      )}
    </>
  )
}
