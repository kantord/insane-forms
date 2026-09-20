import { useSnippets } from '../hooks/useSnippets'

/** Renders a build-time-highlighted snippet (see plugins/snippets-plugin.ts)
 * — zero syntax highlighter ships to the browser. */
export const CodePane = ({ id }: { id: string }) => {
  const { snippets } = useSnippets()
  return (
    <div
      className="carbon h-full min-h-0 overflow-auto font-code text-[0.8rem] leading-relaxed"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
      dangerouslySetInnerHTML={{ __html: snippets[id] ?? '' }}
    />
  )
}
