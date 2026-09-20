/**
 * Labelled code listing built from CodeLine + Token.
 * @startingPoint section="Content" subtitle="Duotone code listing" viewport="700x300"
 */
export interface CodeBlockProps {
  /** accent eyebrow above the listing */
  label?: string
  /** boxed = tinted ground inside a rule; bare = sits directly on the page */
  boxed?: boolean
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function CodeBlock(props: CodeBlockProps): JSX.Element
