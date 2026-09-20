/** Mono run inside prose. No background, no border — it inherits its colour. */
export interface InlineCodeProps {
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function InlineCode(props: InlineCodeProps): JSX.Element
